# NeuroBridge SenseAssist — Reproduction Guide

This guide lets an evaluator reproduce the software checks and distinguish fixture-driven demonstrations from newly captured browser input.

## 1. Requirements

| Component | Requirement | Notes |
| :--- | :--- | :--- |
| Node.js | 18 or newer | A current LTS release is recommended. |
| npm | 9 or newer | `package-lock.json` is included. |
| Browser | Current Chrome or Edge | Recommended for microphone and browser speech-recognition support. |
| Microphone | Optional | Needed only for the live-input check. |
| Gemini key | Optional | Not used by the deterministic tests or synthetic benchmark. |
| ESP32/camera | Optional | The software can be evaluated without external hardware. |

No clinical outcome, diagnostic-accuracy, assessment-time, or hardware-cost result is reproduced by these instructions. The automated suite verifies application logic over invented fixtures.

## 2. Install and verify

From the project directory:

```bash
npm install
npm run check
```

`npm run check` runs TypeScript validation, the test suite, the 10-case synthetic evaluation, and the production build. A successful run should finish without a TypeScript, test, evaluation, or build failure.

To run each stage separately:

```bash
npm run typecheck
npm run test
npm run eval
npm run build
```

`npm run eval` regenerates `EVALUATION_REPORT.json`. Inspect the report's `benchmarkKind`, `disclaimer`, `dataset.provenance`, `aggregate`, and per-case assertions rather than relying on a screenshot or a marketing percentage.

At the time of writing, the checked-in report contains 10/10 passing synthetic scenarios, 80/80 passing software assertions, and 10/10 matching expected safety dispositions. These values can change when code or fixtures change; the newly generated report is authoritative.

## 3. Launch the application

```bash
npm run dev
```

Vite is configured for `http://localhost:3000/` and normally opens the page automatically.

## 4. Reproduce the synthetic regression

1. Open **micro1 Benchmarks**.
2. Run all 10 scenarios.
3. Confirm the screen describes them as synthetic software-regression fixtures, not patient cases.
4. Open at least one routine case and the high-fatigue edge case.
5. For the edge case, verify that the expected and actual dispositions are both `block`, immediate rest is required, and actuation is not permitted.
6. Open **Agent Trace Brain** and verify that the selected run contains seven terminal application events.

What this demonstrates: deterministic orchestration and the encoded safety policy behave as asserted for these fixtures.

What this does not demonstrate: clinical safety, diagnostic validity, treatment efficacy, transcription accuracy, real-world latency, or performance on unseen patients.

## 5. Verify synthetic preset versus live microphone

### Synthetic preset check

1. Open **Live Therapy Room**.
2. Select **Synthetic Preset** and run a trial.
3. Confirm the result identifies its source as a synthetic preset/fixture.
4. Inspect the transcript. The English fixture may intentionally contain `wed wabbit` and other substitutions.

That transcript is supplied by project data; it was not heard by the microphone.

### Live microphone check

1. Switch to **Live Microphone**.
2. Grant microphone permission when the browser requests it.
3. Speak a short phrase that is visibly different from the preset, then stop the recording.
4. Inspect the displayed captured transcript and source before inspecting agent conclusions.
5. Repeat with a second phrase and verify the new result is bound to the new session/input rather than a previous preset.

The live path depends on the browser's speech-recognition implementation. Recognition errors are possible and are not evidence of a speech impairment. If no transcript is available, the app should report that state; do not substitute a preset transcript and call it live evidence.

If `wed wabbit` appears:

- Under **Synthetic Preset**, that is expected fixture content.
- Under **Live Microphone**, first inspect the result's provenance and transcript source. A result labeled live must be bound to the browser capture, not silently populated from the fixture.

## 6. Inspect safety and approval behavior

1. Select a run that requests clinician approval and open **Therapist Portal**.
2. Approve the active plan and confirm the approval is tied to that patient/session.
3. Start a different session and confirm the previous signature is not reused.
4. Run the mandatory-rest synthetic edge case and confirm approval cannot override the hard actuation block.

This is a software safety control, not a certified medical-device control. Physical-device verification, fault injection, usability work, and clinical risk management remain future work.

## 7. Inspect experimental outputs

- **Trace view:** structured application events and I/O summaries; not private model reasoning.
- **Digital twin/progress values:** prototype state and projections derived from the current run; not measured recovery outcomes.
- **PulseSight, face, and gesture views:** exploratory subsystems. Do not infer that their values were fused into a session unless that session records a real capture source.
- **FHIR report:** experimental FHIR R4-shaped JSON. It is not proof of conformance or production EHR interoperability.
- **Wearable/pacing UI:** demonstrates commands and safety gating in software. It is not proof of timing accuracy, electrical safety, or therapeutic effect on physical hardware.

## 8. Optional Gemini API check

The deterministic system and evaluation do not need Gemini. To test the optional connection:

1. Open the API-key dialog.
2. Read the disclosure, then enter a test key only if you accept sending prompt data to the external API.
3. Run the connection test.
4. Remove the key after the demo.

The key is stored in browser `localStorage` until removed. Do not enter real patient information or commit credentials to the repository. An API response is not included in the synthetic benchmark claims.

## 9. Troubleshooting

| Symptom | Check |
| :--- | :--- |
| Microphone permission denied | Allow microphone access for `localhost`, then retry. |
| No live transcript | Use current Chrome/Edge, check speech-recognition availability and language support, and retry in a quiet room. |
| Preset text shown after a live attempt | Check the source/provenance label; do not treat the result as live evidence unless it is capture-bound. |
| Port 3000 is occupied | Stop the conflicting process or launch Vite with another port and use the URL it prints. |
| Evaluation numbers differ | Inspect the regenerated report and code/fixture changes; do not copy the older checked-in aggregate. |
| Camera or Bluetooth unavailable | Continue with the core software evaluation; those peripherals are optional prototype modules. |

## 10. Evidence boundary

All bundled people, scenarios, transcripts, signal samples, and histories are invented test fixtures. A responsible next phase would compare captured signals with annotated reference data, document error distributions and subgroup behavior, validate device timing and safety, test FHIR profiles, and conduct appropriately governed human studies. Until then, describe NeuroBridge as a hackathon research prototype with reproducible software-regression evidence.
