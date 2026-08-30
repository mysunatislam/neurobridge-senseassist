import { describe, expect, it } from 'vitest';
import { fhirExportService } from '../src/services/FhirExportService';
import type { PatientDigitalTwin, SessionRunResult } from '../src/agents/types';

const mockDigitalTwin: PatientDigitalTwin = {
  patientId: 'PATIENT-TEST-01',
  name: 'Arthur Vance',
  age: 64,
  clinicalCondition: 'Post-Stroke Left MCA Infarct',
  sessionsCompleted: 5,
  articulationScore: 0.72,
  rhythmStability: 0.68,
  initiationFluency: 0.65,
  hapticResponsiveness: 0.85,
  visualResponsiveness: 0.80,
  learningVelocity: 0.75,
  fatigueThreshold: 0.70,
  preferredBpm: 80,
  preferredModality: 'tactile_metronome',
  historicalTrajectory: [
    {
      session: 1,
      articulation: 0.60,
      rhythm: 0.55,
      fluency: 0.50,
      wpm: 65,
      pauseSec: 2.1
    }
  ]
};

const mockSessionResult: SessionRunResult = {
  sessionId: 'PATIENT-TEST-01-session-12345',
  biomarkers: {
    fundamentalFrequencyHz: 124,
    jitterLocalPercent: 1.2,
    shimmerLocalPercent: 3.1,
    harmonicsToNoiseRatioDb: 18.5,
    formantF1Hz: 520,
    formantF2Hz: 1680,
    vowelSpaceAreaHz2: 245000,
    speakingRateWpm: 88,
    meanPauseDurationSec: 1.1,
    rhythmStabilityIndex: 0.78,
    dysarthriaSeverityIndex: 0.62
  },
  phenotype: {
    primaryDeficit: 'Motor Initiation Hesitation',
    severity: 'moderate',
    acousticCorrelates: ['Prolonged initial silence', 'Vowel formant centralisation'],
    motorPlanningScore: 0.75,
    rhythmStabilityScore: 0.78,
    phonemeErrors: [{ target: '/r/', perceived: '/w/', position: 'onset' }],
    clinicalSummary: 'Moderate articulation hesitation with preserved sensory tracking.'
  },
  reasoning: {
    deficitMechanism: 'Cortical motor initiation delay post-stroke',
    targetedBrainRegion: 'Supplementary Motor Area (SMA)',
    recommendedModality: 'haptic',
    rationale: 'Haptic rhythm bypasses damaged basal-cortical initiation circuits.',
    adaptationStrategy: 'Pacing at 80 BPM',
    targetDifficultyAdjustment: 0,
    primaryTarget: 'Motor speech cadence'
  },
  intervention: {
    modality: 'haptic',
    bpm: 80,
    hapticPattern: '1-2-3-4',
    hapticIntensityPercent: 65,
    visualCueType: 'lip_contour',
    audioCueVolumePercent: 50,
    difficultyLevel: 5,
    pulseDurationMs: 120
  },
  experiment: {
    id: 'exp-01',
    conditionA: {
      modality: 'audio',
      sensoryCue: 'Audio metronome',
      sentencesCount: 3,
      accuracy: 65,
      avgPauseSec: 1.8,
      wpm: 72
    },
    conditionB: {
      modality: 'haptic',
      sensoryCue: 'ESP32 tactile pacing',
      sentencesCount: 3,
      accuracy: 82,
      avgPauseSec: 1.1,
      wpm: 88
    },
    deltaAccuracy: 17,
    deltaPauseReductionPercent: 38.8,
    winningCondition: 'Condition B (Tactile Haptic Pacing)',
    reinforcementReward: 0.85,
    learnedInsight: 'Patient responds significantly better to tactile rhythmic entrainment.'
  },
  twin: mockDigitalTwin,
  safety: {
    passed: true,
    actuationPermitted: true,
    requiresImmediateRest: false,
    fatigueRisk: 'low',
    stimulusIntensitySafe: true,
    therapistApprovalRequired: false,
    clinicalBoundaryViolations: [],
    sanitizedClinicalRationale: 'Acoustic biomarkers indicate safe operating fatigue threshold.',
    fatigueIndex: 0.28
  },
  progress: {
    assessmentTimeReductionPercent: 91.2,
    wpmImprovementPercent: 35.4,
    pauseReductionPercent: 47.6,
    accuracyDelta: 17,
    quantifiedClinicalScore: 78.5,
    therapistSummaryMarkdown: 'Quantified progress indicates positive response to rhythmic pacing.',
    comparativeMatrix: {
      baselineAccuracy: 65,
      agentAccuracy: 82,
      baselineWpm: 72,
      agentWpm: 88,
      baselinePauseSec: 1.8,
      agentPauseSec: 1.1,
      baselineClinicianMinutes: 18.0,
      agentClinicianMinutes: 1.6
    }
  },
  traces: []
};

describe('FhirExportService', () => {
  it('generates a valid HL7 FHIR R4 Bundle resource', () => {
    const bundle = fhirExportService.generateFhirBundle(mockDigitalTwin, mockSessionResult);

    expect(bundle).toBeDefined();
    expect(bundle.resourceType).toBe('Bundle');
    expect(bundle.type).toBe('collection');
    expect(Array.isArray(bundle.entry)).toBe(true);
    expect(bundle.entry.length).toBeGreaterThanOrEqual(4);
  });

  it('includes Patient, Observation, DiagnosticReport, and CarePlan resources in the bundle', () => {
    const bundle = fhirExportService.generateFhirBundle(mockDigitalTwin, mockSessionResult);
    const resourceTypes = bundle.entry.map(e => e.resource.resourceType);

    expect(resourceTypes).toContain('Patient');
    expect(resourceTypes).toContain('Observation');
    expect(resourceTypes).toContain('DiagnosticReport');
    expect(resourceTypes).toContain('CarePlan');
  });

  it('embeds WHO ICF classification codes b320 and b330 for speech functions', () => {
    const bundle = fhirExportService.generateFhirBundle(mockDigitalTwin, mockSessionResult);
    const jsonString = JSON.stringify(bundle);

    expect(jsonString).toContain('b320'); // Articulation functions
    expect(jsonString).toContain('b330'); // Fluency and rhythm of speech functions
  });

  it('embeds research prototype non-device disclaimer in meta and notes', () => {
    const bundle = fhirExportService.generateFhirBundle(mockDigitalTwin, mockSessionResult);
    const jsonString = JSON.stringify(bundle);

    expect(jsonString.toLowerCase()).toContain('research prototype');
  });
});
