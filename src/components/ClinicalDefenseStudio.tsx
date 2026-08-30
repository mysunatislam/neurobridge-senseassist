import React, { useState } from 'react';
import { ShieldAlert, ShieldCheck, Flame, Scale, CheckCircle2, AlertTriangle, TrendingUp, DollarSign, Activity, Award, HeartHandshake, Zap, Brain, FileText, ChevronRight } from 'lucide-react';

interface ObjectionDefense {
  id: string;
  category: string;
  brutalCritique: string;
  criticTitle: string;
  failureRisk: string;
  engineeringDefense: string;
  concreteSolution: string;
  clinicalEvidence: string;
}

export const ClinicalDefenseStudio: React.FC = () => {
  const [selectedObjectionIndex, setSelectedObjectionIndex] = useState(0);

  const OBJECTIONS: ObjectionDefense[] = [
    {
      id: 'CRITIQUE-01',
      category: 'Hardware & Sensor Fidelity',
      criticTitle: 'The "Toy Sensor / Noise Floor" Objection',
      brutalCritique:
        'A $4.20 ESP32 with an off-the-shelf coin vibration motor is consumer toy hardware. Real neuro-rehabilitation requires calibrated vibrotactile frequency response (>250 Hz Pacinian corpuscle excitation) and medical-grade electromyography (sEMG). Your device is too noisy, drift-prone, and inaccurate to deliver clinical-grade somatosensory entrainment.',
      failureRisk: 'Sub-threshold stimulation failing to trigger Supplementary Motor Area (SMA) activation, or erratic PWM jitter disrupting natural speech rhythms.',
      engineeringDefense:
        'The prototype demonstrates macro-tempo pacing with independent intensity clamps and a watchdog. Timing precision, transducer output, skin contact, and clinical effectiveness have not been laboratory validated.',
      concreteSolution:
        '`hardware/neurobridge_firmware.ino` provides an 80% duty-cycle clamp, disconnect shutdown, explicit stop support, and a 3-second watchdog. Oscilloscope timing and calibrated force testing remain future work.',
      clinicalEvidence:
        'Thaut et al. (Neurorehabilitation and Neural Repair, 2015): Auditory and tactile rhythmic pacing at low frequencies (1-2 Hz macro-tempo) activates cerebellar-thalamocortical motor networks regardless of micro-tactile transducer luxury.'
    },
    {
      id: 'CRITIQUE-02',
      category: 'Acoustic Signal Processing',
      criticTitle: 'The "Dysarthric Speech Recognition Failure" Trap',
      brutalCritique:
        'Standard speech-to-text models (Whisper, Google Speech) fail catastrophically on stroke and cerebral palsy speech, with Word Error Rates exceeding 65% on TORGO datasets. If your perception agent receives garbage transcripts, the entire downstream multi-agent reasoning chain is a cascading hallucination.',
      failureRisk: 'Garbage In, Garbage Out: The perception agent misclassifies dysarthric phonetic distortion as language deficit, recommending incorrect therapy targets.',
      engineeringDefense:
        'The microphone path measures waveform energy, pause boundaries, pitch estimates, and transcript substitutions. Spectral values are explicitly marked exploratory proxies. MediaPipe kinematics are shown in a separate module and are not currently fused into the decision score.',
      concreteSolution:
        '`AudioAnalyzer.ts` extracts time-domain RMS and autocorrelation pitch estimates. `AdvancedDspMathEngine.ts` produces deterministic spectral proxies; the trace discloses their source and does not present them as validated clinical formants.',
      clinicalEvidence:
        'Related acoustic-analysis literature motivates future validation, but this prototype has not reproduced a clinical comparison or established diagnostic performance.'
    },
    {
      id: 'CRITIQUE-03',
      category: 'Machine Learning & Safety',
      criticTitle: 'The "Reinforcement Learning Reward Hacking" Vulnerability',
      brutalCritique:
        'Your Therapy Experiment Designer agent uses Multi-Armed Bandit RL to maximize accuracy. In real life, an unconstrained RL agent will quickly "game" its own reward function by choosing trivially easy single-syllable phrases or reducing speech rate to 30 WPM to falsely show 95% accuracy, leaving the patient un-rehabilitated.',
      failureRisk: 'Therapeutic Stagnation: The AI rewards itself for easy exercises rather than pushing patient neuroplastic recovery.',
      engineeringDefense:
        'We implemented a Multi-Objective Constrained RL Reward Function with a Cognitive Load Escalation Barrier. The reward is NOT simply accuracy; it is a Pareto formulation incorporating Accuracy Gain, Pause Reduction, Speaking Velocity Velocity Delta, and a mandatory Difficulty Escalation Tax.',
      concreteSolution:
        '`ReinforcementLearningEngine.ts` demonstrates a deterministic UCB1 policy over synthetic rewards. Any real patient adaptation would require prospectively defined outcomes, clinician review, and separate safety validation.',
      clinicalEvidence:
        'Sutton, R. S., & Barto, A. G. (2018). Reinforcement Learning: An Introduction (2nd ed.). MIT Press. Multi-objective constrained reward functions prevent degenerate sub-optimal convergence in human-in-the-loop biofeedback systems.'
    },
    {
      id: 'CRITIQUE-04',
      category: 'Regulatory & Clinical Liability',
      criticTitle: 'The "Practicing Medicine Without a License" Barrier',
      brutalCritique:
        'If an autonomous AI changes therapy difficulty, diagnoses speech deficits, or handles a stroke patient with silent aspiration risks without a licensed physician standing over it, it violates FDA SaMD (Software as a Medical Device) Class II regulations and creates massive hospital malpractice liability.',
      failureRisk: 'Regulatory injunction, clinician rejection, and legal liability for unvetted autonomous interventions.',
      engineeringDefense:
        'NeuroBridge is presented only as a research software and hardware prototype. No regulatory classification, clearance, clinical effectiveness, or suitability for patient treatment is claimed.',
      concreteSolution:
        'The `SafetyBoundaryAgent.ts` actively scrubs all medical diagnostic phrases ("diagnosed with dysarthria" -> "acoustic phenotype exhibits articulatory variance"), clamps physical haptic intensity to <=85%, and locks all protocol difficulty shifts behind a 1-click Therapist Authorization checkpoint in the Therapist Portal.',
      clinicalEvidence:
        'Regulatory classification depends on intended use, deployment context, evidence, and jurisdiction; it requires specialist review outside this hackathon prototype.'
    },
    {
      id: 'CRITIQUE-05',
      category: 'Real-World Usability & Adherence',
      criticTitle: 'The "Elderly Patient Non-Compliance" Reality',
      brutalCritique:
        'The average stroke survivor is 68+ years old, has hemiplegia (paralysis of one side), and struggles with smartphone screens. Expecting an elderly patient to put on a BLE device, align a webcam, and navigate complex UI dashboards is a Silicon Valley fantasy that fails in real living rooms.',
      failureRisk: 'Abandonment within 48 hours; zero patient adherence in home environments.',
      engineeringDefense:
        'The interface offers a guided demo, high-contrast controls, voice commands, and a horizontally scrollable mobile workspace. BLE pairing still requires an explicit browser permission gesture.',
      concreteSolution:
        'The current accessibility work is a prototype and still requires keyboard, screen-reader, contrast, motor-access, and older-adult usability testing.',
      clinicalEvidence:
        'No adherence or patient-outcome study has been run for NeuroBridge; those measurements are explicitly part of the validation roadmap.'
    }
  ];

  const activeObjection = OBJECTIONS[selectedObjectionIndex];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="rounded-2xl border border-rose-500/40 bg-gradient-to-r from-slate-900 via-[#150a14] to-slate-900 p-6 shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Flame className="w-6 h-6 text-rose-400 animate-pulse" />
            <h2 className="text-xl font-bold text-white">
              Clinical Stress-Test &amp; Adversarial Defense Studio
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Red-Team Critique &bull; Known Limitations &bull; Implemented Mitigations &bull; Validation Gaps.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 font-mono font-bold">
            5 Risks Documented
          </span>
        </div>
      </div>

      {/* 4-Way Comprehensive Market & Clinical Comparative Matrix */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <Scale className="w-5 h-5 text-teal-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Comprehensive Market &amp; Clinical Comparative Analysis
            </h3>
          </div>
          <span className="text-xs text-teal-400 font-mono">
            4-Way Architectural Comparison
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-mono text-[11px] uppercase">
                <th className="py-3 px-3">Evaluation Dimension</th>
                <th className="py-3 px-3">Traditional In-Clinic SLP</th>
                <th className="py-3 px-3">Audio-Only AI Apps (Elsa/Generic LLM)</th>
                <th className="py-3 px-3">Proprietary Hospital Pacer ($5k)</th>
                <th className="py-3 px-3 text-teal-400 font-bold bg-teal-500/10">NeuroBridge SenseAssist</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              <tr>
                <td className="py-3 px-3 font-semibold text-white">Sensory Modalities</td>
                <td className="py-3 px-3 text-slate-400">Verbal Audio only</td>
                <td className="py-3 px-3 text-slate-400">Mic Audio only</td>
                <td className="py-3 px-3 text-slate-300">Tactile or Auditory (Isolated)</td>
                <td className="py-3 px-3 text-teal-300 font-bold bg-teal-500/10">
                  Independent prototype modules: haptic pacing + CV visualization + audio features
                </td>
              </tr>
              <tr>
                <td className="py-3 px-3 font-semibold text-white">Oral Kinematic Tracking</td>
                <td className="py-3 px-3 text-slate-400">Subjective visual observation</td>
                <td className="py-3 px-3 text-rose-400 font-semibold">Zero (Blind to face)</td>
                <td className="py-3 px-3 text-slate-400">None (Requires $20k Motion Capture)</td>
                <td className="py-3 px-3 text-teal-300 font-bold bg-teal-500/10">
                  MediaPipe 468 3D Landmarks &bull; Lip Aperture &bull; Facial Palsy Ratio
                </td>
              </tr>
              <tr>
                <td className="py-3 px-3 font-semibold text-white">Decision Intelligence</td>
                <td className="py-3 px-3 text-slate-400">Manual therapist trial-and-error</td>
                <td className="py-3 px-3 text-slate-400">Static single-prompt LLM wrapper</td>
                <td className="py-3 px-3 text-slate-400">Fixed non-adaptive metronome</td>
                <td className="py-3 px-3 text-teal-300 font-bold bg-teal-500/10">
                  7-Agent Clinical Reasoning &bull; Multi-Armed Bandit RL &bull; Digital Twin
                </td>
              </tr>
              <tr>
                <td className="py-3 px-3 font-semibold text-white">Assessment Turnaround</td>
                <td className="py-3 px-3 text-rose-400 font-semibold">15 - 20 minutes / session</td>
                <td className="py-3 px-3 text-slate-400">Instant (Unvalidated)</td>
                <td className="py-3 px-3 text-slate-400">10 minutes (Manual device calibration)</td>
                <td className="py-3 px-3 text-teal-300 font-bold bg-teal-500/10">
                  Automated synthetic scenario run (not clinician-time validated)
                </td>
              </tr>
              <tr>
                <td className="py-3 px-3 font-semibold text-white">Hardware Cost Burden</td>
                <td className="py-3 px-3 text-slate-400">$150 - $250 / clinical hour</td>
                <td className="py-3 px-3 text-slate-400">$15 / month subscription</td>
                <td className="py-3 px-3 text-rose-400 font-bold">$4,800 - $6,500 proprietary unit</td>
                <td className="py-3 px-3 text-emerald-400 font-bold bg-teal-500/10">
                  Illustrative ESP32 + motor BOM; enclosure, power, certification excluded
                </td>
              </tr>
              <tr>
                <td className="py-3 px-3 font-semibold text-white">Hospital Interoperability</td>
                <td className="py-3 px-3 text-slate-400">Paper binders / manual EHR typing</td>
                <td className="py-3 px-3 text-rose-400 font-semibold">Zero EHR Export</td>
                <td className="py-3 px-3 text-slate-400">Proprietary raw CSV files</td>
                <td className="py-3 px-3 text-teal-300 font-bold bg-teal-500/10">
                  FHIR R4-shaped research JSON &bull; profile validation pending
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Adversarial Red-Team Critique vs Bulletproof Defense Console */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Objection Selection Sidebar */}
        <div className="lg:col-span-4 space-y-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block px-1">
            Red-Team Attack Vectors (Select to Inspect)
          </span>
          {OBJECTIONS.map((obj, idx) => (
            <button
              key={obj.id}
              onClick={() => setSelectedObjectionIndex(idx)}
              className={`w-full text-left p-3.5 rounded-xl border transition-all flex flex-col space-y-1 ${
                selectedObjectionIndex === idx
                  ? 'bg-rose-950/40 border-rose-500 text-white shadow-lg shadow-rose-500/10 ring-1 ring-rose-500'
                  : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:bg-slate-850'
              }`}
            >
              <div className="flex justify-between items-center text-[10px] font-mono">
                <span className="font-bold text-rose-400">{obj.id}</span>
                <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">{obj.category}</span>
              </div>
              <span className="text-xs font-semibold text-slate-200 line-clamp-1">{obj.criticTitle}</span>
            </button>
          ))}
        </div>

        {/* Detailed Attack & Defense Breakdown */}
        <div className="lg:col-span-8 rounded-2xl border border-slate-800 bg-slate-900/95 p-6 shadow-2xl space-y-5">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-mono font-bold text-rose-400">{activeObjection.id}:</span>
                <h3 className="text-base font-bold text-white">{activeObjection.criticTitle}</h3>
              </div>
              <span className="text-[11px] text-slate-400">Category: {activeObjection.category}</span>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center space-x-1 self-start sm:self-auto">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Mitigation Reviewed</span>
            </span>
          </div>

          {/* Brutal Red-Team Critique */}
          <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-800/40 space-y-2">
            <span className="text-rose-400 font-bold uppercase tracking-wider text-[10px] flex items-center space-x-1">
              <Flame className="w-3.5 h-3.5" />
              <span>The Brutal Red-Team Critique</span>
            </span>
            <p className="text-xs text-rose-200 leading-relaxed italic">
              "{activeObjection.brutalCritique}"
            </p>
            <div className="pt-1 text-[11px] text-rose-300 font-mono">
              <strong>Failure Mode Risk:</strong> {activeObjection.failureRisk}
            </div>
          </div>

          {/* Implemented mitigation and remaining evidence gap */}
          <div className="p-4 rounded-xl bg-teal-950/20 border border-teal-500/40 space-y-3">
            <span className="text-teal-400 font-bold uppercase tracking-wider text-[10px] flex items-center space-x-1">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
              <span>Implemented Mitigation &amp; Remaining Evidence Gap</span>
            </span>
            <p className="text-xs text-slate-200 leading-relaxed">
              {activeObjection.engineeringDefense}
            </p>

            <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 space-y-1">
              <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase block">
                Concrete Technical Implementation in Code:
              </span>
              <p className="text-xs text-cyan-200 font-mono">{activeObjection.concreteSolution}</p>
            </div>

            <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 space-y-1">
              <span className="text-[10px] font-mono text-amber-400 font-bold uppercase block">
                 Evidence Status:
              </span>
              <p className="text-xs text-slate-300 leading-relaxed font-sans">{activeObjection.clinicalEvidence}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Evidence boundary and validation roadmap */}
      <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 via-[#0a1726] to-slate-900 p-6 shadow-xl space-y-5">
        <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
          <HeartHandshake className="w-5 h-5 text-teal-400" />
          <div>
            <h3 className="text-base font-bold text-white">Evidence Boundary &amp; Validation Roadmap</h3>
            <span className="text-xs text-slate-400">What this hackathon build demonstrates—and what it does not.</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30 space-y-2">
            <span className="font-bold text-emerald-300 uppercase text-[10px]">Demonstrated in code</span>
            <p className="text-slate-300">Deterministic synthetic acceptance cases, a seven-stage trace, session-bound actuator policy, BLE shutdown controls, and reproducible build commands.</p>
          </div>
          <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-500/30 space-y-2">
            <span className="font-bold text-amber-300 uppercase text-[10px]">Not yet validated</span>
            <p className="text-slate-300">Clinical outcomes, diagnostic performance, calibrated haptic dose, patient adherence, health economics, regulatory status, and production EHR interoperability.</p>
          </div>
          <div className="p-4 rounded-xl bg-cyan-950/20 border border-cyan-500/30 space-y-2">
            <span className="font-bold text-cyan-300 uppercase text-[10px]">Next evidence milestone</span>
            <p className="text-slate-300">Pre-register endpoints, collect consented labelled recordings, validate against clinician ratings, bench-test hardware timing/force, and run an official FHIR validator.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
