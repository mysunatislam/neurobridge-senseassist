import { describe, expect, it } from 'vitest';
import { SafetyBoundaryAgent } from '../src/agents/SafetyBoundaryAgent';
import type { AcousticBiomarkers, SensoryIntervention } from '../src/agents/types';

const biomarkers = (overrides: Partial<AcousticBiomarkers> = {}): AcousticBiomarkers => ({
  speakingRateWpm: 80,
  pauseCount: 2,
  meanPauseDurationSec: 0.7,
  initiationLatencySec: 0.4,
  articulationTimeRatio: 0.7,
  rhythmStabilityIndex: 0.75,
  pitchVariabilityHz: 18,
  tremorIndex: 0.2,
  voiceEnergyDb: -24,
  ...overrides
});

const intervention = (overrides: Partial<SensoryIntervention> = {}): SensoryIntervention => ({
  id: 'intervention-test',
  modality: 'combined',
  bpm: 80,
  hapticPattern: '1-2-3-4',
  hapticIntensityPercent: 65,
  pulseDurationMs: 120,
  visualCueType: 'mouth_shape',
  targetPhonemeFocus: 'p',
  difficultyLevel: 5,
  clinicalRationale: 'Objective speech practice.',
  ...overrides
});

describe('SafetyBoundaryAgent actuator policy', () => {
  it('allows a safe low-difficulty intervention autonomously', () => {
    const { safety } = new SafetyBoundaryAgent().evaluate(
      biomarkers(),
      intervention(),
      'Objective acoustic observations.'
    );
    expect(safety).toMatchObject({
      passed: true,
      actuationPermitted: true,
      requiresImmediateRest: false,
      therapistApprovalRequired: false
    });
  });

  it('routes safe high-difficulty escalation to clinician approval', () => {
    const { safety } = new SafetyBoundaryAgent().evaluate(
      biomarkers(),
      intervention({ difficultyLevel: 8 }),
      'Objective acoustic observations.'
    );
    expect(safety).toMatchObject({
      passed: true,
      actuationPermitted: false,
      therapistApprovalRequired: true
    });
  });

  it('hard-blocks fatigue and over-limit intensity instead of making them approvable', () => {
    const fatigued = new SafetyBoundaryAgent().evaluate(
      biomarkers({ tremorIndex: 1, meanPauseDurationSec: 2.5, pitchVariabilityHz: 40 }),
      intervention({ difficultyLevel: 9 }),
      'Objective acoustic observations.'
    ).safety;
    expect(fatigued.requiresImmediateRest).toBe(true);
    expect(fatigued.therapistApprovalRequired).toBe(false);
    expect(fatigued.actuationPermitted).toBe(false);

    const proposed = intervention({ hapticIntensityPercent: 95 });
    const tooIntense = new SafetyBoundaryAgent().evaluate(
      biomarkers(),
      proposed,
      'Objective acoustic observations.'
    ).safety;
    expect(tooIntense.stimulusIntensitySafe).toBe(false);
    expect(tooIntense.actuationPermitted).toBe(false);
    expect(proposed.hapticIntensityPercent).toBe(80);
  });
});
