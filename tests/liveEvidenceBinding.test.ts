import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AgentOrchestrator } from '../src/agents/AgentOrchestrator';
import { PATIENT_CASES } from '../src/services/MockPatientCases';

afterEach(() => {
  vi.useRealTimers();
});

describe('live evidence binding', () => {
  it('keeps a correct reviewed transcript unchanged and emits exactly seven real trace events', async () => {
    vi.useFakeTimers();
    const target = 'The red rabbit runs through the green grass';
    const provenance = {
      source: 'live-microphone' as const,
      transcriptSource: 'user-corrected' as const,
      label: 'Test reviewed live transcript',
      capturedAt: '2026-08-31T00:00:00.000Z'
    };

    const pending = new AgentOrchestrator().executeSessionCycle(
      target,
      target,
      4.5,
      [],
      [124, 125, 126, 125],
      -24,
      PATIENT_CASES[0].digitalTwin,
      undefined,
      provenance
    );
    await vi.runAllTimersAsync();
    const result = await pending;

    expect(result.spokenTranscript).toBe(target);
    expect(result.inputProvenance).toEqual(provenance);
    expect(result.phenotype.phonemeErrors).toEqual([]);
    expect(result.traceEvents).toHaveLength(7);
    expect(new Set(result.traceEvents.map((event) => event.agentId)).size).toBe(7);
    expect(result.traceEvents.some((event) => event.agentId.includes('pulsesight'))).toBe(false);
  });

  it('contains no scripted impaired transcript or fabricated retry gain in the live-results component', () => {
    const componentPath = fileURLToPath(new URL('../src/components/LiveTherapySession.tsx', import.meta.url));
    const source = readFileSync(componentPath, 'utf8');

    expect(source).not.toMatch(/wed wabbit/i);
    expect(source).not.toMatch(/\+60\.4%|48% accuracy|77% accuracy|100% Pipeline Verification/i);
    expect(source).not.toMatch(/lastSessionResult\.pulseSight/);
  });
});
