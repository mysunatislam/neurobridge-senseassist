/**
 * Synthetic scenario regression runner.
 *
 * This module deliberately reports software assertions, not clinical accuracy.
 * Both the browser UI and evaluations/run_benchmark.js execute this exact runner.
 */
import { AgentOrchestrator } from '../agents/AgentOrchestrator';
import { SessionRunResult } from '../agents/types';
import {
  SafetyDisposition,
  SYNTHETIC_BENCHMARK_CASES,
  SyntheticBenchmarkCase
} from '../services/EvaluationDataset';

export interface BenchmarkAssertion {
  id: string;
  label: string;
  expected: string | number | boolean;
  actual: string | number | boolean;
  passed: boolean;
  detail: string;
}

export interface EvaluatedCaseResult {
  id: string;
  title: string;
  scenario: string;
  isSafetyEdgeCase: boolean;
  expected: SyntheticBenchmarkCase['expected'];
  actual: {
    safetyDisposition: SafetyDisposition;
    therapistApprovalRequired: boolean;
    immediateRestRequired: boolean;
    actuationPermitted: boolean;
    stimulusIntensitySafe: boolean;
    fatigueRisk: SessionRunResult['safety']['fatigueRisk'];
    fatigueIndex: number;
    safetyMessages: string[];
    traceEventCount: number;
    uniqueAgentCount: number;
    prescribedBpm: number;
    hapticIntensityPercent: number;
    modality: string;
    primaryObservedPattern: string;
    speakingRateWpm: number;
    meanPauseDurationSec: number;
  };
  assertions: BenchmarkAssertion[];
  passed: boolean;
  executionTimeMs: number;
}

export interface BenchmarkSuiteReport {
  schemaVersion: '2.0.0';
  generatedAt: string;
  benchmarkKind: 'synthetic-scenario-regression';
  disclaimer: string;
  dataset: {
    id: 'neurobridge-synthetic-safety-v1';
    version: '1.0.0';
    provenance: 'Invented, frozen software-test fixtures; no patient or clinical-study data.';
    caseCount: number;
  };
  systemUnderTest: 'AgentOrchestrator.executeSessionCycle';
  aggregate: {
    casesPassed: number;
    casesFailed: number;
    scenarioPassRatePct: number;
    assertionsPassed: number;
    assertionsFailed: number;
    assertionPassRatePct: number;
    safetyDispositionMatches: number;
    safetyDispositionMismatches: number;
    safetyDispositionMatchRatePct: number;
    actualAllowedCases: number;
    actualBlockedCases: number;
    totalExecutionTimeMs: number;
    meanCaseExecutionTimeMs: number;
  };
  cases: EvaluatedCaseResult[];
}

const pct = (part: number, total: number): number =>
  total === 0 ? 0 : Number(((part / total) * 100).toFixed(1));

const assertion = (
  id: string,
  label: string,
  expected: BenchmarkAssertion['expected'],
  actual: BenchmarkAssertion['actual'],
  detail: string
): BenchmarkAssertion => ({ id, label, expected, actual, passed: expected === actual, detail });

export function buildCaseAssertions(
  testCase: SyntheticBenchmarkCase,
  runResult: SessionRunResult
): BenchmarkAssertion[] {
  const safetyDisposition: SafetyDisposition = runResult.safety.actuationPermitted ? 'allow' : 'block';
  const uniqueAgentCount = new Set(runResult.traceEvents.map(event => event.agentId)).size;
  const terminalTraceCount = runResult.traceEvents.filter(event =>
    event.status === 'completed' || event.status === 'warning'
  ).length;
  const gateIsCoherent = runResult.safety.actuationPermitted === (
    !runResult.safety.therapistApprovalRequired &&
    runResult.safety.stimulusIntensitySafe &&
    !runResult.safety.requiresImmediateRest
  );
  const interventionInBounds =
    runResult.intervention.bpm >= 40 &&
    runResult.intervention.bpm <= 120 &&
    runResult.intervention.hapticIntensityPercent >= 0 &&
    runResult.intervention.hapticIntensityPercent <= 85;
  const inputBindingPreserved =
    runResult.targetPhrase === testCase.input.targetPhrase &&
    runResult.spokenTranscript === testCase.input.spokenTranscript &&
    runResult.digitalTwin.patientId === testCase.input.digitalTwin.patientId;

  return [
    assertion(
      'safety-disposition',
      'Expected safety disposition',
      testCase.expected.safetyDisposition,
      safetyDisposition,
      testCase.expected.rationale
    ),
    assertion(
      'therapist-approval',
      'Expected therapist-approval requirement',
      testCase.expected.therapistApprovalRequired,
      runResult.safety.therapistApprovalRequired,
      'Compares the frozen scenario expectation with the returned Safety Agent flag.'
    ),
    assertion(
      'immediate-rest',
      'Expected immediate-rest requirement',
      testCase.expected.immediateRestRequired,
      runResult.safety.requiresImmediateRest,
      'The high-fatigue edge case is expected to request rest; routine cases are not.'
    ),
    assertion(
      'seven-agent-trace',
      'Seven unique agent trace events',
      7,
      uniqueAgentCount,
      `Received ${runResult.traceEvents.length} total trace event(s).`
    ),
    assertion(
      'trace-terminal-state',
      'All trace events reached a terminal state',
      runResult.traceEvents.length,
      terminalTraceCount,
      'Terminal states for this deterministic pipeline are completed or warning.'
    ),
    assertion(
      'gate-coherence',
      'Actuation gate agrees with safety flags',
      true,
      gateIsCoherent,
      'The actuator may be allowed only when approval/rest/intensity checks all clear.'
    ),
    assertion(
      'intervention-bounds',
      'Generated intervention remains inside test bounds',
      true,
      interventionInBounds,
      `Observed ${runResult.intervention.bpm} BPM and ${runResult.intervention.hapticIntensityPercent}% intensity; bounds are 40–120 BPM and 0–85%.`
    ),
    assertion(
      'input-binding',
      'Output remains bound to the submitted fixture',
      true,
      inputBindingPreserved,
      'Target phrase, transcript, and synthetic profile ID must survive the orchestration cycle.'
    )
  ];
}

export async function runEvaluationBenchmark(
  cases: SyntheticBenchmarkCase[] = SYNTHETIC_BENCHMARK_CASES,
  onCaseComplete?: (result: EvaluatedCaseResult, completed: number, total: number) => void
): Promise<BenchmarkSuiteReport> {
  const orchestrator = new AgentOrchestrator();
  const suiteStartedAt = performance.now();
  const results: EvaluatedCaseResult[] = [];

  for (const testCase of cases) {
    const caseStartedAt = performance.now();
    const runResult = await orchestrator.executeSessionCycle(
      testCase.input.targetPhrase,
      testCase.input.spokenTranscript,
      testCase.input.audioDurationSec,
      testCase.input.detectedPauses,
      testCase.input.pitchSamplesHz,
      testCase.input.rmsEnergyDb,
      testCase.input.digitalTwin
    );

    const assertions = buildCaseAssertions(testCase, runResult);
    const safetyDisposition: SafetyDisposition = runResult.safety.actuationPermitted ? 'allow' : 'block';
    const result: EvaluatedCaseResult = {
      id: testCase.id,
      title: testCase.title,
      scenario: testCase.scenario,
      isSafetyEdgeCase: Boolean(testCase.isSafetyEdgeCase),
      expected: testCase.expected,
      actual: {
        safetyDisposition,
        therapistApprovalRequired: runResult.safety.therapistApprovalRequired,
        immediateRestRequired: runResult.safety.requiresImmediateRest,
        actuationPermitted: runResult.safety.actuationPermitted,
        stimulusIntensitySafe: runResult.safety.stimulusIntensitySafe,
        fatigueRisk: runResult.safety.fatigueRisk,
        fatigueIndex: runResult.safety.fatigueIndex,
        safetyMessages: [...runResult.safety.clinicalBoundaryViolations],
        traceEventCount: runResult.traceEvents.length,
        uniqueAgentCount: new Set(runResult.traceEvents.map(event => event.agentId)).size,
        prescribedBpm: runResult.intervention.bpm,
        hapticIntensityPercent: runResult.intervention.hapticIntensityPercent,
        modality: runResult.intervention.modality,
        primaryObservedPattern: runResult.phenotype.primaryDeficit,
        speakingRateWpm: runResult.biomarkers.speakingRateWpm,
        meanPauseDurationSec: runResult.biomarkers.meanPauseDurationSec
      },
      assertions,
      passed: assertions.every(item => item.passed),
      executionTimeMs: Math.round(performance.now() - caseStartedAt)
    };

    results.push(result);
    onCaseComplete?.(result, results.length, cases.length);
  }

  const totalExecutionTimeMs = Math.round(performance.now() - suiteStartedAt);
  const casesPassed = results.filter(result => result.passed).length;
  const allAssertions = results.flatMap(result => result.assertions);
  const assertionsPassed = allAssertions.filter(item => item.passed).length;
  const safetyDispositionMatches = results.filter(result =>
    result.actual.safetyDisposition === result.expected.safetyDisposition
  ).length;

  return {
    schemaVersion: '2.0.0',
    generatedAt: new Date().toISOString(),
    benchmarkKind: 'synthetic-scenario-regression',
    disclaimer: 'Software regression evidence only. Synthetic fixtures are not clinical validation, diagnostic accuracy evidence, or a substitute for supervised testing.',
    dataset: {
      id: 'neurobridge-synthetic-safety-v1',
      version: '1.0.0',
      provenance: 'Invented, frozen software-test fixtures; no patient or clinical-study data.',
      caseCount: cases.length
    },
    systemUnderTest: 'AgentOrchestrator.executeSessionCycle',
    aggregate: {
      casesPassed,
      casesFailed: results.length - casesPassed,
      scenarioPassRatePct: pct(casesPassed, results.length),
      assertionsPassed,
      assertionsFailed: allAssertions.length - assertionsPassed,
      assertionPassRatePct: pct(assertionsPassed, allAssertions.length),
      safetyDispositionMatches,
      safetyDispositionMismatches: results.length - safetyDispositionMatches,
      safetyDispositionMatchRatePct: pct(safetyDispositionMatches, results.length),
      actualAllowedCases: results.filter(result => result.actual.safetyDisposition === 'allow').length,
      actualBlockedCases: results.filter(result => result.actual.safetyDisposition === 'block').length,
      totalExecutionTimeMs,
      meanCaseExecutionTimeMs: results.length === 0 ? 0 : Math.round(totalExecutionTimeMs / results.length)
    },
    cases: results
  };
}
