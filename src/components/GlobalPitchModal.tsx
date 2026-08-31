import React, { useState } from 'react';
import {
  Award,
  Brain,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Eye,
  Globe,
  HeartPulse,
  ShieldAlert,
  Sparkles,
  Radio,
  X
} from 'lucide-react';

interface GlobalPitchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GlobalPitchModal: React.FC<GlobalPitchModalProps> = ({ isOpen, onClose }) => {
  const [slide, setSlide] = useState(0);

  if (!isOpen) return null;

  const slides = [
    {
      badge: 'PROBLEM HYPOTHESIS',
      title: 'Make Session Inputs and Automated Decisions Inspectable',
      icon: Globe,
      color: 'text-rose-400',
      content: (
        <div className="space-y-4 text-xs sm:text-sm text-slate-300 leading-relaxed">
          <p>
            Speech-session software can combine transcripts, timing features, cue selection, safety rules,
            and progress notes. The risk is that generated values can look like measurements even when they
            came from a fixture or projection.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-rose-500/30 space-y-1">
              <span className="text-rose-400 font-bold block text-xs uppercase tracking-wider">
                Prototype goal
              </span>
              <p className="text-xs text-slate-400 leading-relaxed">
                Keep the submitted input, each software decision, and the final actuation disposition visible
                to an evaluator.
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-amber-500/30 space-y-1">
              <span className="text-amber-400 font-bold block text-xs uppercase tracking-wider">
                Evidence boundary
              </span>
              <p className="text-xs text-slate-400 leading-relaxed">
                This hackathon build has software-regression evidence, not patient, diagnostic, efficacy, or
                medical-device validation.
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      badge: '7-STAGE ORCHESTRATION',
      title: 'Bounded Modules with an Inspectable Application Trace',
      icon: Brain,
      color: 'text-teal-400',
      content: (
        <div className="space-y-3 text-xs sm:text-sm text-slate-300 leading-relaxed">
          <p>
            NeuroBridge runs a deterministic seven-stage prototype pipeline over the submitted transcript,
            signal features, and synthetic profile:
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] font-mono">
            <div className="p-2 rounded-lg bg-teal-950/40 border border-teal-500/30 text-teal-300">
              01. Speech-pattern proxy
            </div>
            <div className="p-2 rounded-lg bg-purple-950/40 border border-purple-500/30 text-purple-300">
              02. Reasoning rules
            </div>
            <div className="p-2 rounded-lg bg-amber-950/40 border border-amber-500/30 text-amber-300">
              03. Cue planning
            </div>
            <div className="p-2 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-emerald-300">
              04. Experiment selection
            </div>
            <div className="p-2 rounded-lg bg-cyan-950/40 border border-cyan-500/30 text-cyan-300">
              05. Prototype state update
            </div>
            <div className="p-2 rounded-lg bg-rose-950/40 border border-rose-500/30 text-rose-300">
              06. Safety boundary
            </div>
            <div className="p-2 rounded-lg bg-indigo-950/40 border border-indigo-500/30 text-indigo-300 col-span-2 sm:col-span-3 text-center">
              07. Progress projection
            </div>
          </div>
          <p className="text-xs text-teal-400 font-mono">
            The trace shows structured application events, inputs, and outputs—not a model's private chain of thought.
          </p>
        </div>
      )
    },
    {
      badge: 'INPUT PROVENANCE',
      title: 'Synthetic Preset Is Not Live Microphone Evidence',
      icon: HeartPulse,
      color: 'text-pink-400',
      content: (
        <div className="space-y-4 text-xs sm:text-sm text-slate-300 leading-relaxed">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-4 rounded-xl bg-slate-950/80 border border-purple-500/30 space-y-2">
              <span className="text-purple-300 font-bold block">Synthetic preset</span>
              <p className="text-xs text-slate-400">
                Uses a frozen, invented transcript and signal fixture. The English preset deliberately includes
                substitutions such as <code className="text-purple-200">wed wabbit</code>.
              </p>
              <span className="text-[10px] uppercase tracking-wide text-purple-400 font-mono">
                Reproducible software demo
              </span>
            </div>
            <div className="p-4 rounded-xl bg-slate-950/80 border border-teal-500/30 space-y-2">
              <span className="text-teal-300 font-bold block">Live microphone</span>
              <p className="text-xs text-slate-400">
                Uses newly captured browser audio and the browser's speech-recognition transcript when available.
                Recognition can be wrong or unavailable.
              </p>
              <span className="text-[10px] uppercase tracking-wide text-teal-400 font-mono">
                Inspect transcript and source
              </span>
            </div>
          </div>
          <p className="text-[11px] text-amber-300 font-mono">
            Never interpret fixture text as something the participant said. Verify the result's source first.
          </p>
        </div>
      )
    },
    {
      badge: 'RESTORED SHOWCASE EXPERIENCE',
      title: 'Magic Storyboard, Full Demo, Quick Run, and Asha',
      icon: Sparkles,
      color: 'text-purple-400',
      content: (
        <div className="space-y-4 text-xs sm:text-sm text-slate-300 leading-relaxed">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-purple-950/30 border border-purple-500/30">
              <span className="font-bold text-purple-300 block">Magic Demo</span>
              <p className="mt-1 text-slate-400">A five-step scripted visual walkthrough that never overwrites live evidence.</p>
            </div>
            <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-500/30">
              <span className="font-bold text-amber-300 block">Full Demo</span>
              <p className="mt-1 text-slate-400">Runs the scene, then sends the labelled fixture through all seven actual software stages.</p>
            </div>
            <div className="p-3 rounded-xl bg-teal-950/30 border border-teal-500/30">
              <span className="font-bold text-teal-300 block">Asha + Quick Run</span>
              <p className="mt-1 text-slate-400">Explicit “synthetic demo” commands launch the fixture; generic “start trial” opens live capture.</p>
            </div>
          </div>
          <p className="text-[11px] text-amber-300 font-mono">Every showcase surface is labelled SCRIPTED SYNTHETIC DEMO.</p>
        </div>
      )
    },
    {
      badge: 'MULTIMODAL EXTENSIONS',
      title: 'Vision, PulseSight, FingerSpeak, and ESP32 Remain Available',
      icon: Eye,
      color: 'text-pink-400',
      content: (
        <div className="space-y-4 text-xs sm:text-sm text-slate-300 leading-relaxed">
          <div className="grid grid-cols-2 gap-3 text-xs">
            {[
              ['MediaPipe vision', 'Face and articulatory visualization playground'],
              ['PulseSight rPPG', 'Experimental camera-derived vitals module'],
              ['FingerSpeak AAC', 'Gesture-based accessibility interaction'],
              ['ESP32 wearable', 'Web Bluetooth pacing prototype behind the app gate']
            ].map(([name, description]) => (
              <div key={name} className="p-3 rounded-xl bg-slate-950/80 border border-pink-500/20">
                <span className="font-bold text-pink-300 block">{name}</span>
                <p className="mt-1 text-slate-400">{description}</p>
              </div>
            ))}
          </div>
          <p className="flex items-center gap-2 text-[11px] text-cyan-300 font-mono"><Radio className="w-3.5 h-3.5" /> These modules are preserved but do not silently become speech-pipeline measurements.</p>
        </div>
      )
    },
    {
      badge: 'SAFETY & INTEGRATION BOUNDARY',
      title: 'Fail-Closed Software Gate, Experimental Integrations',
      icon: ShieldAlert,
      color: 'text-amber-400',
      content: (
        <div className="space-y-3 text-xs sm:text-sm text-slate-300 leading-relaxed">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-950/80 border border-amber-500/30 space-y-1">
              <span className="text-amber-400 font-bold block">Actuation policy</span>
              <p className="text-slate-400">
                Mandatory-rest results block pacing. Where configured, approval is bound to the active patient
                and session. These are software controls, not certified medical-device controls.
              </p>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/80 border border-cyan-500/30 space-y-1">
              <span className="text-cyan-400 font-bold block">FHIR-shaped output</span>
              <p className="text-slate-400">
                The export is an experimental FHIR R4-shaped JSON bundle. Profile validation and production EHR
                integration have not been performed.
              </p>
            </div>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/80 border border-pink-500/30 text-xs text-slate-400">
            Camera, rPPG, gesture, pacing, and wearable screens are exploratory modules. Their presence does not
            prove accuracy, synchronized multimodal fusion, hardware performance, or therapeutic benefit.
          </div>
        </div>
      )
    },
    {
      badge: 'REPRODUCIBLE SOFTWARE EVALUATION',
      title: '10 Synthetic Scenarios, 80 Acceptance Assertions',
      icon: Award,
      color: 'text-emerald-400',
      content: (
        <div className="space-y-3 text-xs sm:text-sm text-slate-300 leading-relaxed">
          <div className="grid grid-cols-3 gap-2.5 text-center font-mono">
            <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/40">
              <span className="text-2xl font-bold text-emerald-400 block">10 / 10</span>
              <span className="text-[10px] text-slate-400 uppercase">Synthetic scenarios</span>
            </div>
            <div className="p-3 rounded-xl bg-teal-950/30 border border-teal-500/40">
              <span className="text-2xl font-bold text-teal-300 block">80 / 80</span>
              <span className="text-[10px] text-slate-400 uppercase">Software assertions</span>
            </div>
            <div className="p-3 rounded-xl bg-purple-950/30 border border-purple-500/40">
              <span className="text-2xl font-bold text-purple-300 block">10 / 10</span>
              <span className="text-[10px] text-slate-400 uppercase">Safety matches</span>
            </div>
          </div>
          <div className="space-y-1.5 pt-1">
            {[
              'Runs the actual orchestration entry point against frozen, invented fixtures',
              'Checks trace shape, safety disposition, gate coherence, bounds, and input binding',
              'Reproduces with npm run eval and writes EVALUATION_REPORT.json'
            ].map((point, idx) => (
              <div
                key={idx}
                className="flex items-start space-x-2 p-1.5 rounded-lg bg-slate-950/60 border border-slate-800 text-xs text-slate-200"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <span>{point}</span>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-amber-300 font-mono">
            These results are not clinical accuracy, efficacy, generalization, or patient-safety evidence.
          </p>
        </div>
      )
    }
  ];

  const currentSlide = slides[slide];
  const Icon = currentSlide.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-2xl rounded-3xl bg-gradient-to-br from-slate-900 via-[#0c1527] to-slate-900 border border-teal-500/40 shadow-2xl p-6 sm:p-8 flex flex-col space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-2.5">
            <span
              className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700 ${currentSlide.color}`}
            >
              {currentSlide.badge}
            </span>
            <span className="text-xs text-slate-500 font-mono">
              {slide + 1} / {slides.length}
            </span>
          </div>

          <button
            onClick={onClose}
            aria-label="Close pitch"
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-start space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center flex-shrink-0 text-teal-400 shadow-md">
            <Icon className="w-6 h-6" />
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">{currentSlide.title}</h3>
        </div>

        <div className="min-h-[220px]">{currentSlide.content}</div>

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
            {slides.map((item, i) => (
              <button
                key={item.badge}
                onClick={() => setSlide(i)}
                aria-label={`Open slide ${i + 1}`}
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
              <span>Open Prototype</span>
              <Sparkles className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
