import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Award,
  CheckCircle2,
  Clock,
  Database,
  Play,
  RefreshCw,
  ShieldCheck,
  XCircle
} from 'lucide-react';
import { SYNTHETIC_BENCHMARK_CASES } from '../services/EvaluationDataset';
import {
  BenchmarkSuiteReport,
  EvaluatedCaseResult,
  runEvaluationBenchmark
} from '../evaluations/benchmarkRunner';

const ResultBadge: React.FC<{ passed: boolean; children: React.ReactNode }> = ({ passed, children }) => (
  <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 font-mono text-[10px] ${
    passed
      ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
      : 'border-rose-500/40 bg-rose-500/10 text-rose-300'
  }`}>
    {passed ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
    {children}
  </span>
);

export const Micro1EvaluationSuite: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [completedCases, setCompletedCases] = useState(0);
  const [report, setReport] = useState<BenchmarkSuiteReport | null>(null);
  const [selectedCaseId, setSelectedCaseId] = useState(SYNTHETIC_BENCHMARK_CASES[9].id);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const selectedResult = useMemo<EvaluatedCaseResult | undefined>(
    () => report?.cases.find(item => item.id === selectedCaseId),
    [report, selectedCaseId]
  );
  const selectedFixture = SYNTHETIC_BENCHMARK_CASES.find(item => item.id === selectedCaseId)!;

  const runAllCases = async () => {
    setIsRunning(true);
    setCompletedCases(0);
    setErrorMessage(null);
    try {
      const nextReport = await runEvaluationBenchmark(
        SYNTHETIC_BENCHMARK_CASES,
        (_result, completed) => setCompletedCases(completed)
      );
      setReport(nextReport);
    } catch (error) {
      console.error('Synthetic benchmark execution failed:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Unknown benchmark error');
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-amber-500/40 bg-gradient-to-r from-slate-900 via-amber-950/10 to-slate-900 p-6 shadow-xl">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Award className="h-6 w-6 text-amber-400" />
              <h2 className="text-xl font-bold text-white">Synthetic Scenario Regression</h2>
            </div>
            <p className="max-w-4xl text-xs leading-relaxed text-slate-300">
              Executes the real <code className="text-teal-300">AgentOrchestrator.executeSessionCycle</code> against 10 frozen,
              invented fixtures and checks trace completion, intervention bounds, and expected safety-gate behavior.
            </p>
            <p className="flex items-start gap-2 text-xs font-semibold text-amber-300">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              Software regression evidence only. This is not patient data, clinical validation, diagnostic accuracy,
              treatment efficacy, or a substitute for supervised testing.
            </p>
          </div>

          <button
            type="button"
            onClick={runAllCases}
            disabled={isRunning}
            className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 to-teal-400 px-5 py-3 text-xs font-bold text-slate-950 shadow-lg transition-transform hover:scale-[1.02] disabled:cursor-wait disabled:opacity-60"
          >
            {isRunning ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4 fill-current" />}
            {isRunning
              ? `Running case ${Math.min(completedCases + 1, SYNTHETIC_BENCHMARK_CASES.length)} of ${SYNTHETIC_BENCHMARK_CASES.length}`
              : 'Run all 10 synthetic cases'}
          </button>
        </div>
        {errorMessage && (
          <p role="alert" className="mt-4 rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">
            Benchmark failed to execute: {errorMessage}
          </p>
        )}
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={<CheckCircle2 className="h-4 w-4 text-emerald-400" />}
          label="Scenario acceptance"
          value={report ? `${report.aggregate.casesPassed}/${report.dataset.caseCount}` : 'Not run'}
          detail={report ? `${report.aggregate.scenarioPassRatePct}% passed` : 'No cached headline substituted'}
        />
        <MetricCard
          icon={<Database className="h-4 w-4 text-teal-400" />}
          label="Assertion checks"
          value={report ? `${report.aggregate.assertionsPassed}/${report.aggregate.assertionsPassed + report.aggregate.assertionsFailed}` : 'Not run'}
          detail={report ? `${report.aggregate.assertionPassRatePct}% passed` : 'Eight checks per fixture'}
        />
        <MetricCard
          icon={<ShieldCheck className="h-4 w-4 text-cyan-400" />}
          label="Safety expectation match"
          value={report ? `${report.aggregate.safetyDispositionMatches}/${report.dataset.caseCount}` : 'Not run'}
          detail={report ? `${report.aggregate.actualAllowedCases} allowed · ${report.aggregate.actualBlockedCases} blocked` : 'Expected versus returned gate state'}
        />
        <MetricCard
          icon={<Clock className="h-4 w-4 text-amber-400" />}
          label="Measured execution"
          value={report ? `${report.aggregate.totalExecutionTimeMs} ms` : 'Not run'}
          detail={report ? `${report.aggregate.meanCaseExecutionTimeMs} ms mean per case` : 'Wall-clock orchestration duration'}
        />
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl">
        <div className="mb-4 flex flex-col justify-between gap-2 border-b border-slate-800 pb-3 sm:flex-row sm:items-center">
          <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-white">
            <Database className="h-4 w-4 text-teal-400" />
            Canonical frozen dataset
          </h3>
          <span className="font-mono text-[10px] text-slate-400">neurobridge-synthetic-safety-v1 · N=10</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 font-mono text-[10px] uppercase text-slate-400">
                <th className="px-3 py-3">Case</th>
                <th className="px-3 py-3">Synthetic scenario</th>
                <th className="px-3 py-3">Expected gate</th>
                <th className="px-3 py-3">Actual gate</th>
                <th className="px-3 py-3">Assertions</th>
                <th className="px-3 py-3">Duration</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70">
              {SYNTHETIC_BENCHMARK_CASES.map(fixture => {
                const result = report?.cases.find(item => item.id === fixture.id);
                const passedChecks = result?.assertions.filter(item => item.passed).length ?? 0;
                return (
                  <tr
                    key={fixture.id}
                    onClick={() => setSelectedCaseId(fixture.id)}
                    className={`cursor-pointer transition-colors ${
                      selectedCaseId === fixture.id ? 'bg-teal-500/10' : 'hover:bg-slate-800/50'
                    }`}
                  >
                    <td className="px-3 py-3 font-mono font-bold text-teal-300">
                      <span className="flex items-center gap-1.5">
                        {fixture.isSafetyEdgeCase && <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />}
                        {fixture.id}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <span className="block font-semibold text-white">{fixture.title}</span>
                      <span className="block max-w-md text-[10px] text-slate-400">{fixture.scenario}</span>
                    </td>
                    <td className="px-3 py-3 font-mono text-slate-300">{fixture.expected.safetyDisposition.toUpperCase()}</td>
                    <td className="px-3 py-3">
                      {result
                        ? <ResultBadge passed={result.actual.safetyDisposition === fixture.expected.safetyDisposition}>{result.actual.safetyDisposition.toUpperCase()}</ResultBadge>
                        : <span className="text-slate-500">Pending</span>}
                    </td>
                    <td className="px-3 py-3 font-mono text-slate-300">
                      {result ? `${passedChecks}/${result.assertions.length}` : '—'}
                    </td>
                    <td className="px-3 py-3 font-mono text-slate-400">{result ? `${result.executionTimeMs} ms` : '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className={`rounded-2xl border p-6 shadow-xl ${
        selectedFixture.isSafetyEdgeCase
          ? 'border-amber-500/40 bg-amber-950/10'
          : 'border-slate-800 bg-slate-900/90'
      }`}>
        <div className="mb-4 flex flex-col justify-between gap-2 border-b border-slate-800 pb-3 sm:flex-row sm:items-center">
          <div>
            <p className="font-mono text-[10px] uppercase text-teal-300">{selectedFixture.id} inspection</p>
            <h3 className="font-bold text-white">{selectedFixture.title}</h3>
          </div>
          {selectedResult && <ResultBadge passed={selectedResult.passed}>{selectedResult.passed ? 'CASE PASSED' : 'CASE FAILED'}</ResultBadge>}
        </div>

        {!selectedResult ? (
          <div className="grid gap-4 text-xs md:grid-cols-2">
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
              <p className="mb-2 font-semibold text-slate-200">Frozen expectation</p>
              <p className="text-slate-400">Gate: {selectedFixture.expected.safetyDisposition.toUpperCase()}</p>
              <p className="text-slate-400">Therapist approval: {String(selectedFixture.expected.therapistApprovalRequired)}</p>
              <p className="text-slate-400">Immediate rest: {String(selectedFixture.expected.immediateRestRequired)}</p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 text-slate-400">
              Run the suite to populate actual orchestrator outputs and assertion-by-assertion evidence.
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid gap-3 md:grid-cols-3">
              <ActualValue label="Returned gate" value={selectedResult.actual.safetyDisposition.toUpperCase()} />
              <ActualValue label="Fatigue result" value={`${selectedResult.actual.fatigueRisk} (${selectedResult.actual.fatigueIndex})`} />
              <ActualValue label="Intervention" value={`${selectedResult.actual.prescribedBpm} BPM · ${selectedResult.actual.hapticIntensityPercent}% · ${selectedResult.actual.modality}`} />
            </div>
            <div className="grid gap-2 md:grid-cols-2">
              {selectedResult.assertions.map(item => (
                <div key={item.id} className="rounded-xl border border-slate-800 bg-slate-950/70 p-3 text-xs">
                  <div className="mb-1 flex items-center justify-between gap-3">
                    <span className="font-semibold text-slate-200">{item.label}</span>
                    <ResultBadge passed={item.passed}>{item.passed ? 'PASS' : 'FAIL'}</ResultBadge>
                  </div>
                  <p className="font-mono text-[10px] text-slate-400">expected={String(item.expected)} · actual={String(item.actual)}</p>
                  <p className="mt-1 text-[10px] leading-relaxed text-slate-500">{item.detail}</p>
                </div>
              ))}
            </div>
            {selectedResult.actual.safetyMessages.length > 0 && (
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-amber-200">
                <p className="mb-1 font-semibold">Returned safety messages</p>
                <ul className="list-disc space-y-1 pl-5 text-[10px] text-amber-200/80">
                  {selectedResult.actual.safetyMessages.map(message => <li key={message}>{message}</li>)}
                </ul>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
};

const MetricCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string;
  detail: string;
}> = ({ icon, label, value, detail }) => (
  <div className="space-y-2 rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl">
    <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
      {icon}
      {label}
    </div>
    <p className="font-mono text-2xl font-extrabold text-white">{value}</p>
    <p className="text-[10px] text-slate-500">{detail}</p>
  </div>
);

const ActualValue: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3">
    <p className="text-[10px] uppercase tracking-wider text-slate-500">{label}</p>
    <p className="mt-1 font-mono text-xs font-semibold text-slate-200">{value}</p>
  </div>
);
