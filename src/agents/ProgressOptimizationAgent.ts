import { AcousticBiomarkers, CommunicationPhenotype, PatientDigitalTwin, ProgressReport, AgentTraceEvent } from './types';

export class ProgressOptimizationAgent {
  public name = 'Therapy Optimization & Progress Intelligence Agent';
  public role = 'Synthetic-History Comparison & Prototype Summary';
  public badgeColor = 'bg-blue-500/20 text-blue-300 border-blue-500/40';

  /**
   * Compares the current run with the selected scenario's stored synthetic
   * history. It does not estimate clinical efficacy or workflow savings.
   */
  public generateReport(
    biomarkers: AcousticBiomarkers,
    phenotype: CommunicationPhenotype,
    digitalTwin: PatientDigitalTwin
  ): {
    progress: ProgressReport;
    trace: AgentTraceEvent;
  } {
    const startTime = performance.now();
    const history = digitalTwin.historicalTrajectory;
    const baseline = history[0] || {
      wpm: biomarkers.speakingRateWpm,
      pauseSec: biomarkers.meanPauseDurationSec,
      articulation: phenotype.motorPlanningScore,
      rhythm: biomarkers.rhythmStabilityIndex
    };

    const wpmImprovementPercent = Math.round(
      ((biomarkers.speakingRateWpm - baseline.wpm) / Math.max(baseline.wpm, 1)) * 100
    );
    const pauseReductionPercent = Math.round(
      ((baseline.pauseSec - biomarkers.meanPauseDurationSec) / Math.max(baseline.pauseSec, 0.1)) * 100
    );
    const accuracyDelta = Math.round((phenotype.motorPlanningScore - baseline.articulation) * 100);
    const quantifiedClinicalScore = Math.round(
      (phenotype.motorPlanningScore * 0.4 +
        biomarkers.rhythmStabilityIndex * 0.3 +
        (biomarkers.speakingRateWpm / 120) * 0.3) * 100
    );

    const comparativeMatrix = [
      {
        parameter: 'Evidence source',
        traditionalBaseline: 'Selected scenario fixture history',
        neuroBridgeSenseAssist: 'Current prototype pipeline result',
        quantifiedAdvantage: 'Software comparison only; no clinical control group'
      },
      {
        parameter: 'Scenario values',
        traditionalBaseline: `${baseline.wpm} WPM, ${baseline.pauseSec}s pause, ${Math.round(baseline.articulation * 100)}% stored proxy`,
        neuroBridgeSenseAssist: `${biomarkers.speakingRateWpm} WPM, ${biomarkers.meanPauseDurationSec}s pause, ${Math.round(phenotype.motorPlanningScore * 100)}% current proxy`,
        quantifiedAdvantage: 'Requires repeated real captures before interpreting change'
      },
      {
        parameter: 'Validation status',
        traditionalBaseline: 'No recruited-participant baseline',
        neuroBridgeSenseAssist: '10 deterministic synthetic regression scenarios',
        quantifiedAdvantage: 'Engineering behavior tested; clinical performance unvalidated'
      }
    ];

    const therapistSummaryMarkdown = `### Prototype Scenario Summary: ${digitalTwin.name} (${digitalTwin.patientId})
- **Evidence**: Current run compared with bundled synthetic history; not a clinical progress assessment
- **Scenario Label**: ${digitalTwin.clinicalCondition}
- **Current Speaking-Rate Proxy**: ${biomarkers.speakingRateWpm} WPM
- **Current Mean Observed Pause**: ${biomarkers.meanPauseDurationSec}s
- **Current Rhythm Proxy**: ${(biomarkers.rhythmStabilityIndex * 100).toFixed(0)}%
- **Review Boundary**: A clinician must interpret repeated real captures before changing a care plan.`;

    const progress: ProgressReport = {
      evidenceKind: 'stored-synthetic-history-comparison',
      baselineSource: 'Bundled selected-patient scenario history',
      assessmentTimeReductionPercent: 0,
      wpmImprovementPercent,
      pauseReductionPercent,
      accuracyDelta,
      quantifiedClinicalScore,
      therapistSummaryMarkdown,
      comparativeMatrix
    };

    const executionTimeMs = Math.round(performance.now() - startTime);
    const trace: AgentTraceEvent = {
      agentId: 'agent-progress-optimization',
      agentName: this.name,
      role: this.role,
      badgeColor: this.badgeColor,
      timestamp: new Date().toISOString().substring(11, 19),
      status: 'completed',
      observation: `Compared the current run with ${digitalTwin.sessionsCompleted} bundled synthetic history points. WPM delta ${wpmImprovementPercent}%, pause delta ${pauseReductionPercent}%.`,
      thought: `Computed internal composite proxy ${quantifiedClinicalScore}/100. This is not a clinical recovery score.`,
      decision: 'Generated a prototype scenario summary with explicit synthetic-history provenance for clinician review.',
      outputData: { progress },
      executionTimeMs
    };

    return { progress, trace };
  }
}
