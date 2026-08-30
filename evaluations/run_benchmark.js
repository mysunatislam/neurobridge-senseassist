/**
 * CLI adapter for the canonical TypeScript benchmark runner.
 *
 * esbuild bundles the same module imported by the browser UI, eliminating the
 * former second implementation and its formula-generated outcomes.
 */
import { build } from 'esbuild';
import { writeFileSync, unlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(scriptDirectory, '..');
const temporaryBundle = join(tmpdir(), `neurobridge-benchmark-${process.pid}-${Date.now()}.mjs`);
const outputPath = join(projectRoot, 'EVALUATION_REPORT.json');

try {
  await build({
    entryPoints: [join(projectRoot, 'src', 'evaluations', 'benchmarkRunner.ts')],
    outfile: temporaryBundle,
    bundle: true,
    platform: 'node',
    format: 'esm',
    target: 'node20',
    logLevel: 'silent'
  });

  const { runEvaluationBenchmark } = await import(`${pathToFileURL(temporaryBundle).href}?v=${Date.now()}`);
  const report = await runEvaluationBenchmark(undefined, (result, completed, total) => {
    const status = result.passed ? 'PASS' : 'FAIL';
    const checksPassed = result.assertions.filter(item => item.passed).length;
    console.log(
      `[${completed}/${total}] ${status} ${result.id} — ${result.title} | ` +
      `${checksPassed}/${result.assertions.length} checks | ` +
      `safety expected=${result.expected.safetyDisposition}, actual=${result.actual.safetyDisposition} | ` +
      `${result.executionTimeMs} ms`
    );
  });

  writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');

  console.log('\nSynthetic scenario regression summary');
  console.log('-------------------------------------');
  console.log(`Cases:              ${report.aggregate.casesPassed}/${report.dataset.caseCount} passed (${report.aggregate.scenarioPassRatePct}%)`);
  console.log(`Assertions:         ${report.aggregate.assertionsPassed}/${report.aggregate.assertionsPassed + report.aggregate.assertionsFailed} passed (${report.aggregate.assertionPassRatePct}%)`);
  console.log(`Safety dispositions:${report.aggregate.safetyDispositionMatches}/${report.dataset.caseCount} matched (${report.aggregate.safetyDispositionMatchRatePct}%)`);
  console.log(`Actual gate states: ${report.aggregate.actualAllowedCases} allowed, ${report.aggregate.actualBlockedCases} blocked`);
  console.log(`Execution duration: ${report.aggregate.totalExecutionTimeMs} ms (measured wall-clock)`);
  console.log(`Report:             ${outputPath}`);
  console.log('\nSoftware regression evidence only — not clinical validation or diagnostic accuracy evidence.');

  if (report.aggregate.casesFailed > 0) {
    process.exitCode = 1;
  }
} catch (error) {
  console.error('Benchmark execution failed:', error);
  process.exitCode = 1;
} finally {
  try {
    unlinkSync(temporaryBundle);
  } catch {
    // No bundle exists when compilation fails before emitting an output file.
  }
}
