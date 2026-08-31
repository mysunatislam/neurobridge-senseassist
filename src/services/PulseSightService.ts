/**
 * PulseSightService — Simulated facial-motor perception module.
 *
 * In a hardware deployment this would stream from a MediaPipe landmark
 * pipeline trained on lip/jaw kinematics. For the demo we derive
 * realistic, _deterministic_ values from the phoneme error profile so
 * the multimodal story is self-consistent.
 */

export interface PulseSightReading {
  /** 0–100 — bilateral muscular symmetry of the lip corner levators */
  lipSymmetryPercent: number;

  /** ms — delay between acoustic onset and first visible lip aperture */
  lipTimingDelayMs: number;

  /** 0–100 — coordination of jaw displacement with phoneme boundary */
  oralMotorCoordinationIndex: number;

  /** m/s — peak jaw opening velocity (articulatory speed proxy) */
  jawVelocityMs: number;

  /** 0.0–1.0 — overall facial-motor confidence used by the Reasoning Agent */
  facialMotorConfidence: number;

  /** Human-readable clinical interpretation */
  clinicalFlag: string;

  /** Which modality PulseSight recommends based on its analysis */
  recommendedIntervention: 'rhythmic_haptic' | 'visual_mirror' | 'combined' | 'none';
}

/**
 * Derives a PulseSight reading from speech-layer evidence.
 * @param phonemeErrorCount   number of detected phoneme substitutions
 * @param initiationLatencySec  acoustic initiation latency from AudioAnalyzer
 * @param rhythmStabilityIndex  0–1 rhythm score from SpeechPerceptionAgent
 */
export function simulatePulseSight(
  phonemeErrorCount: number,
  initiationLatencySec: number,
  rhythmStabilityIndex: number
): PulseSightReading {
  // Base symmetry drops by 4 points per phoneme error, capped at a floor of 52
  const lipSymmetryPercent = Math.max(52, 94 - phonemeErrorCount * 4 - Math.round(initiationLatencySec * 6));

  // Timing delay correlates with initiation latency
  const lipTimingDelayMs = Math.round(initiationLatencySec * 180 + phonemeErrorCount * 12);

  // Coordination drops when rhythm is unstable
  const oralMotorCoordinationIndex = Math.max(
    38,
    Math.round(rhythmStabilityIndex * 100 - phonemeErrorCount * 3)
  );

  // Jaw velocity inversely correlates with hesitation
  const jawVelocityMs = parseFloat((0.52 - initiationLatencySec * 0.06).toFixed(2));

  // Overall facial-motor confidence (drives reasoning agent weighting)
  const facialMotorConfidence = parseFloat(
    Math.max(0.45, 1 - phonemeErrorCount * 0.08 - initiationLatencySec * 0.05).toFixed(2)
  );

  // Clinical flag logic
  let clinicalFlag: string;
  let recommendedIntervention: PulseSightReading['recommendedIntervention'];

  if (lipSymmetryPercent < 65 && oralMotorCoordinationIndex < 55) {
    clinicalFlag = 'Bilateral asymmetry + motor coordination deficit — motor articulation training indicated';
    recommendedIntervention = 'combined';
  } else if (lipTimingDelayMs > 180) {
    clinicalFlag = 'Lip timing delay detected — rhythmic entrainment cue recommended';
    recommendedIntervention = 'rhythmic_haptic';
  } else if (lipSymmetryPercent < 75) {
    clinicalFlag = 'Mild lip asymmetry — visual mirror biofeedback recommended';
    recommendedIntervention = 'visual_mirror';
  } else {
    clinicalFlag = 'Facial-motor output within normal range — speech-level intervention sufficient';
    recommendedIntervention = 'none';
  }

  return {
    lipSymmetryPercent,
    lipTimingDelayMs,
    oralMotorCoordinationIndex,
    jawVelocityMs,
    facialMotorConfidence,
    clinicalFlag,
    recommendedIntervention
  };
}
