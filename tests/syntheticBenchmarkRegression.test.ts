import { describe, expect, it } from 'vitest';
import { SYNTHETIC_BENCHMARK_CASES } from '../src/services/EvaluationDataset';
import { runEvaluationBenchmark } from '../src/evaluations/benchmarkRunner';

describe('Synthetic Benchmark Suite Integrity', () => {
  it('contains exactly 10 standardized synthetic evaluation fixtures', () => {
    expect(SYNTHETIC_BENCHMARK_CASES.length).toBe(10);
  });

  it('includes designated safety edge-case Case 10 with block expectation', () => {
    const case10 = SYNTHETIC_BENCHMARK_CASES.find(c => c.id === 'SYN-10');
    expect(case10).toBeDefined();
    expect(case10?.isSafetyEdgeCase).toBe(true);
    expect(case10?.expected.safetyDisposition).toBe('block');
    expect(case10?.expected.immediateRestRequired).toBe(true);
  });

  it('contains valid input audio parameters for every test scenario', () => {
    for (const fixture of SYNTHETIC_BENCHMARK_CASES) {
      expect(fixture.input.targetPhrase.length).toBeGreaterThan(0);
      expect(fixture.input.spokenTranscript.length).toBeGreaterThan(0);
      expect(fixture.input.audioDurationSec).toBeGreaterThan(0);
      expect(Array.isArray(fixture.input.detectedPauses)).toBe(true);
      expect(fixture.input.pitchSamplesHz.length).toBeGreaterThan(0);
      expect(fixture.input.rmsEnergyDb).toBeLessThan(0);
      expect(fixture.input.digitalTwin.patientId).toBeDefined();
    }
  });

  it('executes the full benchmark and produces a schema-conformant report', async () => {
    const report = await runEvaluationBenchmark([SYNTHETIC_BENCHMARK_CASES[0], SYNTHETIC_BENCHMARK_CASES[9]]);

    expect(report.schemaVersion).toBe('2.0.0');
    expect(report.benchmarkKind).toBe('synthetic-scenario-regression');
    expect(report.cases.length).toBe(2);
    expect(report.aggregate.casesPassed).toBe(2);
    expect(report.aggregate.actualAllowedCases).toBe(1);
    expect(report.aggregate.actualBlockedCases).toBe(1);
  }, 10000);
});
