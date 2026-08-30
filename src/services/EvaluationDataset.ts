import { PatientDigitalTwin } from '../agents/types';

export type SafetyDisposition = 'allow' | 'block';

export interface SyntheticBenchmarkCase {
  id: string;
  title: string;
  scenario: string;
  isSafetyEdgeCase?: boolean;
  input: {
    targetPhrase: string;
    spokenTranscript: string;
    audioDurationSec: number;
    detectedPauses: Array<{ start: number; duration: number }>;
    pitchSamplesHz: number[];
    rmsEnergyDb: number;
    digitalTwin: PatientDigitalTwin;
  };
  expected: {
    safetyDisposition: SafetyDisposition;
    therapistApprovalRequired: boolean;
    immediateRestRequired: boolean;
    rationale: string;
  };
}

const twin = (
  patientId: string,
  name: string,
  age: number,
  scenario: string,
  preferredBpm: number,
  overrides: Partial<PatientDigitalTwin> = {}
): PatientDigitalTwin => ({
  patientId,
  name,
  age,
  clinicalCondition: `Synthetic scenario: ${scenario}`,
  sessionsCompleted: 1,
  articulationScore: 0.5,
  rhythmStability: 0.52,
  initiationFluency: 0.5,
  hapticResponsiveness: 0.85,
  visualResponsiveness: 0.82,
  learningVelocity: 0.72,
  fatigueThreshold: 0.7,
  preferredBpm,
  preferredModality: 'combined',
  historicalTrajectory: [],
  ...overrides
});

/**
 * Canonical synthetic regression dataset used by both the browser UI and CLI.
 * These are invented inputs for software behavior checks; they are not patient
 * records and do not establish diagnostic or clinical performance.
 */
export const SYNTHETIC_BENCHMARK_CASES: SyntheticBenchmarkCase[] = [
  {
    id: 'SYN-01',
    title: 'English initiation latency',
    scenario: 'Moderate initial hesitation with two pauses and an /r/ substitution.',
    input: {
      targetPhrase: 'The red rabbit runs through the green grass',
      spokenTranscript: 'The ... wed wabbit wuns ... thwoo the gween gwaass',
      audioDurationSec: 5.4,
      detectedPauses: [{ start: 0.2, duration: 1.4 }, { start: 2.8, duration: 1.1 }],
      pitchSamplesHz: [118, 122, 114, 130, 116, 128],
      rmsEnergyDb: -18.2,
      digitalTwin: twin('SYN-P01', 'Synthetic profile 01', 64, 'initiation latency', 80)
    },
    expected: { safetyDisposition: 'allow', therapistApprovalRequired: false, immediateRestRequired: false, rationale: 'Routine low-difficulty scenario with no encoded high-fatigue signal.' }
  },
  {
    id: 'SYN-02',
    title: 'Cadence instability',
    scenario: 'Three short pauses with variable pitch samples and low session difficulty.',
    input: {
      targetPhrase: 'Peter piper picked a peck of pickled peppers',
      spokenTranscript: 'P-peter ... picked ... peck ... pickled ... peppers',
      audioDurationSec: 4.8,
      detectedPauses: [{ start: 0.1, duration: 0.9 }, { start: 1.8, duration: 0.8 }, { start: 3.2, duration: 0.7 }],
      pitchSamplesHz: [145, 162, 138, 155, 140, 168],
      rmsEnergyDb: -22.4,
      digitalTwin: twin('SYN-P02', 'Synthetic profile 02', 58, 'cadence instability', 68, { rhythmStability: 0.45 })
    },
    expected: { safetyDisposition: 'allow', therapistApprovalRequired: false, immediateRestRequired: false, rationale: 'Rhythm support is expected without an actuation veto.' }
  },
  {
    id: 'SYN-03',
    title: 'Multisyllabic sequencing',
    scenario: 'Three moderate pauses during a multisyllabic phrase.',
    input: {
      targetPhrase: 'Blue butterfly blossoms brighten beautiful bouquets',
      spokenTranscript: 'B-blue ... but-ter ... fly ... bl-blossoms ... brighten',
      audioDurationSec: 6.2,
      detectedPauses: [{ start: 0.3, duration: 1.8 }, { start: 2.5, duration: 1.2 }, { start: 4.2, duration: 1.4 }],
      pitchSamplesHz: [110, 115, 112, 118, 114],
      rmsEnergyDb: -19,
      digitalTwin: twin('SYN-P03', 'Synthetic profile 03', 29, 'multisyllabic sequencing', 72, { hapticResponsiveness: 0.9 })
    },
    expected: { safetyDisposition: 'allow', therapistApprovalRequired: false, immediateRestRequired: false, rationale: 'The scenario expects a bounded cueing plan, not a safety block.' }
  },
  {
    id: 'SYN-04',
    title: 'Labial articulation cue',
    scenario: 'Two moderate pauses with a synthetic bilabial articulation mismatch.',
    input: {
      targetPhrase: 'Bright blue birds build beautiful broad nests',
      spokenTranscript: 'Bwight b-blue ... birds ... build ... nests',
      audioDurationSec: 5,
      detectedPauses: [{ start: 0.2, duration: 1.3 }, { start: 2.4, duration: 1 }],
      pitchSamplesHz: [130, 134, 128, 136, 131],
      rmsEnergyDb: -17.5,
      digitalTwin: twin('SYN-P04', 'Synthetic profile 04', 62, 'labial articulation cue', 76, { visualResponsiveness: 0.92 })
    },
    expected: { safetyDisposition: 'allow', therapistApprovalRequired: false, immediateRestRequired: false, rationale: 'Low-difficulty visual or haptic cueing should remain inside the gate.' }
  },
  {
    id: 'SYN-05',
    title: 'Fricative prolongation',
    scenario: 'Two pauses and repeated initial fricative tokens.',
    input: {
      targetPhrase: 'Simple sound samples stimulate speech sensations',
      spokenTranscript: 'Sss-simple ... sss-sound ... samples ... stimulate',
      audioDurationSec: 5.8,
      detectedPauses: [{ start: 0.4, duration: 1.6 }, { start: 2.8, duration: 1.2 }],
      pitchSamplesHz: [120, 126, 118, 128, 122],
      rmsEnergyDb: -20.1,
      digitalTwin: twin('SYN-P05', 'Synthetic profile 05', 47, 'fricative prolongation', 84, { hapticResponsiveness: 0.92 })
    },
    expected: { safetyDisposition: 'allow', therapistApprovalRequired: false, immediateRestRequired: false, rationale: 'No high-fatigue or high-difficulty condition is encoded.' }
  },
  {
    id: 'SYN-06',
    title: 'Non-fluent initiation',
    scenario: 'Two pauses in a short phrase with reduced initiation fluency.',
    input: {
      targetPhrase: 'Water waves wash warm white sand',
      spokenTranscript: 'Wa-ter ... waves ... wash ... sand',
      audioDurationSec: 5.6,
      detectedPauses: [{ start: 0.3, duration: 1.5 }, { start: 2.2, duration: 1.4 }],
      pitchSamplesHz: [135, 142, 130, 146, 138],
      rmsEnergyDb: -21,
      digitalTwin: twin('SYN-P06', 'Synthetic profile 06', 53, 'non-fluent initiation', 80, { initiationFluency: 0.4 })
    },
    expected: { safetyDisposition: 'allow', therapistApprovalRequired: false, immediateRestRequired: false, rationale: 'Routine pacing support is expected to remain available.' }
  },
  {
    id: 'SYN-07',
    title: 'Multilingual token handling',
    scenario: 'A Hindi-script target paired with a transliterated synthetic transcript.',
    input: {
      targetPhrase: 'लाल टमाटर टोकरी में रखे हैं',
      spokenTranscript: 'Laal ... tamaatar ... tokri ... me ... hai',
      audioDurationSec: 4.9,
      detectedPauses: [{ start: 0.2, duration: 1.2 }, { start: 2.1, duration: 1.1 }],
      pitchSamplesHz: [128, 132, 124, 136, 130],
      rmsEnergyDb: -19.5,
      digitalTwin: twin('SYN-P07', 'Synthetic profile 07', 60, 'multilingual token handling', 76)
    },
    expected: { safetyDisposition: 'allow', therapistApprovalRequired: false, immediateRestRequired: false, rationale: 'Language/script variation alone must not trigger a safety veto.' }
  },
  {
    id: 'SYN-08',
    title: 'Low-energy voice sample',
    scenario: 'A low-energy synthetic transcript with two moderate pauses.',
    input: {
      targetPhrase: 'Bonjour le soleil brille sur les collines',
      spokenTranscript: 'Bon-jour ... soleil ... brille ... collines',
      audioDurationSec: 5.2,
      detectedPauses: [{ start: 0.2, duration: 1.3 }, { start: 2.3, duration: 1.1 }],
      pitchSamplesHz: [140, 155, 136, 150, 142],
      rmsEnergyDb: -23.5,
      digitalTwin: twin('SYN-P08', 'Synthetic profile 08', 71, 'low-energy voice sample', 72)
    },
    expected: { safetyDisposition: 'allow', therapistApprovalRequired: false, immediateRestRequired: false, rationale: 'Low energy without the edge-case fatigue pattern is expected to allow bounded cueing.' }
  },
  {
    id: 'SYN-09',
    title: 'Fast cadence',
    scenario: 'Short pauses and a faster synthetic word rate.',
    input: {
      targetPhrase: 'Sakura blossoms drift gently on the river',
      spokenTranscript: 'Sa-kura ... blossoms ... drift ... river',
      audioDurationSec: 4.5,
      detectedPauses: [{ start: 0.1, duration: 0.8 }, { start: 1.6, duration: 0.7 }],
      pitchSamplesHz: [122, 128, 119, 130, 125],
      rmsEnergyDb: -20.8,
      digitalTwin: twin('SYN-P09', 'Synthetic profile 09', 66, 'fast cadence', 68, { rhythmStability: 0.47 })
    },
    expected: { safetyDisposition: 'allow', therapistApprovalRequired: false, immediateRestRequired: false, rationale: 'Cadence correction should not require clinician approval in this low-difficulty scenario.' }
  },
  {
    id: 'SYN-10',
    title: 'High-fatigue fail-closed edge case',
    scenario: 'Long pauses and wide pitch variation intended to trigger rest and clinician review.',
    isSafetyEdgeCase: true,
    input: {
      targetPhrase: 'Northern winter winds whistle through tall pine trees',
      spokenTranscript: 'Nor-thern ... win-ter ... winds ... whistle',
      audioDurationSec: 6.8,
      detectedPauses: [{ start: 0.5, duration: 2.1 }, { start: 3.2, duration: 1.8 }],
      pitchSamplesHz: [160, 185, 150, 192, 168],
      rmsEnergyDb: -24.8,
      digitalTwin: twin('SYN-P10', 'Synthetic profile 10', 42, 'high-fatigue fail-closed edge case', 64, {
        sessionsCompleted: 3,
        articulationScore: 0.34,
        rhythmStability: 0.38,
        initiationFluency: 0.28,
        fatigueThreshold: 0.35,
        preferredModality: 'fail_closed_rest'
      })
    },
    expected: { safetyDisposition: 'block', therapistApprovalRequired: false, immediateRestRequired: true, rationale: 'The deliberately high-fatigue edge case must fail closed for rest; this hard veto cannot be overridden by clinician approval.' }
  }
];
