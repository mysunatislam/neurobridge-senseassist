# NeuroBridge SenseAssist — Reproduction Guide

This guide is written for an evaluator starting from a **completely clean environment** to deterministically run the solution, verify the baseline comparison, and reproduce the micro1 benchmark evaluations.

---

## 1. System Requirements & Environment

| Component | Minimum Specification | Recommended Specification |
| :--- | :--- | :--- |
| **Node.js** | `>= 18.0.0` | `v20.x` or `v24.x` |
| **NPM** | `>= 9.0.0` | `v10.x` or `v11.x` |
| **Web Browser** | Chrome 115+, Edge 115+ | Google Chrome (Web Audio & Web Bluetooth enabled) |
| **Memory** | 2 GB RAM | 4 GB RAM |
| **Estimated Cost** | **$0.00** (Full local deterministic engine included) | **$0.00** |
| **Execution Runtime** | `< 100 ms` for full 7-agent cycle | Real-time interactive |

---

## 2. Clean-Environment Quickstart (3 Commands)

Open a terminal in the project directory:

```bash
# 1. Install all dependencies (React, Vite, MediaPipe, Chart.js, Tailwind)
npm install

# 2. Run the automated 10-case evaluation benchmark (generates EVALUATION_REPORT.json)
npm run eval

# 3. Launch the interactive clinical application
npm run dev
```

The web application will open immediately at **`http://localhost:3000/`**.

---

## 3. How to Reproduce the Main Clinical Results

### Step A: Run the 10-Case Automated Benchmark
Execute:
```bash
npm run eval
```
**Expected Output**:
- Formatted ASCII table comparing all 10 clinical test cases.
- Primary Outcome: **Baseline 45.9% $\rightarrow$ Agent 84.3% (+83.7% accuracy improvement)**.
- Clinician Time Saved: **Baseline 18.0 min $\rightarrow$ Agent 1.8 min (-90.0% time reduction)**.
- Diagnostic Safety Violations: **12 $\rightarrow$ 0 (100% boundary compliance)**.
- Outputs `EVALUATION_REPORT.json`.

---

### Step B: Interactive UI Verification
1. Open `http://localhost:3000/` in Chrome or Edge.
2. In the top navigation bar, click the **micro1 Benchmarks** tab:
   - Inspect the side-by-side scorecard.
   - Click **Re-Run All 10 Benchmark Cases** to verify live execution.
   - Click on **Case 10 (Challenging Failure Mode)** to inspect how the Safety Agent catches vocal fatigue spikes.
3. In the **Live Therapy Room**:
   - Select patient **Arthur Vance (Stroke)** or toggle **Live Microphone**.
   - Click **Simulate Trial** or **Record Live Speech**.
   - Observe the 7-Agent execution progress bar.
4. In the **Agent Trace Brain** tab:
   - Inspect the step-by-step cognitive reasoning trace, tool calls, and raw JSON payloads.
5. In the **Therapist Portal**:
   - Click **HL7 FHIR (JSON)** and download `fhir_report_NB-001.json`.

---

## 4. Optional: Gemini API Configuration

NeuroBridge runs 100% locally out-of-the-box without requiring API keys. To connect live Gemini 1.5/2.5 generative reasoning:
1. Click the **API Key** button in the header.
2. Paste your Google Gemini API key (`AIzaSy...`).
3. Click **Save Key**. All clinical reasoning agents will now query Gemini's generative multimodal endpoint.
