import { AcousticBiomarkers, CommunicationPhenotype, PatientDigitalTwin, MicroExperiment, AgentTraceEvent } from './types';

export class DigitalTwinAgent {
  public name = 'Digital Twin Patient Model Agent';
  public role = 'Ephemeral Scenario State & Trajectory Projection';
  public badgeColor = 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40';

  /**
   * Returns an in-memory scenario update. Persistent patient-state validation is
   * outside this prototype.
   */
  public updateTwin(
    currentTwin: PatientDigitalTwin,
    biomarkers: AcousticBiomarkers,
    phenotype: CommunicationPhenotype,
    experiment?: MicroExperiment
  ): {
    updatedTwin: PatientDigitalTwin;
    prediction: {
      nextSessionTargetWpm: number;
      projectedAccuracy: number;
      recommendedBpm: number;
      adaptiveGrowthRate: number;
    };
    trace: AgentTraceEvent;
  } {
    const startTime = performance.now();

    // Learning velocity smoothing factor (exponential moving average)
    const alpha = 0.25;

    const newArticulation = Number(
      (currentTwin.articulationScore * (1 - alpha) + phenotype.motorPlanningScore * alpha).toFixed(2)
    );
    const newRhythm = Number(
      (currentTwin.rhythmStability * (1 - alpha) + biomarkers.rhythmStabilityIndex * alpha).toFixed(2)
    );
    const newFluency = Number(
      (
        currentTwin.initiationFluency * (1 - alpha) +
        Math.max(0.2, 1.0 - (biomarkers.meanPauseDurationSec / 3.0)) * alpha
      ).toFixed(2)
    );

    // Update responsiveness based on experiment reward
    let newHapticResp = currentTwin.hapticResponsiveness;
    if (experiment?.evidenceKind === 'measured-controlled-trial' && experiment.deltaAccuracy > 0) {
      newHapticResp = Number(Math.min(0.98, currentTwin.hapticResponsiveness + 0.04).toFixed(2));
    }

    const newSessionNumber = currentTwin.sessionsCompleted + 1;

    // Append new data point to history
    const updatedHistory = [
      ...currentTwin.historicalTrajectory,
      {
        session: newSessionNumber,
        articulation: newArticulation,
        rhythm: newRhythm,
        fluency: newFluency,
        wpm: biomarkers.speakingRateWpm,
        pauseSec: biomarkers.meanPauseDurationSec
      }
    ];

    const updatedTwin: PatientDigitalTwin = {
      ...currentTwin,
      sessionsCompleted: newSessionNumber,
      articulationScore: newArticulation,
      rhythmStability: newRhythm,
      initiationFluency: newFluency,
      hapticResponsiveness: newHapticResp,
      historicalTrajectory: updatedHistory
    };

    // Forward Predictive Simulation
    const adaptiveGrowthRate = Number(((newArticulation - currentTwin.articulationScore) + 0.05).toFixed(3));
    const nextSessionTargetWpm = Math.round(biomarkers.speakingRateWpm * 1.08);
    const projectedAccuracy = Number(Math.min(0.98, newArticulation + 0.06).toFixed(2));
    const recommendedBpm = newRhythm > 0.75 ? Math.min(100, currentTwin.preferredBpm + 4) : currentTwin.preferredBpm;

    const prediction = {
      nextSessionTargetWpm,
      projectedAccuracy,
      recommendedBpm,
      adaptiveGrowthRate
    };

    const executionTimeMs = Math.round(performance.now() - startTime);

    const trace: AgentTraceEvent = {
      agentId: 'agent-digital-twin',
      agentName: this.name,
      role: this.role,
      badgeColor: this.badgeColor,
      timestamp: new Date().toISOString().substring(11, 19),
      status: 'completed',
      observation: `Ingested session #${newSessionNumber} metrics. Articulation=${newArticulation}, Rhythm=${newRhythm}, Fluency=${newFluency}.`,
      thought: `Computed an in-memory scenario update. Haptic responsiveness remains ${(newHapticResp * 100).toFixed(0)}% because synthetic projections cannot update it as evidence. Next-run target is a model projection, not a recovery forecast.`,
      decision: `Returned an ephemeral scenario state for [${currentTwin.patientId}: ${currentTwin.name}]. Suggested sandbox pacing target: ${recommendedBpm} BPM; nothing was persisted to an EHR.`,
      outputData: { updatedTwin, prediction },
      executionTimeMs
    };

    return { updatedTwin, prediction, trace };
  }
}
