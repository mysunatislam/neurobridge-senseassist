import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ClinicianApproval, SafetyGuardResult } from '../src/agents/types';
import {
  evaluateActuationGate,
  type ActuationSafetyContext
} from '../src/services/ActuationSafetyGate';
import { HapticController } from '../src/services/HapticController';

const safety = (overrides: Partial<SafetyGuardResult> = {}): SafetyGuardResult => ({
  passed: true,
  actuationPermitted: true,
  requiresImmediateRest: false,
  fatigueRisk: 'low',
  stimulusIntensitySafe: true,
  therapistApprovalRequired: false,
  clinicalBoundaryViolations: [],
  sanitizedClinicalRationale: 'Objective acoustic observations.',
  fatigueIndex: 0.2,
  ...overrides
});

const context = (overrides: Partial<SafetyGuardResult> = {}): ActuationSafetyContext => ({
  sessionId: 'session-a',
  patientId: 'patient-a',
  safety: safety(overrides)
});

const approval = (overrides: Partial<ClinicianApproval> = {}): ClinicianApproval => ({
  sessionId: 'session-a',
  patientId: 'patient-a',
  approvedAt: '2026-08-30T10:00:00.000Z',
  approvedBy: 'Test clinician',
  safetyAcknowledged: true,
  ...overrides
});

afterEach(() => {
  vi.useRealTimers();
});

describe('evaluateActuationGate', () => {
  it('fails closed without a current session result', () => {
    expect(evaluateActuationGate(null, null)).toMatchObject({
      permitted: false,
      code: 'NO_ACTIVE_SESSION'
    });
  });

  it('permits an autonomously cleared result', () => {
    expect(evaluateActuationGate(context(), null)).toMatchObject({
      permitted: true,
      mode: 'autonomous',
      code: 'AUTONOMOUS_CLEARANCE'
    });
  });

  it('requires approval bound to the exact patient and session', () => {
    const gated = context({ actuationPermitted: false, therapistApprovalRequired: true });

    expect(evaluateActuationGate(gated, null).code).toBe('APPROVAL_REQUIRED');
    expect(evaluateActuationGate(gated, approval({ sessionId: 'old-session' })).code).toBe('STALE_APPROVAL');
    expect(evaluateActuationGate(gated, approval())).toMatchObject({
      permitted: true,
      mode: 'clinician-approved',
      code: 'CLINICIAN_APPROVAL'
    });
  });

  it('fails closed when approval-required and autonomous flags conflict', () => {
    const inconsistent = context({
      actuationPermitted: true,
      therapistApprovalRequired: true
    });

    expect(evaluateActuationGate(inconsistent, null)).toMatchObject({
      permitted: false,
      code: 'APPROVAL_REQUIRED'
    });
  });

  it('does not authorize a result whose safety screen did not pass', () => {
    expect(evaluateActuationGate(context({ passed: false, actuationPermitted: true }), null)).toMatchObject({
      permitted: false,
      code: 'SAFETY_VETO'
    });
  });

  it('never lets clinician approval override mandatory rest or unsafe intensity', () => {
    expect(evaluateActuationGate(context({
      actuationPermitted: false,
      therapistApprovalRequired: true,
      requiresImmediateRest: true
    }), approval()).code).toBe('MANDATORY_REST');

    expect(evaluateActuationGate(context({
      actuationPermitted: false,
      therapistApprovalRequired: true,
      stimulusIntensitySafe: false
    }), approval()).code).toBe('UNSAFE_STIMULUS');
  });
});

describe('HapticController gate and packet behavior', () => {
  it('blocks both continuous and single-pulse entry points by default', () => {
    const controller = new HapticController();
    const packet = {
      bpm: 80,
      pattern: '1-2-3-4' as const,
      intensity: 60,
      durationMs: 120,
      active: true
    };

    expect(controller.startPacing(packet).code).toBe('NO_ACTIVE_SESSION');
    expect(controller.triggerPulse(60, 120).code).toBe('NO_ACTIVE_SESSION');
    expect(controller.isPacing()).toBe(false);
  });

  it('uses the selected BPM/pattern and clamps intensity in BLE output', () => {
    vi.useFakeTimers();
    const controller = new HapticController();
    const writeValue = vi.fn();
    (controller as any).bleCharacteristic = { writeValue };
    controller.setSafetyContext(context());
    writeValue.mockClear();

    const decision = controller.startPacing({
      bpm: 96,
      pattern: 'calming_wave',
      intensity: 95,
      durationMs: 120,
      active: true
    });

    expect(decision.permitted).toBe(true);
    const activePayload = writeValue.mock.calls
      .map(([payload]) => Array.from(payload as Uint8Array))
      .find((payload) => payload[3] === 1);
    expect(activePayload?.[0]).toBe(96);
    expect(activePayload?.[1]).toBeLessThanOrEqual(80);
    expect(activePayload?.[2]).toBe(4);
    controller.stopPacing();
  });

  it('schedules the second 60 BPM beat after one interval, not two', () => {
    vi.useFakeTimers();
    const controller = new HapticController();
    const pulseListener = vi.fn();
    controller.addPulseListener(pulseListener);
    controller.setSafetyContext(context());
    controller.startPacing({
      bpm: 60,
      pattern: '1-2-3-4',
      intensity: 60,
      durationMs: 120,
      active: true
    });

    expect(pulseListener).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(999);
    expect(pulseListener).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(1);
    expect(pulseListener).toHaveBeenCalledTimes(2);
    controller.stopPacing();
  });

  it('stops an approval-gated cadence immediately when approval is revoked', () => {
    vi.useFakeTimers();
    const controller = new HapticController();
    const writeValue = vi.fn();
    (controller as any).bleCharacteristic = { writeValue };
    controller.setSafetyContext(context({
      actuationPermitted: false,
      therapistApprovalRequired: true
    }));
    controller.setClinicianApproval(approval());

    expect(controller.startPacing({
      bpm: 60,
      pattern: '1-2-3-4',
      intensity: 60,
      durationMs: 120,
      active: true
    }).permitted).toBe(true);
    expect(controller.isPacing()).toBe(true);

    controller.setClinicianApproval(null);

    expect(controller.isPacing()).toBe(false);
    const lastPayload = Array.from(writeValue.mock.calls.at(-1)?.[0] as Uint8Array);
    expect(lastPayload[3]).toBe(0);
  });
});
