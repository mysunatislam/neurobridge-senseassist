# Frontier Engineering Challenge submission checklist

Run this list against the exact commit you submit. A checked box should point to evidence in the repository, build output, or final video—not memory.

## Required deliverables

- [ ] Public or judge-accessible source repository URL is final and opens in a signed-out browser.
- [ ] Final video URL is accessible without requesting permission and demonstrates the submitted commit.
- [x] Redacted development-agent trace is present at `traces/DEVELOPMENT_TRACE.redacted.jsonl`.
- [x] Trace manifest, schema, classifications, redaction policy, source hashes, and known gaps are present under `traces/`.
- [ ] Submission form includes the source URL, video URL, concise problem statement, architecture, limitations, and reproduction steps.
- [ ] License file and third-party attribution are present and appropriate for every dependency, model, asset, icon, and dataset.

## Source package and Git

- [x] `.gitignore` excludes `node_modules/`, `dist/`, private/raw traces, secrets, logs, and toolchain output.
- [ ] Repository has been initialized, default branch is named, and the intended files are committed.
- [ ] `git status --short` is empty on the submission commit.
- [ ] `git ls-files` contains source, firmware, lockfile, README, reproduction guide, evaluator, tests, trace package, demo script, checklist, and license.
- [ ] `git ls-files` does **not** contain `.env*`, credentials, private keys, raw Antigravity state, `node_modules/`, `dist/`, or personal media.
- [ ] Fresh clone into a separate directory installs and runs by following only the README/reproduction guide.
- [ ] Repository size and any individual large files are accepted by the hosting platform.

## Verification on a clean checkout

Record command, exit code, timestamp, OS, Node version, and the commit SHA in the final evidence note.

```powershell
node --version
npm --version
npm ci
npx --no-install tsc --noEmit
npm test
npm run build
npm run eval
npm audit --omit=dev
```

- [ ] Every command above exits successfully on the submitted commit.
- [ ] Automated tests include safety veto, approval scope/expiry, actuator stop/disconnect/watchdog behavior, benchmark aggregation, and export structure.
- [ ] No test requires an actual API key, camera, microphone, BLE device, network service, or private file.
- [ ] Production app opens without console errors at desktop and mobile widths.
- [ ] Keyboard navigation, focus visibility, contrast, reduced motion, and modal dismissal received a manual pass.

## One source of benchmark truth

- [ ] CLI evaluator and in-browser evaluator call the same implementation and dataset.
- [ ] README, pitch modal, benchmark cards, generated report, reproduction guide, and narration read results from that one canonical report—no duplicated manual metric constants.
- [ ] Benchmark output includes evaluator version, seed, case IDs, source revision, environment, per-case inputs/results, aggregate formula, execution timestamp, and limitations.
- [ ] Safety-violation totals are calculated from per-case results; they are never forced to zero or contradicted by a clearance percentage.
- [ ] Timing is measured and labeled accurately; deterministic estimated clinician time is not presented as wall-clock runtime.
- [ ] Every percentage is described as a frozen synthetic proxy result, not clinical efficacy or expected patient improvement.

## Safety and human oversight

- [ ] Every haptic entry point passes through one central fail-closed authorization gate.
- [ ] High fatigue, invalid input, boundary violations, expired/missing approval, BLE errors, stop, voice stop/rest, component unmount, and disconnect all prevent or halt actuation.
- [ ] Therapist approval is session-bound, intervention-bound, time-limited, revocable, and recorded in the trace.
- [ ] Browser intensity, firmware intensity, pulse duration, cadence, and watchdog limits agree and are covered by tests.
- [ ] The demo shows one blocked case and does not actuate real hardware.
- [ ] Emergency/clinical disclaimers and escalation language are visible without implying diagnosis or treatment.

## Trace integrity and privacy

- [x] `AGENT_TRAJECTORIES.json` is labeled as a synthetic runtime fixture, not a build trace or patient record.
- [x] `DEVELOPMENT_TRAJECTORY.json` is labeled as a retrospective summary, not raw evidence.
- [ ] Verify the committed trace digest matches `traces/TRACE_MANIFEST.json`:

```powershell
Get-FileHash -Algorithm SHA256 traces/DEVELOPMENT_TRACE.redacted.jsonl
```

- [ ] Parse all 1,129 JSONL events and confirm contiguous sequence values `0..1128` against `traces/TRACE_SCHEMA.json`.
- [ ] Run the repository host’s secret scanner and a second local scan over the full Git history.
- [ ] Manually review user prompts, tool outputs, screenshots, uploaded media references, URLs, and generated reports for personal or confidential information.
- [ ] Do not add the raw Antigravity transcript to Git. If judges request it, obtain the owner’s consent, perform a separate privacy review, and share through an approved private channel.

## Claims and evidence

- [ ] Every sensor view visibly distinguishes **live measured**, **synthetic fixture**, **estimated**, and **unavailable** states.
- [ ] “FHIR R4-shaped prototype export” is not described as certified interoperability without validator evidence.
- [ ] No claim of HIPAA, FDA, WHO, clinical, hospital, or regulatory compliance appears without the required external assessment.
- [ ] No real-patient claim is based on synthetic names, telemetry, outcomes, or runtime traces.
- [ ] Model names and tool labels in retrospective summaries are either source-verifiable or explicitly labeled self-reported.
- [ ] Citations point to primary sources and do not imply that cited research validates this implementation.

## Video and final form

- [ ] Follow `DEMO_SCRIPT.md`; final duration is within the event limit.
- [ ] Captions are accurate, fonts are readable at 1080p, and no notification/API-key/private path appears.
- [ ] Video shows the problem, reproducible synthetic input, real workflow trace, blocked safety case, canonical evaluation, limitations, and development trace manifest.
- [ ] Video and form use the exact project name and the same current benchmark language as the repository.
- [ ] Final links, team/member details, category, contact email, and submission timezone/deadline were checked twice.
- [ ] A local copy of the submitted commit hash, form text, video, and confirmation receipt is retained.

