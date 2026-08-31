import { AcousticBiomarkers, CommunicationPhenotype, PatientDigitalTwin, MicroExperiment, AgentTraceEvent } from './types';

export class ExperimentDesignerAgent {
  public name = 'Therapy Experiment Designer Agent';
  public role = 'Synthetic A/B Projection & Policy Sandbox';
  public badgeColor = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';

  /**
   * Creates a deterministic proposal projection. It does not represent captured
   * pre/post utterances or an empirical treatment outcome.
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

    const hypothesis = `Controlled-trial proposal: compare uncued speech with ${digitalTwin.preferredBpm} BPM pacing using separately captured attempts and a clinician-defined scoring protocol.`;
    const winningCondition = deltaAccuracy > 0 ? 'Projected Condition B (Rhythmic Sensory-Motor Stimulation)' : 'Projected Condition A (Unassisted Speech)';
    const learnedInsight = `Synthetic policy projection only: the formula estimates a ${deltaAccuracy}-point score difference and ${deltaPauseReductionPercent}% pause difference. No A/B retries were captured, so this must not be treated as an empirical finding.`;

    const experiment: MicroExperiment = {
      experimentId: `exp-${Date.now()}`,
      evidenceKind: 'synthetic-projection',
      hypothesis,
      conditionA: {
        name: 'Condition A (Baseline: No Sensory Cue)',
        sensoryCue: 'None (Un-cued control)',
        sentencesCount: 0,
        accuracy: condA_accuracy,
        avgPauseSec: condA_pause,
        wpm: condA_wpm
      },
      conditionB: {
        name: 'Condition B (Sensory Pacing: Haptic 80 BPM)',
        sensoryCue: `Tactile 1-2-3-4 pulse at ${digitalTwin.preferredBpm} BPM + visual guide`,
        sentencesCount: 0,
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
      observation: `No controlled A/B retry was captured. Generated a deterministic sandbox projection for unassisted versus ${digitalTwin.preferredBpm} BPM pacing.`,
      thought: `Formula output only: projected B score ${condB_accuracy} versus A ${condA_accuracy}; projected pause difference ${deltaPauseReductionPercent}%.`,
      decision: `Recorded "${winningCondition}" as a synthetic policy candidate with sandbox reward ${reinforcementReward}; not empirical evidence.`,
      outputData: { experiment },
      executionTimeMs
    };

    return { experiment, trace };
  }
}
