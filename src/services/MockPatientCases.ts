import { PatientDigitalTwin } from '../agents/types';

export interface PatientPresetCase {
  id: string;
  name: string;
  age: number;
  condition: string;
  defaultTargetPhrase: string;
  sampleSpokenTranscript: string;
  audioDurationSec: number;
  detectedPauses: Array<{ start: number; duration: number }>;
  pitchSamples: number[];
  rmsEnergyDb: number;
  digitalTwin: PatientDigitalTwin;
  clinicalNotes: string;
}

export const PATIENT_CASES: PatientPresetCase[] = [
  {
    id: 'NB-001',
    name: 'Arthur Vance',
    age: 64,
    condition: 'Post-Stroke Left MCA Infarct (Subacute Recovery)',
    defaultTargetPhrase: 'The red rabbit runs through the green grass',
    sampleSpokenTranscript: 'The ... wed wabbit wuns ... thwoo the gween gwaass',
    audioDurationSec: 5.4,
    detectedPauses: [
      { start: 0.6, duration: 1.4 },
      { start: 3.1, duration: 1.1 }
    ],
    pitchSamples: [118, 122, 114, 130, 116, 128],
    rmsEnergyDb: -19.2,
    clinicalNotes: 'Demonstrates characteristic /r/ -> /w/ substitutions and pre-motor speech initiation hesitation. Prior sessions show positive response to tactile metronomic stimulation.',
    digitalTwin: {
      patientId: 'NB-001',
      name: 'Arthur Vance',
      age: 64,
      clinicalCondition: 'Post-Stroke Left MCA Infarct',
      sessionsCompleted: 5,
      articulationScore: 0.68,
      rhythmStability: 0.58,
      initiationFluency: 0.62,
      hapticResponsiveness: 0.88,
      visualResponsiveness: 0.74,
      learningVelocity: 0.72,
      fatigueThreshold: 0.65,
      preferredBpm: 80,
      preferredModality: 'Rhythmic Haptic Vibration',
      historicalTrajectory: [
        { session: 1, articulation: 0.45, rhythm: 0.38, fluency: 0.40, wpm: 52, pauseSec: 2.6 },
        { session: 2, articulation: 0.52, rhythm: 0.44, fluency: 0.48, wpm: 58, pauseSec: 2.1 },
        { session: 3, articulation: 0.59, rhythm: 0.50, fluency: 0.55, wpm: 65, pauseSec: 1.8 },
        { session: 4, articulation: 0.64, rhythm: 0.54, fluency: 0.58, wpm: 70, pauseSec: 1.5 },
        { session: 5, articulation: 0.68, rhythm: 0.58, fluency: 0.62, wpm: 76, pauseSec: 1.3 }
      ]
    }
  },
  {
    id: 'NB-002',
    name: 'Elena Rostova',
    age: 58,
    condition: "Parkinson's Disease (Hoehn & Yahr Stage II - Hypophonia & Festination)",
    defaultTargetPhrase: 'Peter piper picked a peck of pickled peppers',
    sampleSpokenTranscript: 'P-peter ... picked ... peck ... pickled ... peppers',
    audioDurationSec: 4.8,
    detectedPauses: [
      { start: 0.4, duration: 1.2 },
      { start: 2.3, duration: 0.9 }
    ],
    pitchSamples: [145, 162, 138, 155, 140, 168],
    rmsEnergyDb: -28.4,
    clinicalNotes: 'Hypophonic vocal volume with voice tremor and accelerated syllable pacing (festination). Benefits from rigid cadence haptic anchoring at 72 BPM.',
    digitalTwin: {
      patientId: 'NB-002',
      name: 'Elena Rostova',
      age: 58,
      clinicalCondition: "Parkinson's Disease",
      sessionsCompleted: 4,
      articulationScore: 0.74,
      rhythmStability: 0.48,
      initiationFluency: 0.54,
      hapticResponsiveness: 0.92,
      visualResponsiveness: 0.68,
      learningVelocity: 0.65,
      fatigueThreshold: 0.55,
      preferredBpm: 72,
      preferredModality: 'Cadence Regulating Haptic Pacer',
      historicalTrajectory: [
        { session: 1, articulation: 0.66, rhythm: 0.35, fluency: 0.42, wpm: 60, pauseSec: 2.2 },
        { session: 2, articulation: 0.69, rhythm: 0.40, fluency: 0.46, wpm: 64, pauseSec: 1.9 },
        { session: 3, articulation: 0.71, rhythm: 0.45, fluency: 0.50, wpm: 68, pauseSec: 1.6 },
        { session: 4, articulation: 0.74, rhythm: 0.48, fluency: 0.54, wpm: 72, pauseSec: 1.4 }
      ]
    }
  },
  {
    id: 'NB-003',
    name: 'Marcus Chen',
    age: 29,
    condition: 'Traumatic Brain Injury (Apraxia of Speech & Syllable Sequencing)',
    defaultTargetPhrase: 'Blue butterfly blossoms brighten beautiful bouquets',
    sampleSpokenTranscript: 'B-blue ... but-ter ... fly ... bl-blossoms ... brighten ... bouquets',
    audioDurationSec: 6.2,
    detectedPauses: [
      { start: 0.8, duration: 1.6 },
      { start: 2.8, duration: 1.3 },
      { start: 4.5, duration: 1.0 }
    ],
    pitchSamples: [110, 115, 112, 118, 114],
    rmsEnergyDb: -16.8,
    clinicalNotes: 'Severe articulatory groping and motor planning sequencing blocks on multi-syllabic consonant clusters. Responds exceptionally well to dual visual-mouth cues and kinetic finger-tapping triggers.',
    digitalTwin: {
      patientId: 'NB-003',
      name: 'Marcus Chen',
      age: 29,
      clinicalCondition: 'Post-TBI Apraxia of Speech',
      sessionsCompleted: 6,
      articulationScore: 0.62,
      rhythmStability: 0.64,
      initiationFluency: 0.50,
      hapticResponsiveness: 0.82,
      visualResponsiveness: 0.94,
      learningVelocity: 0.80,
      fatigueThreshold: 0.70,
      preferredBpm: 65,
      preferredModality: 'Visual Motor + Tactile Sync',
      historicalTrajectory: [
        { session: 1, articulation: 0.38, rhythm: 0.42, fluency: 0.32, wpm: 40, pauseSec: 3.2 },
        { session: 2, articulation: 0.44, rhythm: 0.48, fluency: 0.38, wpm: 46, pauseSec: 2.8 },
        { session: 3, articulation: 0.50, rhythm: 0.53, fluency: 0.42, wpm: 52, pauseSec: 2.4 },
        { session: 4, articulation: 0.55, rhythm: 0.58, fluency: 0.45, wpm: 58, pauseSec: 2.0 },
        { session: 5, articulation: 0.59, rhythm: 0.61, fluency: 0.48, wpm: 62, pauseSec: 1.7 },
        { session: 6, articulation: 0.62, rhythm: 0.64, fluency: 0.50, wpm: 66, pauseSec: 1.5 }
      ]
    }
  }
];
