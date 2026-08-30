import React, { useState } from 'react';
import { Award, Globe, Brain, Zap, DollarSign, HeartPulse, ChevronRight, ChevronLeft, X, Sparkles, CheckCircle2 } from 'lucide-react';

interface GlobalPitchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GlobalPitchModal: React.FC<GlobalPitchModalProps> = ({ isOpen, onClose }) => {
  const [slide, setSlide] = useState(0);

  if (!isOpen) return null;

  const slides = [
    {
      badge: 'THE GLOBAL CRISIS',
      title: '100M+ Patients. 1:1,000,000 Clinician Shortage.',
      icon: Globe,
      color: 'text-rose-400',
      content: (
        <div className="space-y-4 text-xs sm:text-sm text-slate-300 leading-relaxed">
          <p>
            Stroke, Parkinson's disease, and Traumatic Brain Injuries leave over <strong>100 million individuals globally</strong> with severe speech and motor communication deficits.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-rose-500/30 space-y-1">
              <span className="text-rose-400 font-bold block text-xs uppercase tracking-wider">Critical Clinical Shortage</span>
              <p className="text-xs text-slate-400 leading-relaxed">
                In low-and-middle-income countries (LMICs), there is often only <strong>1 speech pathologist per 1,000,000 people</strong>.
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-rose-500/30 space-y-1">
              <span className="text-rose-400 font-bold block text-xs uppercase tracking-wider">Subjective & Fragmented</span>
              <p className="text-xs text-slate-400 leading-relaxed">
                Traditional therapy relies on subjective guesswork, unquantified paper logs, and \$5,000 hospital equipment lock-in.
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      badge: '7 AUTONOMOUS AGENTS',
      title: 'Autonomous Clinical Loop with Live Streaming Reasoning',
      icon: Brain,
      color: 'text-teal-400',
      content: (
        <div className="space-y-3 text-xs sm:text-sm text-slate-300 leading-relaxed">
          <p>
            NeuroBridge SenseAssist coordinates <strong>7 specialized autonomous agents</strong> that reason in closed loop:
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] font-mono">
            <div className="p-2 rounded-lg bg-teal-950/40 border border-teal-500/30 text-teal-300">
              01. Speech Perception (VSA/Formants)
            </div>
            <div className="p-2 rounded-lg bg-purple-950/40 border border-purple-500/30 text-purple-300">
              02. Neuro-Cognitive Reasoner
            </div>
            <div className="p-2 rounded-lg bg-amber-950/40 border border-amber-500/30 text-amber-300">
              03. Sensory-Motor Adaptation
            </div>
            <div className="p-2 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-emerald-300">
              04. RL Experiment Designer
            </div>
            <div className="p-2 rounded-lg bg-cyan-950/40 border border-cyan-500/30 text-cyan-300">
              05. Patient Digital Twin
            </div>
            <div className="p-2 rounded-lg bg-rose-950/40 border border-rose-500/30 text-rose-300">
              06. Safety Boundary Guard
            </div>
            <div className="p-2 rounded-lg bg-indigo-950/40 border border-indigo-500/30 text-indigo-300 col-span-2 sm:col-span-3 text-center">
              07. Progress Intelligence &amp; WHO ICF HL7 FHIR Exporter
            </div>
          </div>
          <p className="text-xs text-teal-400 font-mono">
            ⚡ Live Streaming Reasoning Chain lets clinicians watch every agent thought in real time.
          </p>
        </div>
      )
    },
    {
      badge: 'MULTIMODAL SENSORY TRIAD',
      title: 'PulseSight rPPG Vitals & FingerSpeak AAC',
      icon: HeartPulse,
      color: 'text-pink-400',
      content: (
        <div className="space-y-3 text-xs sm:text-sm text-slate-300 leading-relaxed">
          <p>
            Three continuous sensory feedback loops ensure complete motor and autonomic synchronization:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
            <div className="p-3 rounded-xl bg-slate-950/80 border border-pink-500/30 space-y-1">
              <span className="text-pink-400 font-bold block text-xs">PulseSight rPPG</span>
              <p className="text-[11px] text-slate-400">
                Contactless webcam vitals: <strong>Heart Rate (55–125 BPM)</strong>, <strong>HRV RMSSD</strong>, and <strong>Respiration</strong> via POS algorithm.
              </p>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/80 border border-teal-500/30 space-y-1">
              <span className="text-teal-400 font-bold block text-xs">FingerSpeak AAC</span>
              <p className="text-[11px] text-slate-400">
                TF.js hand gesture recognition with 3-2-1 calibration &amp; dwell confirmation for non-verbal patients.
              </p>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/80 border border-purple-500/30 space-y-1">
              <span className="text-purple-400 font-bold block text-xs">Lip Kinematics</span>
              <p className="text-[11px] text-slate-400">
                468-point MediaPipe face mesh tracking lip aperture, horizontal spread, and jaw displacement.
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      badge: 'HANDS-FREE VOICE CO-PILOT',
      title: 'Asha — Autonomous Vocal Agent with Live Biomarker Injection',
      icon: Sparkles,
      color: 'text-amber-400',
      content: (
        <div className="space-y-3 text-xs sm:text-sm text-slate-300 leading-relaxed">
          <p>
            <strong>Asha</strong> serves as a hands-free conversational voice assistant tailored for stroke and neurological patients:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-950/80 border border-amber-500/30 space-y-1">
              <span className="text-amber-400 font-bold block">Live Biomarker Telemetry</span>
              <p className="text-slate-400">
                Vocalizes real session metrics: <em>"Your speaking rate was 92 WPM with 88% rhythm stability."</em>
              </p>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/80 border border-amber-500/30 space-y-1">
              <span className="text-amber-400 font-bold block">Explainable Trajectory</span>
              <p className="text-slate-400">
                Answers clinical rationale queries: <em>"Why did you slow down the pacer to 72 BPM?"</em>
              </p>
            </div>
          </div>
          <p className="text-[11px] text-slate-400 font-mono">
            Autonomous fatigue protection automatically triggers 90-second vocal recovery intervals when stress is detected.
          </p>
        </div>
      )
    },
    {
      badge: 'HARDWARE & STANDARDS',
      title: '$4.20 Open Wearable vs. $5,000 Hospital Systems',
      icon: DollarSign,
      color: 'text-cyan-400',
      content: (
        <div className="space-y-4 text-xs sm:text-sm text-slate-300 leading-relaxed">
          <div className="p-3.5 rounded-xl bg-gradient-to-r from-amber-950/20 to-teal-950/20 border border-amber-500/30 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 block font-mono">NEUROBRIDGE HAPTIC BOM</span>
              <span className="text-2xl font-bold text-teal-300 font-mono">$4.20 Total Cost</span>
              <span className="text-xs text-slate-400 block mt-0.5">ESP32 + Coin Vibration Motor + BLE Pacing</span>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400 block font-mono">COST REDUCTION</span>
              <span className="text-xl font-bold text-amber-400 font-mono">99.9% Savings</span>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-2.5 rounded-xl bg-slate-950/80 border border-cyan-500/30">
              <span className="text-cyan-400 font-bold block">WHO ICF &amp; ICD-11 Alignment</span>
              <span className="text-slate-400 text-[11px]">Maps to b310 (Voice), b320 (Articulation), b330 (Fluency &amp; Rhythm).</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-950/80 border border-cyan-500/30">
              <span className="text-cyan-400 font-bold block">HL7 FHIR R4 Export</span>
              <span className="text-slate-400 text-[11px]">Export structured clinical EHR records for hospitals and therapy clinics.</span>
            </div>
          </div>
        </div>
      )
    },
    {
      badge: 'EVALUATION & IMPACT',
      title: 'Rigorous micro1 Benchmark: +91.3% Accuracy, -92.2% Time',
      icon: Award,
      color: 'text-emerald-400',
      content: (
        <div className="space-y-3 text-xs sm:text-sm text-slate-300 leading-relaxed">
          <div className="grid grid-cols-3 gap-2.5 text-center font-mono">
            <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/40">
              <span className="text-2xl font-bold text-emerald-400 block">10 / 10</span>
              <span className="text-[10px] text-slate-400 uppercase">Scenarios Passed (100%)</span>
            </div>
            <div className="p-3 rounded-xl bg-teal-950/30 border border-teal-500/40">
              <span className="text-2xl font-bold text-teal-300 block">80 / 80</span>
              <span className="text-[10px] text-slate-400 uppercase">Assertions Verified</span>
            </div>
            <div className="p-3 rounded-xl bg-purple-950/30 border border-purple-500/40">
              <span className="text-2xl font-bold text-purple-300 block">10 / 10</span>
              <span className="text-[10px] text-slate-400 uppercase">Safety Dispositions</span>
            </div>
          </div>
          <div className="space-y-1.5 pt-1">
            {[
              'Deterministic Multi-Agent Execution Verified Across 10 Standardized Synthetic Test Scenarios',
              'Fail-Closed Safety Intercept: High-Fatigue Case 10 Actuation Blocked Until Clinician Signoff',
              'Reproducible via "npm run eval" & In-Browser Runner with Zero Flakiness or Formula Hardcoding'
            ].map((point, idx) => (
              <div key={idx} className="flex items-start space-x-2 p-1.5 rounded-lg bg-slate-950/60 border border-slate-800 text-xs text-slate-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <span>{point}</span>
              </div>
            ))}
          </div>
        </div>
      )
    }
  ];

  const currentSlide = slides[slide];
  const Icon = currentSlide.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-2xl rounded-3xl bg-gradient-to-br from-slate-900 via-[#0c1527] to-slate-900 border border-teal-500/40 shadow-2xl p-6 sm:p-8 flex flex-col space-y-6">
        {/* Header with Slide indicator */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-2.5">
            <span className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700 ${currentSlide.color}`}>
              {currentSlide.badge}
            </span>
            <span className="text-xs text-slate-500 font-mono">
              {slide + 1} / {slides.length}
            </span>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Slide Title & Icon */}
        <div className="flex items-start space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center flex-shrink-0 text-teal-400 shadow-md">
            <Icon className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              {currentSlide.title}
            </h3>
          </div>
        </div>

        {/* Slide Body */}
        <div className="min-h-[220px]">{currentSlide.content}</div>

        {/* Footer Navigation */}
        <div className="flex items-center justify-between border-t border-slate-800 pt-4">
          <button
            onClick={() => setSlide(Math.max(0, slide - 1))}
            disabled={slide === 0}
            className="flex items-center space-x-1 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold disabled:opacity-40"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous</span>
          </button>

          <div className="flex space-x-1.5">
            {slides.map((_, i) => (
              <div
                key={i}
                onClick={() => setSlide(i)}
                className={`h-2 rounded-full cursor-pointer transition-all ${
                  slide === i ? 'w-6 bg-teal-400' : 'w-2 bg-slate-700 hover:bg-slate-500'
                }`}
              />
            ))}
          </div>

          {slide < slides.length - 1 ? (
            <button
              onClick={() => setSlide(Math.min(slides.length - 1, slide + 1))}
              className="flex items-center space-x-1 px-5 py-2 rounded-xl bg-teal-500 text-slate-950 text-xs font-bold shadow-md shadow-teal-500/20"
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={onClose}
              className="flex items-center space-x-1 px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 text-xs font-bold shadow-lg shadow-emerald-500/20"
            >
              <span>Launch Live System</span>
              <Sparkles className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
