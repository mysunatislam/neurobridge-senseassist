import React, { useState, useEffect } from 'react';
import { Play, Sparkles, CheckCircle2, ArrowRight, Brain, Zap, FlaskConical, FileText, Cpu, X } from 'lucide-react';

interface JudgeGuidedTourProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTab: (tab: string) => void;
  onTriggerTrial: () => void;
  onTriggerPacing: () => void;
}

export const JudgeGuidedTour: React.FC<JudgeGuidedTourProps> = ({
  isOpen,
  onClose,
  onSelectTab,
  onTriggerTrial,
  onTriggerPacing
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);

  if (!isOpen) return null;

  const tourSteps = [
    {
      title: 'Step 1: Audio Scenario Ingestion',
      tab: 'session',
      description: 'Run the disclosed synthetic preset or use the microphone to inspect temporal audio features and transcript substitutions. Webcam modules are exploratory and are not silently fused into the score.',
      actionLabel: 'Execute Live Trial',
      action: () => {
        onSelectTab('session');
        onTriggerTrial();
      }
    },
    {
      title: 'Step 2: 7-Agent Prototype Reasoning',
      tab: 'trace',
      description: 'Inspect the seven-stage deterministic reasoning trace and the inputs and outputs used at each prototype stage.',
      actionLabel: 'Inspect Agent Trace Brain',
      action: () => {
        onSelectTab('trace');
      }
    },
    {
      title: 'Step 3: Safety-Gated Sensory Actuation',
      tab: 'hardware',
      description: 'Demonstrate that haptic pacing can start only after the session safety result permits it or a clinician approves that exact session.',
      actionLabel: 'Actuate Haptic Wearable',
      action: () => {
        onSelectTab('hardware');
        onTriggerPacing();
      }
    },
    {
      title: 'Step 4: Reproducible Synthetic Acceptance Suite',
      tab: 'evaluations',
      description: 'Run the same canonical 10-case acceptance suite used by the command-line evaluator and inspect every expected-versus-actual check.',
      actionLabel: 'Open Acceptance Suite',
      action: () => {
        onSelectTab('evaluations');
      }
    },
    {
      title: 'Step 5: Clinician Review & Draft FHIR Export',
      tab: 'therapist',
      description: 'Review session-bound clinician approval and download an explicitly validation-pending FHIR R4-shaped research bundle.',
      actionLabel: 'Open Therapist Review',
      action: () => {
        onSelectTab('therapist');
      }
    }
  ];

  const handleNext = () => {
    const nextStep = Math.min(tourSteps.length - 1, currentStep + 1);
    setCurrentStep(nextStep);
    tourSteps[nextStep].action();
  };

  const handlePrev = () => {
    const prevStep = Math.max(0, currentStep - 1);
    setCurrentStep(prevStep);
    tourSteps[prevStep].action();
  };

  const stepInfo = tourSteps[currentStep];

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 z-50 w-auto sm:w-96 max-w-[calc(100vw-2rem)] rounded-3xl bg-slate-900/95 border-2 border-teal-500 shadow-2xl shadow-teal-500/20 backdrop-blur-xl p-5 animate-in fade-in slide-in-from-bottom-5">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-4 h-4 text-teal-400 animate-spin" />
          <span className="text-xs font-bold text-white uppercase tracking-wider">
            Judge Interactive Guided Tour
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-[11px] font-mono text-teal-400 font-bold">
            {currentStep + 1} / {tourSteps.length}
          </span>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="space-y-3">
        <h4 className="text-sm font-bold text-teal-300">{stepInfo.title}</h4>
        <p className="text-xs text-slate-300 leading-relaxed">{stepInfo.description}</p>

        <button
          onClick={stepInfo.action}
          className="w-full py-2 px-3 rounded-xl bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 border border-teal-500/40 text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>{stepInfo.actionLabel}</span>
        </button>

        <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
          <button
            onClick={handlePrev}
            disabled={currentStep === 0}
            className="text-xs text-slate-400 hover:text-white font-medium disabled:opacity-30"
          >
            Previous
          </button>
          <div className="flex space-x-1">
            {tourSteps.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  currentStep === i ? 'w-4 bg-teal-400' : 'w-1.5 bg-slate-700'
                }`}
              />
            ))}
          </div>
          <button
            onClick={handleNext}
            disabled={currentStep === tourSteps.length - 1}
            className="text-xs text-teal-400 hover:text-teal-300 font-bold disabled:opacity-30"
          >
            Next Step &rarr;
          </button>
        </div>
      </div>
    </div>
  );
};
