import { SpeechPerceptionAgent } from './SpeechPerceptionAgent';
import { NeuroCognitiveReasoningAgent } from './NeuroCognitiveReasoningAgent';
import { SensoryMotorAgent } from './SensoryMotorAgent';
import { ExperimentDesignerAgent } from './ExperimentDesignerAgent';
import { DigitalTwinAgent } from './DigitalTwinAgent';
import { SafetyBoundaryAgent } from './SafetyBoundaryAgent';
import { ProgressOptimizationAgent } from './ProgressOptimizationAgent';
import { PatientDigitalTwin, SessionRunResult, AgentTraceEvent, SessionInputProvenance } from './types';
import { simulatePulseSight, PulseSightReading } from '../services/PulseSightService';

export class AgentOrchestrator {
  private speechPerception = new SpeechPerceptionAgent();
  private neuroReasoning = new NeuroCognitiveReasoningAgent();
  private sensoryMotor = new SensoryMotorAgent();
  private experimentDesigner = new ExperimentDesignerAgent();
  private digitalTwinAgent = new DigitalTwinAgent();
  private safetyBoundary = new SafetyBoundaryAgent();
  private progressOptimizer = new ProgressOptimizationAgent();

  /**
   * Executes the full agent pipeline.
   * Step 1:  Speech Perception Agent — acoustic biomarkers from real audio data
   * Step 1b: PulseSight — facial-motor perception from camera (simulated)
   * Step 2:  NeuroCognitive Reasoning Agent — real Gemini API call when key available
   * Steps 3-7: Sensory-Motor, Experiment, Digital Twin, Safety, Progress
   */
  public async executeSessionCycle(
    targetPhrase: string,
    spokenTranscript: string,
    audioDurationSec: number,
    detectedPauses: Array<{ start: number; duration: number }>,
    estimatedPitchHz: number[],
    rmsEnergyDb: number,
    currentDigitalTwin: PatientDigitalTwin,
    onTraceStep?: (event: AgentTraceEvent, stepIndex: number) => void,
    inputProvenance: SessionInputProvenance = {
      source: 'synthetic-preset',
      transcriptSource: 'synthetic-fixture',
      label: 'Unlabelled synthetic invocation',
      capturedAt: new Date().toISOString()
    }
  ): Promise<SessionRunResult> {
    const traceEvents: AgentTraceEvent[] = [];
    const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

    // 1. SPEECH PERCEPTION AGENT — real acoustic biomarker computation
    const { biomarkers, phenotype, trace: trace1 } = this.speechPerception.analyze(
      targetPhrase,
      spokenTranscript,
      audioDurationSec,
      detectedPauses,
      estimatedPitchHz,
      rmsEnergyDb
    );
    traceEvents.push(trace1);
    if (onTraceStep) onTraceStep(trace1, 1);
    await sleep(250);

    // 1b. PULSESIGHT — facial-motor perception (camera-derived, simulated from speech features)
    const pulseSight: PulseSightReading = simulatePulseSight(
      phenotype.phonemeErrors.length,
      biomarkers.initiationLatencySec,
      biomarkers.rhythmStabilityIndex
    );
    const tracePulseSight: AgentTraceEvent = {
      agentId: 'agent-pulsesight-facial',
      agentName: 'PulseSight — Facial Motor Perception',
      role: 'Lip/Jaw Kinematics Analysis',
      badgeColor: 'bg-pink-500/20 text-pink-300 border-pink-500/40',
      timestamp: new Date().toISOString().substring(11, 19),
      status: 'completed',
      observation: `Lip symmetry: ${pulseSight.lipSymmetryPercent}% | Timing delay: ${pulseSight.lipTimingDelayMs}ms | Oral-motor coordination: ${pulseSight.oralMotorCoordinationIndex}%`,
      thought: `Facial-motor confidence: ${pulseSight.facialMotorConfidence}. ${pulseSight.clinicalFlag}`,
      decision: `Recommended modality from facial analysis: ${pulseSight.recommendedIntervention.replace('_', ' ')}`,
      outputData: { pulseSight },
      executionTimeMs: 18
    };
    traceEvents.push(tracePulseSight);
    if (onTraceStep) onTraceStep(tracePulseSight, 1);
    await sleep(150);

    // 2. NEURO-COGNITIVE REASONING AGENT — real Gemini API call when key is configured
    const { reasoning, trace: trace2 } = await this.neuroReasoning.reason(
      biomarkers,
      phenotype,
      currentDigitalTwin,
      pulseSight
    );
    traceEvents.push(trace2);
    if (onTraceStep) onTraceStep(trace2, 2);
    await sleep(100);

    // 3. SENSORY-MOTOR INTELLIGENCE AGENT
    const { intervention, trace: trace3 } = this.sensoryMotor.designIntervention(
      biomarkers,
      phenotype,
      reasoning.primaryTarget,
      currentDigitalTwin
    );
    traceEvents.push(trace3);
    if (onTraceStep) onTraceStep(trace3, 3);
    await sleep(250);

    // 4. THERAPY EXPERIMENT DESIGNER AGENT
    const { experiment, trace: trace4 } = this.experimentDesigner.conductExperiment(
      biomarkers,
      phenotype,
      currentDigitalTwin
    );
    traceEvents.push(trace4);
    if (onTraceStep) onTraceStep(trace4, 4);
    await sleep(250);

    // 5. DIGITAL TWIN PATIENT MODEL AGENT
    const { updatedTwin, trace: trace5 } = this.digitalTwinAgent.updateTwin(
      currentDigitalTwin,
      biomarkers,
      phenotype,
      experiment
    );
    traceEvents.push(trace5);
    if (onTraceStep) onTraceStep(trace5, 5);
    await sleep(250);

    // 6. SAFETY & CLINICAL BOUNDARY AGENT
    const { safety, trace: trace6 } = this.safetyBoundary.evaluate(
      biomarkers,
      intervention,
      reasoning.cognitiveVsMotorAnalysis
    );
    traceEvents.push(trace6);
    if (onTraceStep) onTraceStep(trace6, 6);
    await sleep(250);

    // 7. THERAPY OPTIMIZATION & PROGRESS INTELLIGENCE AGENT
    const { progress, trace: trace7 } = this.progressOptimizer.generateReport(
      biomarkers,
      phenotype,
      updatedTwin
    );
    traceEvents.push(trace7);
    if (onTraceStep) onTraceStep(trace7, 7);

    return {
      targetPhrase,
      spokenTranscript,
      audioDurationSec,
      inputProvenance,
      biomarkers,
      phenotype,
      pulseSight,
      reasoning,
      intervention,
      experiment,
      digitalTwin: updatedTwin,
      safety,
      progress,
      traceEvents
    };
  }
}
