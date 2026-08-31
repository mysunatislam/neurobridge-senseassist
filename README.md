# NeuroBridge SenseAssist

> A research software prototype for exploring transcript-driven speech-session analysis, bounded cue generation, traceable multi-agent decisions, and fail-closed actuation rules.
>
> Built for the micro1 Frontier Engineering Challenge 2026 / Agentic Workflows Hackathon.

![Evaluation](https://img.shields.io/badge/synthetic%20regression-10%2F10%20scenarios-teal.svg)
![Assertions](https://img.shields.io/badge/software%20assertions-80%2F80-success.svg)
![Clinical status](https://img.shields.io/badge/clinical%20validation-not%20performed-amber.svg)

## Evidence labels: read this first

NeuroBridge has two different input paths. They must not be interpreted as the same kind of evidence.

| Input path | What the application receives | What it demonstrates | What it does **not** demonstrate |
| :--- | :--- | :--- | :--- |
| **Synthetic preset** | A frozen, invented transcript and signal fixture selected by the demo | Reproducible orchestration, traces, safety-gate behavior, and UI flow | Microphone recognition, real patient performance, diagnostic accuracy, or treatment benefit |
| **Live microphone** | Browser microphone samples plus the browser's speech-recognition transcript when that API is available | That a session can be run from newly captured browser input | Clinically accurate transcription, validated acoustic biomarkers, or clinical efficacy |

The English preset intentionally includes a transcript such as `wed wabbit`. Seeing that text in a **synthetic preset** run is expected; it is fixture data, not evidence of what the microphone heard. A live result should be judged only with its displayed input provenance and transcript.

All patient profiles, benchmark cases, transcripts, and reported session histories included in this repository are synthetic. This prototype is not a medical device and must not be used for diagnosis, treatment decisions, or unsupervised patient care.

## What the prototype currently does

- Runs a seven-stage deterministic orchestration cycle over a target phrase, transcript, pause data, pitch samples, and a synthetic patient profile.
- Produces inspectable agent events for speech-pattern detection, reasoning, sensory cue selection, experiment selection, digital-twin update, safety review, and progress projection.
- Applies a separate actuation safety gate. A mandatory-rest result blocks pacing; session-bound clinician approval is required where the policy requests it.
- Supports a browser microphone path and a clearly separate synthetic-preset path.
- Provides exploratory camera, gesture, pacing, and wearable demonstrations. These modules are prototype interfaces; their presence is not clinical validation, and an independent camera demo must not be described as fused into a microphone result unless the result explicitly records that source.
- Generates an experimental FHIR R4-shaped JSON bundle. The bundle has not been profile-validated or tested against a production EHR.
- Optionally calls the Gemini API when the user supplies a key. The benchmark and local deterministic path do not require that key.

## Orchestration overview

```text
Target phrase + transcript + signal features + synthetic profile
                              |
                              v
                    Speech Perception
                              |
                              v
                   Neuro-Cognitive Reasoning
                              |
                              v
                    Sensory-Motor Planning
                              |
                              v
                    Experiment Selection
                              |
                              v
                     Digital-Twin Update
                              |
                              v
                      Safety Boundary
                              |
                              v
                    Progress Projection
                              |
                              v
                Independent actuation safety gate
```

The trace viewer exposes structured application events, inputs, outputs, and decisions. It should not be described as revealing a model's private chain of thought.

## Reproducible software evidence

`npm run eval` executes `AgentOrchestrator.executeSessionCycle` against 10 frozen, invented scenarios in `src/services/EvaluationDataset.ts` and writes `EVALUATION_REPORT.json`.

The current checked-in report records:

| Software-regression result | Current report |
| :--- | ---: |
| Scenarios passed | 10 / 10 |
| Assertions passed | 80 / 80 |
| Expected safety dispositions matched | 10 / 10 |
| Allowed / blocked synthetic cases | 9 / 1 |

Each scenario checks the expected safety disposition, approval/rest flags, seven terminal agent events, gate coherence, intervention bounds, and fixture-to-output binding. These are software acceptance checks, not sensitivity/specificity, phoneme accuracy, clinical outcome, time-saved, or patient-safety evidence.

## Quick start

Requirements: Node.js 18 or newer, npm 9 or newer, and a current Chromium-based browser for the live microphone path.

```bash
npm install
npm run check
npm run dev
```

Open `http://localhost:3000/` if Vite does not open it automatically.

Useful commands:

```bash
npm run test       # unit and regression tests
npm run eval       # regenerate EVALUATION_REPORT.json
npm run typecheck  # TypeScript validation
npm run build      # production bundle
```

For an evaluator-focused walkthrough, input-provenance checks, and troubleshooting, see [REPRODUCTION_GUIDE.md](REPRODUCTION_GUIDE.md).

## Demo path

1. Open **micro1 Benchmarks** and run all 10 synthetic scenarios.
2. Inspect a normal scenario and the high-fatigue edge case; compare the expected and actual software assertions.
3. Open **Live Therapy Room** and run a **Synthetic Preset**. Confirm the UI labels the source as synthetic.
4. Switch to **Live Microphone**, grant permission, speak a different phrase, and inspect the captured transcript/source before interpreting the agent output.
5. Open **Agent Trace Brain** to inspect the seven application-level trace events.
6. Open **Therapist Portal** to exercise session-bound approval and generate the experimental FHIR-shaped report.

## Known limitations and next validation work

- Browser speech recognition varies by browser, operating system, language, network configuration, and ambient noise. A transcript can be wrong or unavailable.
- The acoustic measures are exploratory signal proxies. They have not been compared with clinician annotations or calibrated instruments.
- Camera, rPPG, gesture, and wearable demonstrations need independent device testing and synchronized data provenance before any multimodal-fusion claim.
- The synthetic dataset is small and invented by the project team. It cannot establish generalization, fairness, efficacy, or clinical safety.
- The FHIR-shaped export needs schema/profile validation, terminology review, consent/access-control design, and EHR integration testing.
- Any future participant study requires an appropriate protocol, informed consent, privacy controls, qualified clinical oversight, and ethics review where applicable.

## Optional Gemini connection

The API key dialog is optional. If enabled, the browser sends relevant prompt data to Google's Gemini API and stores the key in browser `localStorage` until it is removed. Do not use identifiable health information. The deterministic benchmark does not use Gemini, so an API response is not part of the 10-case regression evidence.
