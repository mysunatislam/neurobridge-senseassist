# NeuroBridge SenseAssist — Engineering Risk Register

> Evidence boundary: this is a hackathon research prototype evaluated on disclosed synthetic scenarios. It is not a diagnostic system, medical device, validated treatment, or production EHR integration.

## What the prototype demonstrates

- A deterministic seven-stage software workflow with inspectable runtime events.
- Audio timing, waveform-energy, pitch-proxy, and transcript-alignment features.
- Separate exploratory webcam modules for facial landmarks, rPPG estimates, and gesture AAC.
- A session-bound safety policy for haptic actuation, an explicit stop path, an 80% intensity clamp, BLE disconnect shutdown, and a three-second firmware watchdog.
- A canonical ten-case synthetic acceptance suite shared by the application and command line.
- A FHIR R4-shaped research export whose profile validation is explicitly pending.

These modules demonstrate engineering behavior only. They do not establish clinical effectiveness, diagnostic accuracy, physiological-measurement accuracy, regulatory status, or real-world patient benefit.

## Principal risks and current mitigations

### 1. Haptic hardware calibration

**Risk:** An inexpensive ESP32 and vibration motor have unknown delivered force, frequency response, timing under load, skin coupling, and long-term reliability.

**Implemented mitigation:** Software and firmware intensity clamps, explicit stop packets, disconnect shutdown, and a packet watchdog.

**Remaining evidence:** Oscilloscope timing, calibrated accelerometer/force measurements, enclosure and battery analysis, electrical safety review, and supervised usability testing.

### 2. Acoustic-feature validity

**Risk:** Browser transcription can fail on impaired speech, while naive spectral peaks can be mistaken for clinical formants.

**Implemented mitigation:** The live microphone path separately measures time-domain RMS, pause boundaries, and autocorrelation pitch estimates. Spectral outputs are labelled exploratory proxies, and webcam kinematics are not silently fused into the decision score.

**Remaining evidence:** Consented labelled recordings, clinician annotations, a pre-registered signal-processing protocol, error bars, subgroup analysis, and comparison against established acoustic tooling.

### 3. Adaptive-policy reward errors

**Risk:** A bandit trained on the wrong reward could prefer easy tasks or unsafe stimulation.

**Implemented mitigation:** The current UCB1 demonstration uses deterministic synthetic rewards and is downstream of the session safety policy.

**Remaining evidence:** Prospectively defined outcomes, offline policy evaluation, clinician-approved action bounds, counterfactual analysis, and a study protocol. No autonomous patient adaptation is claimed.

### 4. Regulatory and clinical liability

**Risk:** Diagnostic language or unreviewed treatment changes could create patient harm and regulatory exposure.

**Implemented mitigation:** Persistent research-prototype labelling, non-diagnostic wording, session-bound clinician approval, and a central actuator gate.

**Remaining evidence:** Formal intended-use definition, quality and risk management, privacy/security review, human-factors work, clinical evaluation, and jurisdiction-specific regulatory advice.

### 5. Accessibility and adherence

**Risk:** The workflow may be difficult for older adults or people with motor, speech, vision, or cognitive impairments.

**Implemented mitigation:** High-contrast controls, responsive navigation, a guided judge flow, voice commands, and a visible emergency-stop path. BLE pairing still requires an explicit browser permission gesture.

**Remaining evidence:** Keyboard and screen-reader audit, contrast measurements, switch-access testing, moderated studies with intended users and caregivers, and longitudinal adherence measurement.

## Comparison boundary

| Dimension | What can be compared now | What cannot yet be claimed |
| --- | --- | --- |
| Workflow | Reproducible synthetic acceptance checks and execution duration | Clinician time saved or superior clinical accuracy |
| Modalities | Independent audio, vision, gesture, and haptic prototype modules | Validated multimodal fusion or patient outcome improvement |
| Hardware | Illustrative ESP32/motor bill of materials and safety controls | Medical-grade equivalence, calibrated dose, or 99.9% cost reduction |
| Interoperability | Inspectable FHIR R4-shaped JSON | Standards compliance or production EHR compatibility |
| Impact | A plausible problem and testable product hypothesis | DALYs gained, cost savings, capacity multipliers, or adherence rates |

## Validation roadmap

1. Freeze the intended use and acceptance criteria.
2. Bench-test haptic timing, force, shutdown behavior, and BLE threat model.
3. Collect consented, labelled recordings with clinician ground truth.
4. Report confidence intervals, failure cases, and subgroup performance.
5. Run official accessibility, security, and FHIR validation tools.
6. Conduct supervised feasibility work before making any treatment or outcome claim.

The appropriate hackathon claim is: **NeuroBridge SenseAssist demonstrates a safety-gated, inspectable rehabilitation-assistance architecture on synthetic scenarios and provides a concrete plan for real validation.**
