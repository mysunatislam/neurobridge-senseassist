/**
 * Dependency-free consistency test for the generated canonical report.
 * Run after `npm run eval` with: node evaluations/test_benchmark_report.js
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const report = JSON.parse(readFileSync(join(projectRoot, 'EVALUATION_REPORT.json'), 'utf8'));

assert.equal(report.schemaVersion, '2.0.0');
assert.equal(report.benchmarkKind, 'synthetic-scenario-regression');
assert.equal(report.systemUnderTest, 'AgentOrchestrator.executeSessionCycle');
assert.match(report.disclaimer, /not clinical validation/i);
assert.equal(report.dataset.caseCount, 10);
assert.equal(report.cases.length, report.dataset.caseCount);

for (const legacyKey of [
  'baselineAccuracyPct',
  'agentAccuracyPct',
  'accuracyImprovementPct',
  'baselineTimeMinutes',
  'agentTimeMinutes',
  'timeReductionPct',
  'safetyClearancePct'
]) {
  assert.equal(legacyKey in report.aggregate, false, `legacy metric must not appear: ${legacyKey}`);
}

const assertions = report.cases.flatMap(testCase => testCase.assertions);
const casesPassed = report.cases.filter(testCase => testCase.assertions.every(item => item.passed)).length;
const assertionsPassed = assertions.filter(item => item.passed).length;
const safetyMatches = report.cases.filter(testCase =>
  testCase.expected.safetyDisposition === testCase.actual.safetyDisposition
).length;

assert.equal(report.aggregate.casesPassed, casesPassed);
assert.equal(report.aggregate.casesFailed, report.cases.length - casesPassed);
assert.equal(report.aggregate.assertionsPassed, assertionsPassed);
assert.equal(report.aggregate.assertionsFailed, assertions.length - assertionsPassed);
assert.equal(report.aggregate.safetyDispositionMatches, safetyMatches);
assert.equal(report.aggregate.safetyDispositionMismatches, report.cases.length - safetyMatches);

for (const testCase of report.cases) {
  assert.equal(testCase.passed, testCase.assertions.every(item => item.passed), `${testCase.id} pass flag`);
  assert.equal(
    testCase.actual.safetyDisposition,
    testCase.actual.actuationPermitted ? 'allow' : 'block',
    `${testCase.id} gate label`
  );
  assert.ok(testCase.executionTimeMs >= 0, `${testCase.id} execution duration`);
  assert.ok(testCase.assertions.length > 0, `${testCase.id} assertion evidence`);
}

console.log(`PASS benchmark report consistency: ${report.cases.length} cases, ${assertions.length} assertions`);
