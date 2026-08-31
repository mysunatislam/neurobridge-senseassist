import { AcousticBiomarkers, CommunicationPhenotype, PatientDigitalTwin, AgentTraceEvent } from './types';

export class NeuroCognitiveReasoningAgent {
  public name = 'Neuro-Cognitive Reasoning Agent';
  public role = 'Longitudinal Analysis & Deficit Layer Phenotyping';
  public badgeColor = 'bg-purple-500/20 text-purple-300 border-purple-500/40';

  /**
   * Produces prototype heuristics from speech-derived features and stored fixture history.
   */
  public reason(
    biomarkers: AcousticBiomarkers,
    phenotype: CommunicationPhenotype,
    digitalTwin: PatientDigitalTwin
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

    // Speech-derived heuristic reasoning. No camera features are fused here.
    let cognitiveVsMotorAnalysis = '';
    let primaryTarget = '';
    let confidence = 0.94;

    const hasPhonemeError = phenotype.phonemeErrors.length > 0;
    const hasInitiationDelay = biomarkers.initiationLatencySec > 0.8;
    const hasRhythmInstability = biomarkers.rhythmStabilityIndex < 0.7;

    if (hasInitiationDelay && hasRhythmInstability) {
      cognitiveVsMotorAnalysis = 'Prototype heuristic: the supplied speech features show initiation delay and rhythm instability. This is not a neurological diagnosis and requires clinician interpretation.';
      primaryTarget = 'Rhythmic Auditory-Haptic Entrainment (RAS) to Stabilize Motor Speech Planning';
    } else if (hasInitiationDelay && !hasPhonemeError && !hasRhythmInstability) {
      cognitiveVsMotorAnalysis = 'Prototype heuristic: initiation delay is present while configured substitution and rhythm checks are clear. This is not a diagnosis.';
      primaryTarget = 'Speech Initiation Acceleration via Kinetic Motor Preparation';
    } else if (hasPhonemeError && articulatoryImprovement >= 20) {
      cognitiveVsMotorAnalysis = `Prototype heuristic: the current speech-text proxy differs from the stored synthetic baseline by ${articulatoryImprovement} points. The comparison is not clinical evidence.`;
      primaryTarget = 'Transition Target: Phase from Isolated Articulatory Cues to Temporal Initiation Flow';
    } else {
      cognitiveVsMotorAnalysis = hasPhonemeError
        ? 'Prototype heuristic: configured text substitutions were detected in the supplied transcript. Audio-only evidence cannot establish a neurological cause.'
        : 'Prototype heuristic: no configured text substitution was detected. Other proxy features still require clinician review.';
      primaryTarget = 'Multi-Sensory Segmental Phoneme Re-education with Haptic Synchronization';
    }

    const reasoning = {
      longitudinalComparison,
      cognitiveVsMotorAnalysis,
      primaryTarget,
      confidence
    };

    const executionTimeMs = Math.round(performance.now() - startTime);

    const trace: AgentTraceEvent = {
      agentId: 'agent-neuro-cognitive-reasoning',
      agentName: this.name,
      role: this.role,
      badgeColor: this.badgeColor,
      timestamp: new Date().toISOString().substring(11, 19),
      status: 'completed',
      observation: `Stored fixture trajectory loaded (${digitalTwin.sessionsCompleted} sessions). Speech-motor proxy ${phenotype.motorPlanningScore}, rhythm proxy ${biomarkers.rhythmStabilityIndex}. No camera measurement was supplied.`,
      thought: `Speech-derived prototype heuristic with stored trajectory context: ${longitudinalComparison}`,
      decision: `Suggested practice target: "${primaryTarget}" (heuristic score: ${Math.round(confidence * 100)}%).`,
      outputData: { reasoning },
      executionTimeMs
    };

    return { reasoning, trace };
  }
}
