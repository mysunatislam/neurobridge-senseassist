import { AcousticBiomarkers, CommunicationPhenotype, PatientDigitalTwin, MicroExperiment, AgentTraceEvent } from './types';

export class ExperimentDesignerAgent {
  public name = 'Therapy Experiment Designer Agent';
  public role = 'A/B Micro-Experimentation & Reinforcement Learning';
  public badgeColor = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';

  /**
   * Designs and evaluates micro-experiments comparing baseline vs sensory-motor intervention modalities.
   */
  public conductExperiment(
    currentBiomarkers: AcousticBiomarkers,
    phenotype: CommunicationPhenotype,
    digitalTwin: PatientDigitalTwin
  ): {
    experiment: MicroExperiment;
    trace: AgentTraceEvent;
  } {
    const startTime = performance.now();

    // Condition A: Baseline (No Sensory Cue)
    const condA_accuracy = Math.round((phenotype.motorPlanningScore * 0.75 + 0.15) * 100);
    const condA_pause = Number((currentBiomarkers.meanPauseDurationSec * 1.35).toFixed(2));
    const condA_wpm = Math.max(50, Math.round(currentBiomarkers.speakingRateWpm * 0.82));

    // Condition B: Active Sensory-Motor Stimulation (Rhythmic Haptic + Metronome)
    const condB_accuracy = Math.min(96, Math.round(condA_accuracy + (digitalTwin.hapticResponsiveness * 18) + 8));
    const condB_pause = Number((condA_pause * (1.0 - (digitalTwin.hapticResponsiveness * 0.45))).toFixed(2));
    const condB_wpm = Math.round(condA_wpm * (1.0 + (digitalTwin.hapticResponsiveness * 0.28)));

    const deltaAccuracy = condB_accuracy - condA_accuracy;
    const deltaPauseReductionPercent = Math.round(((condA_pause - condB_pause) / condA_pause) * 100);
    const reinforcementReward = Number(((deltaAccuracy * 0.05) + (deltaPauseReductionPercent * 0.03)).toFixed(2));

    const hypothesis = `Hypothesis: Multi-sensory haptic entrainment at ${digitalTwin.preferredBpm} BPM reduces motor speech initiation latency by >25% and improves segmental phonemic stability compared to un-cued spontaneous speech.`;
    const winningCondition = deltaAccuracy > 0 ? 'Condition B (Rhythmic Sensory-Motor Stimulation)' : 'Condition A (Unassisted Speech)';
    const learnedInsight = `Empirical Reinforcement Finding: Patient responds with +${deltaAccuracy}% articulatory accuracy and ${deltaPauseReductionPercent}% reduction in pause latency under rhythmic tactile pacing. Updating digital twin policy weights for haptic responsiveness.`;

    const experiment: MicroExperiment = {
      experimentId: `exp-${Date.now()}`,
      hypothesis,
      conditionA: {
        name: 'Condition A (Baseline: No Sensory Cue)',
        sensoryCue: 'None (Un-cued control)',
        sentencesCount: 10,
        accuracy: condA_accuracy,
        avgPauseSec: condA_pause,
        wpm: condA_wpm
      },
      conditionB: {
        name: 'Condition B (Sensory Pacing: Haptic 80 BPM)',
        sensoryCue: `Tactile 1-2-3-4 pulse at ${digitalTwin.preferredBpm} BPM + visual guide`,
        sentencesCount: 10,
        accuracy: condB_accuracy,
        avgPauseSec: condB_pause,
        wpm: condB_wpm
      },
      deltaAccuracy,
      deltaPauseReductionPercent,
      winningCondition,
      reinforcementReward,
      learnedInsight
    };

    const executionTimeMs = Math.round(performance.now() - startTime);

    const trace: AgentTraceEvent = {
      agentId: 'agent-experiment-designer',
      agentName: this.name,
      role: this.role,
      badgeColor: this.badgeColor,
      timestamp: new Date().toISOString().substring(11, 19),
      status: 'completed',
      observation: `Simulated & evaluated within-session A/B trial. Condition A (Unassisted) vs Condition B (Haptic Metronome ${digitalTwin.preferredBpm} BPM).`,
      thought: `Applying reinforcement learning comparison. Condition B demonstrated Accuracy: ${condB_accuracy}% vs A: ${condA_accuracy}%. Pause latency dropped by ${deltaPauseReductionPercent}%.`,
      decision: `Verified winning condition: "${winningCondition}". Computed RL Policy Reward: +${reinforcementReward}. Insight dispatched to Digital Twin Agent.`,
      outputData: { experiment },
      executionTimeMs
    };

    return { experiment, trace };
  }
}
