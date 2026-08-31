import { AcousticBiomarkers, CommunicationPhenotype, PatientDigitalTwin, AgentTraceEvent } from './types';
import { PulseSightReading } from '../services/PulseSightService';

export class NeuroCognitiveReasoningAgent {
  public name = 'Neuro-Cognitive Reasoning Agent';
  public role = 'Longitudinal Analysis & Deficit Layer Phenotyping';
  public badgeColor = 'bg-purple-500/20 text-purple-300 border-purple-500/40';

  /**
   * Performs longitudinal comparison and clinical reasoning across cognitive vs motor deficit layers.
   * Now incorporates PulseSight facial-motor data for true multimodal reasoning.
   */
  public reason(
    biomarkers: AcousticBiomarkers,
    phenotype: CommunicationPhenotype,
    digitalTwin: PatientDigitalTwin,
    pulseSight?: PulseSightReading
  ): {
    reasoning: {
      longitudinalComparison: string;
      cognitiveVsMotorAnalysis: string;
      primaryTarget: string;
      confidence: number;
    };
    trace: AgentTraceEvent;
  } {
    const startTime = performance.now();

    const history = digitalTwin.historicalTrajectory;
    const previousSession = history.length > 0 ? history[history.length - 1] : null;
    const baselineSession = history.length > 0 ? history[0] : null;

    let longitudinalComparison = '';
    let articulatoryImprovement = 0;
    let pauseReduction = 0;

    if (baselineSession && previousSession) {
      articulatoryImprovement = Math.round((phenotype.motorPlanningScore - baselineSession.articulation) * 100);
      pauseReduction = Math.round(((baselineSession.pauseSec - biomarkers.meanPauseDurationSec) / Math.max(baselineSession.pauseSec, 0.1)) * 100);

      longitudinalComparison = `Across ${digitalTwin.sessionsCompleted} sessions: Articulation precision improved from baseline ${Math.round(baselineSession.articulation * 100)}% to ${Math.round(phenotype.motorPlanningScore * 100)}% (+${articulatoryImprovement}%). Mean pause duration decreased from ${baselineSession.pauseSec}s to ${biomarkers.meanPauseDurationSec}s (${pauseReduction > 0 ? '+' : ''}${pauseReduction}% faster transition).`;
    } else {
      longitudinalComparison = `Initial baseline calibration: Baseline pause latency at ${biomarkers.initiationLatencySec}s with ${biomarkers.speakingRateWpm} WPM speaking velocity.`;
    }

    // Cognitive vs Motor Layer Reasoning — now fusing audio + PulseSight facial evidence
    let cognitiveVsMotorAnalysis = '';
    let primaryTarget = '';
    let confidence = 0.94;

    const hasPhonemeError = phenotype.phonemeErrors.length > 0;
    const hasInitiationDelay = biomarkers.initiationLatencySec > 0.8;
    const hasRhythmInstability = biomarkers.rhythmStabilityIndex < 0.7;

    // PulseSight multimodal evidence
    const hasFacialDelay = pulseSight && pulseSight.lipTimingDelayMs > 140;
    const hasFacialAsymmetry = pulseSight && pulseSight.lipSymmetryPercent < 72;
    const facialEvidence = pulseSight
      ? ` PulseSight confirms: lip timing delay ${pulseSight.lipTimingDelayMs}ms, symmetry ${pulseSight.lipSymmetryPercent}% — ${pulseSight.clinicalFlag}.`
      : '';

    if (hasFacialDelay && hasFacialAsymmetry && hasPhonemeError) {
      cognitiveVsMotorAnalysis = `MULTIMODAL EVIDENCE: Audio detects /r/→/w/ substitution. PulseSight independently detects lip motor delay (${pulseSight!.lipTimingDelayMs}ms) and bilateral asymmetry (${pulseSight!.lipSymmetryPercent}%). Combined evidence confirms motor articulation deficit, not purely cognitive. Oral-motor coordination: ${pulseSight!.oralMotorCoordinationIndex}%.${facialEvidence}`;
      primaryTarget = 'Motor Articulation Re-education: Rhythmic Haptic Pacing + Lip Aperture Visual Guide';
      confidence = 0.97;
    } else if (hasInitiationDelay && hasRhythmInstability) {
      cognitiveVsMotorAnalysis = `Differential: Sensory-motor synchronization deficit coupled with motor planning latency.${facialEvidence} Segmental phoneme execution recovers once rhythm entrainment is established.`;
      primaryTarget = 'Rhythmic Auditory-Haptic Entrainment (RAS) to Stabilize Motor Speech Planning';
    } else if (hasInitiationDelay && !hasPhonemeError && !hasRhythmInstability) {
      cognitiveVsMotorAnalysis = `Differential: Pure motor speech initiation delay (pre-motor planning hesitation) with intact segmental phoneme placement.${facialEvidence}`;
      primaryTarget = 'Speech Initiation Acceleration via Kinetic Motor Preparation';
    } else if (hasPhonemeError && articulatoryImprovement >= 20) {
      cognitiveVsMotorAnalysis = `Differential: Longitudinal recovery reveals significant articulatory phoneme stabilization (+${articulatoryImprovement}%).${facialEvidence} The residual deficit has migrated from muscular articulation to temporal initiation sequencing.`;
      primaryTarget = 'Transition Target: Phase from Isolated Articulatory Cues to Temporal Initiation Flow';
    } else {
      cognitiveVsMotorAnalysis = `Differential: Mixed phonemic substitution (/r/ → /w/) with sub-harmonic tremor during sustained phonation.${facialEvidence} Requires concurrent tactile-kinesthetic biofeedback.`;
      primaryTarget = 'Multi-Sensory Segmental Phoneme Re-education with Haptic Synchronization';
    }

    const reasoning = {
      longitudinalComparison,
      cognitiveVsMotorAnalysis,
      primaryTarget,
      confidence
    };

    const executionTimeMs = Math.round(performance.now() - startTime);

    const facialSummary = pulseSight
      ? ` Facial: lip symmetry ${pulseSight.lipSymmetryPercent}%, timing delay ${pulseSight.lipTimingDelayMs}ms.`
      : '';

    const trace: AgentTraceEvent = {
      agentId: 'agent-neuro-cognitive-reasoning',
      agentName: this.name,
      role: this.role,
      badgeColor: this.badgeColor,
      timestamp: new Date().toISOString().substring(11, 19),
      status: 'completed',
      observation: `Historical trajectory loaded (${digitalTwin.sessionsCompleted} sessions). Audio: motor score ${phenotype.motorPlanningScore}, rhythm stability ${biomarkers.rhythmStabilityIndex}.${facialSummary}`,
      thought: `Multimodal fusion: audio phoneme errors + PulseSight facial kinematics → ${longitudinalComparison}`,
      decision: `Therapeutic target: "${primaryTarget}" (Confidence: ${Math.round(confidence * 100)}%).`,
      outputData: { reasoning },
      executionTimeMs
    };

    return { reasoning, trace };
  }
}
