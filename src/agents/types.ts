import { PulseSightReading } from '../services/PulseSightService';

export interface AcousticBiomarkers {
  speakingRateWpm: number;
  pauseCount: number;
  meanPauseDurationSec: number;
  initiationLatencySec: number;
  articulationTimeRatio: number;
  rhythmStabilityIndex: number; // 0.0 - 1.0
  pitchVariabilityHz: number;
  tremorIndex: number; // 0.0 - 1.0
  voiceEnergyDb: number;
  rawPcmData?: Float32Array;
}

export interface PhonemeSubstitution {
  targetPhoneme: string;
  substitutedPhoneme: string;
  word: string;
  position: 'initial' | 'medial' | 'final';
  confidence: number;
  errorType: 'substitution' | 'omission' | 'distortion' | 'addition';
}

export interface CommunicationPhenotype {
  primaryDeficit: string;
  secondaryDeficit: string;
  cognitiveLayerScore: number; // 0.0 - 1.0
  motorPlanningScore: number; // 0.0 - 1.0
  sensoryMotorSyncScore: number; // 0.0 - 1.0
  severity: 'mild' | 'moderate' | 'severe';
  summary: string;
  phonemeErrors: PhonemeSubstitution[];
}

export interface SensoryIntervention {
  id: string;
  modality: 'haptic' | 'auditory_metronome' | 'visual_motor' | 'combined';
  bpm: number;
  hapticPattern: '1-2-3-4' | 'tap-tap-pause-tap' | 'ascending_sync' | 'calming_wave';
  hapticIntensityPercent: number; // 0 - 100
  pulseDurationMs: number;
  visualCueType: 'mouth_shape' | 'finger_tap_prompt' | 'tempo_bar' | 'none';
  targetPhonemeFocus: string;
  difficultyLevel: number; // 1 - 10
  clinicalRationale: string;
}

export interface MicroExperiment {
  experimentId: string;
  evidenceKind: 'synthetic-projection' | 'measured-controlled-trial';
  hypothesis: string;
  conditionA: {
    name: string;
    sensoryCue: string;
    sentencesCount: number;
    accuracy: number;
    avgPauseSec: number;
    wpm: number;
  };
  conditionB: {
    name: string;
    sensoryCue: string;
    sentencesCount: number;
    accuracy: number;
    avgPauseSec: number;
    wpm: number;
  };
  deltaAccuracy: number;
  deltaPauseReductionPercent: number;
  winningCondition: string;
  reinforcementReward: number;
  learnedInsight: string;
}

export interface PatientDigitalTwin {
  patientId: string;
  name: string;
  age: number;
  clinicalCondition: string;
  sessionsCompleted: number;
  articulationScore: number; // 0.0 - 1.0
  rhythmStability: number; // 0.0 - 1.0
  initiationFluency: number; // 0.0 - 1.0
  hapticResponsiveness: number; // 0.0 - 1.0
  visualResponsiveness: number; // 0.0 - 1.0
  learningVelocity: number; // 0.0 - 1.0
  fatigueThreshold: number; // 0.0 - 1.0
  preferredBpm: number;
  preferredModality: string;
  historicalTrajectory: Array<{
    session: number;
    articulation: number;
    rhythm: number;
    fluency: number;
    wpm: number;
    pauseSec: number;
  }>;
}

export interface SafetyGuardResult {
  passed: boolean;
  actuationPermitted: boolean; // Fail-closed hardware gate
  requiresImmediateRest: boolean;
  fatigueRisk: 'low' | 'moderate' | 'high';
  stimulusIntensitySafe: boolean;
  therapistApprovalRequired: boolean;
  clinicalBoundaryViolations: string[];
  sanitizedClinicalRationale: string;
  fatigueIndex: number; // 0.0 - 1.0
}

export interface ClinicianApproval {
  sessionId: string;
  patientId: string;
  approvedAt: string;
  approvedBy: string;
  safetyAcknowledged: true;
}

export interface ProgressReport {
  evidenceKind: 'stored-synthetic-history-comparison';
  baselineSource: string;
  assessmentTimeReductionPercent: number;
  wpmImprovementPercent: number;
  pauseReductionPercent: number;
  accuracyDelta: number;
  quantifiedClinicalScore: number;
  therapistSummaryMarkdown: string;
  comparativeMatrix: {
    parameter: string;
    traditionalBaseline: string;
    neuroBridgeSenseAssist: string;
    quantifiedAdvantage: string;
  }[];
}

export interface AgentTraceEvent {
  agentId: string;
  agentName: string;
  role: string;
  timestamp: string;
  status: 'running' | 'completed' | 'warning' | 'error';
  thought: string;
  observation: string;
  decision: string;
  outputData: any;
  executionTimeMs: number;
  badgeColor: string;
}

export interface SessionInputProvenance {
  /** Distinguishes a real capture from the bundled deterministic hackathon fixture. */
  source: 'live-microphone' | 'synthetic-preset';
  /** Identifies the exact text source supplied to the agents. */
  transcriptSource: 'browser-speech-recognition' | 'gemini-audio-transcription-reviewed' | 'user-corrected' | 'synthetic-fixture';
  label: string;
  capturedAt: string;
  recognitionWarning?: string;
}

export interface SessionRunResult {
  /** Assigned by the application when a completed result becomes the active session. */
  sessionId?: string;
  targetPhrase: string;
  spokenTranscript: string;
  audioDurationSec: number;
  inputProvenance: SessionInputProvenance;
  biomarkers: AcousticBiomarkers;
  phenotype: CommunicationPhenotype;
  pulseSight: PulseSightReading;
  reasoning: {
    longitudinalComparison: string;
    cognitiveVsMotorAnalysis: string;
    primaryTarget: string;
    confidence: number;
  };
  intervention: SensoryIntervention;
  experiment?: MicroExperiment;
  digitalTwin: PatientDigitalTwin;
  safety: SafetyGuardResult;
  progress: ProgressReport;
  traceEvents: AgentTraceEvent[];
}
