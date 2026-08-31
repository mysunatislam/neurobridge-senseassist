import React, { lazy, Suspense, useEffect, useRef, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Cloud,
  Eye,
  FastForward,
  Mic,
  MicOff,
  Play,
  ShieldCheck,
  Sparkles,
  Volume2,
  Zap
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { PatientPresetCase } from '../services/MockPatientCases';
import { AudioWaveformVisualizer } from './AudioWaveformVisualizer';
import { PhonemeMouthGuide } from './PhonemeMouthGuide';
import { AgentTraceEvent, SessionInputProvenance, SessionRunResult } from '../agents/types';
import { AudioAnalysisResult, AudioAnalyzer } from '../services/AudioAnalyzer';
import { HapticPacket } from '../services/HapticController';
import { ActuationGateDecision } from '../services/ActuationSafetyGate';
import { AgentOrchestrator } from '../agents/AgentOrchestrator';
import { GlobalLanguageConfig } from '../services/GlobalLanguageService';
import { geminiService } from '../services/GeminiService';

const VisionKinematicsTracker = lazy(() =>
  import('./VisionKinematicsTracker').then((module) => ({ default: module.VisionKinematicsTracker }))
);

interface LiveTherapySessionProps {
  selectedPatient: PatientPresetCase;
  selectedLanguage: GlobalLanguageConfig;
  audioAnalyzer: AudioAnalyzer;
  agentOrchestrator: AgentOrchestrator;
  lastSessionResult: SessionRunResult | null;
  setLastSessionResult: (result: SessionRunResult) => void;
  onTrialStarted: () => void;
  onNavigateToTrace: () => void;
  isPacingActive: boolean;
  onRequestPacing: (packet: HapticPacket) => ActuationGateDecision;
  onStopPacing: () => void;
  actuationDecision: ActuationGateDecision;
  currentBeat: number;
  liveCaptureRequestToken: number;
  onLiveCaptureStateChange: (active: boolean) => void;
  onOpenApiKeyModal: () => void;
}

export const LiveTherapySession: React.FC<LiveTherapySessionProps> = ({
  selectedPatient,
  selectedLanguage,
  audioAnalyzer,
  agentOrchestrator,
  lastSessionResult,
  setLastSessionResult,
  onTrialStarted,
  onNavigateToTrace,
  isPacingActive,
  onRequestPacing,
  onStopPacing,
  actuationDecision,
  currentBeat,
  liveCaptureRequestToken,
  onLiveCaptureStateChange,
  onOpenApiKeyModal
}) => {
  const [targetPhrase, setTargetPhrase] = useState(selectedLanguage.defaultPhrase);
  const [inputMode, setInputMode] = useState<'preset' | 'mic'>('mic');
  const [isRecording, setIsRecording] = useState(false);
  const [isRunningAgents, setIsRunningAgents] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [streamingTrace, setStreamingTrace] = useState<AgentTraceEvent[]>([]);
  const [frequencyData, setFrequencyData] = useState<Uint8Array>();
  const [rmsDb, setRmsDb] = useState(-60);
  const [pendingCapture, setPendingCapture] = useState<AudioAnalysisResult | null>(null);
  const [transcriptDraft, setTranscriptDraft] = useState('');
  const [captureError, setCaptureError] = useState<string | null>(null);
  const [audioPlaybackUrl, setAudioPlaybackUrl] = useState<string | null>(null);
  const [cloudTranscriptionConsent, setCloudTranscriptionConsent] = useState(false);
  const [isCloudTranscribing, setIsCloudTranscribing] = useState(false);
  const [cloudTranscriptionStatus, setCloudTranscriptionStatus] = useState<string | null>(null);
  const [demoState, setDemoState] = useState<'idle' | 'running' | 'completed' | 'failed'>('idle');
  const [demoMode, setDemoMode] = useState<'magic' | 'full' | null>(null);
  const [demoStep, setDemoStep] = useState(0);
  const [fullDemoTrace, setFullDemoTrace] = useState<AgentTraceEvent[]>([]);
  const [showMultimodalStudio, setShowMultimodalStudio] = useState(true);
  const demoTimers = useRef<Array<ReturnType<typeof setTimeout>>>([]);
  const transcriptionRequestId = useRef(0);

  useEffect(() => {
    if (isRecording) {
      setIsRecording(false);
      onLiveCaptureStateChange(false);
      void audioAnalyzer.cancelRecording();
    }
    demoTimers.current.forEach((timer) => clearTimeout(timer));
    demoTimers.current = [];
    window.speechSynthesis?.cancel();
    setTargetPhrase(selectedLanguage.defaultPhrase);
    setPendingCapture(null);
    setTranscriptDraft('');
    setCaptureError(null);
    setCloudTranscriptionConsent(false);
    setCloudTranscriptionStatus(null);
    setIsCloudTranscribing(false);
    transcriptionRequestId.current += 1;
    setDemoState('idle');
    setDemoMode(null);
    setDemoStep(0);
    setFullDemoTrace([]);
  }, [selectedLanguage, selectedPatient]);

  useEffect(() => {
    setInputMode('mic');
  }, [liveCaptureRequestToken]);

  useEffect(() => {
    if (!pendingCapture?.audioBlob) {
      setAudioPlaybackUrl(null);
      return;
    }

    const nextUrl = URL.createObjectURL(pendingCapture.audioBlob);
    setAudioPlaybackUrl(nextUrl);
    return () => URL.revokeObjectURL(nextUrl);
  }, [pendingCapture?.audioBlob]);

  useEffect(() => () => {
    demoTimers.current.forEach((timer) => clearTimeout(timer));
    window.speechSynthesis?.cancel();
    onLiveCaptureStateChange(false);
    void audioAnalyzer.cancelRecording();
  }, [audioAnalyzer, onLiveCaptureStateChange]);

  const runPipeline = async (
    audio: AudioAnalysisResult,
    transcript: string,
    provenance: SessionInputProvenance
  ): Promise<SessionRunResult | null> => {
    setIsRunningAgents(true);
    setCurrentStepIndex(0);
    setStreamingTrace([]);
    setCaptureError(null);

    try {
      const result = await agentOrchestrator.executeSessionCycle(
        targetPhrase,
        transcript,
        audio.durationSec,
        audio.pauses,
        audio.pitchSamples,
        audio.rmsDb,
        selectedPatient.digitalTwin,
        (event, stepIndex) => {
          setCurrentStepIndex(stepIndex);
          setStreamingTrace((previous) => [...previous, event]);
        },
        provenance
      );
      setLastSessionResult(result);
      setPendingCapture(null);
      setTranscriptDraft('');
      return result;
    } catch (error) {
      setCaptureError(`Pipeline failed: ${error instanceof Error ? error.message : String(error)}`);
      return null;
    } finally {
      setIsRunningAgents(false);
    }
  };

  const handleToggleRecording = async () => {
    if (!isRecording) {
      if (demoState === 'running' || isRunningAgents) return;
      window.speechSynthesis?.cancel();
      onLiveCaptureStateChange(true);
      onTrialStarted();
      transcriptionRequestId.current += 1;
      setPendingCapture(null);
      setTranscriptDraft('');
      setCaptureError(null);
      setCloudTranscriptionConsent(false);
      setCloudTranscriptionStatus(null);
      setIsCloudTranscribing(false);
      const started = await audioAnalyzer.startRecording((data, db) => {
        setFrequencyData(new Uint8Array(data));
        setRmsDb(db);
      }, selectedLanguage.code);

      if (!started) {
        onLiveCaptureStateChange(false);
        setCaptureError('Microphone access did not start. Check browser permission and try again. No synthetic audio was substituted.');
        return;
      }
      setIsRecording(true);
      return;
    }

    setIsRecording(false);
    try {
      const capture = await audioAnalyzer.stopRecording();
      setPendingCapture(capture);
      setTranscriptDraft(capture.transcript);
      if (!capture.transcript) {
        setCaptureError('Audio was captured, but browser speech recognition returned no text. Replay it below, then request an explicit AI transcription candidate or type the reviewed words yourself.');
      } else if (capture.recognitionWarning) {
        setCaptureError(capture.recognitionWarning);
      }
    } catch (error) {
      setCaptureError(`Recording finalization failed: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      onLiveCaptureStateChange(false);
    }
  };

  const handleCloudTranscription = async () => {
    const capture = pendingCapture;
    if (!capture?.audioBlob || !capture.audioMimeType) {
      setCloudTranscriptionStatus('No encoded recording is available in this browser. You can still replay browser-supported audio or enter a reviewed transcript manually.');
      return;
    }
    if (!geminiService.hasApiKey()) {
      onOpenApiKeyModal();
      return;
    }
    if (!cloudTranscriptionConsent) {
      setCloudTranscriptionStatus('Consent is required before patient audio can be sent to Google Gemini.');
      return;
    }

    const requestId = ++transcriptionRequestId.current;
    setIsCloudTranscribing(true);
    setCloudTranscriptionStatus('Uploading this captured recording to Google Gemini for a candidate transcript…');
    try {
      const candidate = await geminiService.transcribeCapturedAudio(
        capture.audioBlob,
        capture.audioMimeType,
        selectedLanguage.code
      );
      if (requestId !== transcriptionRequestId.current) return;

      setPendingCapture((current) => current === capture ? {
        ...current,
        transcript: candidate.transcript,
        transcriptSource: 'gemini-audio-transcription'
      } : current);
      setTranscriptDraft(candidate.transcript);
      setCaptureError(null);
      setCloudTranscriptionStatus(
        `${candidate.model} produced a cloud candidate from the real recording. Review and correct every word before running the seven stages; errors remain possible for recovering or atypical speech.`
      );
    } catch (error) {
      if (requestId !== transcriptionRequestId.current) return;
      setCloudTranscriptionStatus(error instanceof Error ? error.message : String(error));
    } finally {
      if (requestId === transcriptionRequestId.current) setIsCloudTranscribing(false);
    }
  };

  const handleRunReviewedCapture = async () => {
    if (!pendingCapture) return;
    const reviewedTranscript = transcriptDraft.trim();
    if (!reviewedTranscript) {
      setCaptureError('A reviewed transcript is required. The system will not invent or substitute one.');
      return;
    }

    const wasCorrected = reviewedTranscript !== pendingCapture.transcript.trim();
    const usedCloudCandidate = pendingCapture.transcriptSource === 'gemini-audio-transcription';
    transcriptionRequestId.current += 1;
    setIsCloudTranscribing(false);
    await runPipeline(pendingCapture, reviewedTranscript, {
      source: 'live-microphone',
      transcriptSource: usedCloudCandidate
        ? 'gemini-audio-transcription-reviewed'
        : wasCorrected || pendingCapture.transcriptSource === 'unavailable'
          ? 'user-corrected'
          : 'browser-speech-recognition',
      label: usedCloudCandidate
        ? 'Live microphone audio with human-reviewed Gemini audio-transcription candidate'
        : wasCorrected
          ? 'Live microphone audio with user-reviewed transcript correction'
          : 'Live microphone audio with browser speech-recognition transcript',
      capturedAt: new Date().toISOString(),
      recognitionWarning: pendingCapture.recognitionWarning
    });
  };

  const handleRunPreset = async (demoLabel?: string): Promise<SessionRunResult | null> => {
    onTrialStarted();
    const preset = audioAnalyzer.simulatePresetCase({
      transcript: selectedLanguage.sampleSpoken,
      durationSec: selectedPatient.audioDurationSec,
      pauses: selectedPatient.detectedPauses,
      pitchSamples: selectedPatient.pitchSamples,
      rmsDb: selectedPatient.rmsEnergyDb
    });
    return runPipeline(preset, preset.transcript, {
      source: 'synthetic-preset',
      transcriptSource: 'synthetic-fixture',
      label: demoLabel ?? `Bundled deterministic fixture: ${selectedPatient.name} / ${selectedLanguage.name}`,
      capturedAt: new Date().toISOString()
    });
  };

  const startScriptedDemo = (mode: 'magic' | 'full') => {
    if (demoState === 'running' || isRunningAgents || isRecording) return;

    demoTimers.current.forEach((timer) => clearTimeout(timer));
    demoTimers.current = [];
    setDemoMode(mode);
    setDemoState('running');
    setDemoStep(1);
    setFullDemoTrace([]);
    setCaptureError(null);

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const scriptedVoice = new SpeechSynthesisUtterance(selectedLanguage.sampleSpoken);
      scriptedVoice.lang = selectedLanguage.code;
      scriptedVoice.rate = 0.82;
      window.speechSynthesis.speak(scriptedVoice);
    }

    [2, 3].forEach((step) => {
      demoTimers.current.push(setTimeout(() => setDemoStep(step), (step - 1) * 1200));
    });

    demoTimers.current.push(setTimeout(() => {
      setDemoStep(4);
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const scriptedRetry = new SpeechSynthesisUtterance(targetPhrase);
        scriptedRetry.lang = selectedLanguage.code;
        scriptedRetry.rate = 0.9;
        window.speechSynthesis.speak(scriptedRetry);
      }
    }, 3600));

    demoTimers.current.push(setTimeout(async () => {
      setDemoStep(5);

      if (mode === 'full') {
        const result = await handleRunPreset(
          `SCRIPTED SYNTHETIC DEMO — Full Demo fixture: ${selectedPatient.name} / ${selectedLanguage.name}`
        );
        setFullDemoTrace(result?.traceEvents ?? []);
        if (result?.traceEvents.length === 7) {
          confetti({ particleCount: 70, spread: 75, origin: { y: 0.65 } });
          setDemoState('completed');
        } else {
          setDemoState('failed');
          setCaptureError('Full Demo stopped before all seven stages emitted. No completion claim was recorded; inspect the error and retry.');
        }
      } else {
        setDemoState('completed');
      }
    }, 4800));
  };

  const handleTogglePacing = () => {
    if (isPacingActive) {
      onStopPacing();
      return;
    }
    if (!lastSessionResult) return;
    onRequestPacing({
      bpm: lastSessionResult.intervention.bpm,
      pattern: lastSessionResult.intervention.hapticPattern,
      intensity: lastSessionResult.intervention.hapticIntensityPercent,
      durationMs: lastSessionResult.intervention.pulseDurationMs,
      active: true
    });
  };

  const provenance = lastSessionResult?.inputProvenance;
  const configuredErrors = lastSessionResult?.phenotype.phonemeErrors ?? [];
  const scriptedDemoSteps = [
    {
      title: 'Fixture baseline',
      detail: `Browser text-to-speech plays the bundled fixture: “${selectedLanguage.sampleSpoken}” No microphone evidence is used.`
    },
    {
      title: 'Text-heuristic preview',
      detail: 'Configured substitution rules inspect fixture text. This is not an acoustic phoneme measurement.'
    },
    {
      title: 'Reasoning preview',
      detail: 'The storyboard explains how the deterministic stages turn scenario inputs into a proposed cue plan.'
    },
    {
      title: 'Hypothetical coached retry',
      detail: 'The visual loop illustrates a possible retry. It does not claim a measured patient improvement or trigger an actuator.'
    },
    {
      title: demoMode === 'full' ? 'Execute the real software pipeline' : 'Storyboard complete',
      detail: demoMode === 'full'
        ? 'The bundled fixture now runs through the actual seven-stage orchestrator; its emitted decisions appear below.'
        : 'Magic Demo changes no pipeline result. Use Full Demo to explicitly run the synthetic fixture through all seven stages.'
    }
  ];
  const architectureStages = [
    ['agent-speech-perception', 'Speech Perception', 'Audio features + reviewed transcript'],
    ['agent-neuro-cognitive-reasoning', 'Reasoning', 'Speech-derived heuristic + scenario history'],
    ['agent-sensory-motor', 'Sensory-Motor', 'Proposed pacing and visual cue packet'],
    ['agent-experiment-designer', 'Experiment Designer', 'Synthetic A/B policy projection'],
    ['agent-digital-twin', 'Digital Twin', 'Ephemeral scenario-state update'],
    ['agent-safety-boundary', 'Safety Boundary', 'Fail-closed rest, intensity, and approval checks'],
    ['agent-progress-optimization', 'Progress Summary', 'Synthetic-history comparison with provenance']
  ] as const;
  const visibleTrace = isRunningAgents ? streamingTrace : (lastSessionResult?.traceEvents ?? []);
  const completedStageIds = new Set(visibleTrace.map((event) => event.agentId));
  const summarizeTraceOutput = (outputData: unknown) => {
    if (outputData === null || outputData === undefined) return 'No structured output emitted';
    if (typeof outputData !== 'object') return String(outputData);
    const summary = Object.entries(outputData as Record<string, unknown>)
      .slice(0, 4)
      .map(([key, value]) => {
        const rendered = typeof value === 'object' ? JSON.stringify(value) : String(value);
        return `${key}: ${rendered}`;
      })
      .join(' · ');
    return summary.length > 240 ? `${summary.slice(0, 237)}…` : summary;
  };

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 text-xs text-amber-100">
        <div className="flex items-start gap-2">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
          <p>
            <strong>Evidence boundary:</strong> live mode records microphone features, while transcript text comes from the browser's speech-recognition service and can be wrong. The substitution check is a text heuristic, not a validated acoustic phoneme classifier. PulseSight camera tools are separate and are not fused into this seven-stage result.
          </p>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-700 bg-slate-950/80 shadow-xl">
        <div className="border-b border-slate-800 bg-slate-900/70 px-5 py-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-white">Why the seven-stage workflow?</h3>
        </div>
        <div className="grid md:grid-cols-2 md:divide-x md:divide-slate-800">
          <div className="space-y-2 p-5">
            <span className="text-[11px] font-bold uppercase text-slate-400">Single-pass browser transcript</span>
            {['One transcript with uncertain recognition quality', 'No explicit source label', 'No staged safety or intervention trace'].map((item) => (
              <p key={item} className="flex gap-2 text-[11px] text-slate-400"><span className="text-rose-400">—</span>{item}</p>
            ))}
          </div>
          <div className="space-y-2 bg-teal-500/5 p-5">
            <span className="text-[11px] font-bold uppercase text-teal-300">NeuroBridge prototype workflow</span>
            {['Reviewed input with LIVE or SYNTHETIC provenance', 'Seven inspectable software-stage decisions', 'Separate fail-closed app-level actuation gate'].map((item) => (
              <p key={item} className="flex gap-2 text-[11px] text-teal-200"><CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />{item}</p>
            ))}
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-purple-500/40 bg-gradient-to-br from-purple-950/30 via-slate-900 to-cyan-950/20 shadow-xl">
        <div className="flex flex-col gap-4 border-b border-purple-500/20 bg-slate-950/40 p-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-amber-400/50 bg-amber-400/10 px-2.5 py-1 text-[10px] font-black tracking-wider text-amber-300">
                SCRIPTED SYNTHETIC DEMO
              </span>
              <h3 className="font-bold text-white">Five-step Magic showcase</h3>
            </div>
            <p className="mt-2 max-w-3xl text-xs leading-relaxed text-slate-300">
              A clearly labelled judge walkthrough using bundled fixture values. Magic Demo is visual only and preserves the current result; Full Demo explicitly replaces it with a synthetic result from the actual seven-stage orchestrator.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => startScriptedDemo('magic')}
              disabled={demoState === 'running' || isRunningAgents || isRecording}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-purple-500/20 transition hover:scale-[1.02] disabled:opacity-50"
            >
              <Sparkles className="h-4 w-4" />
              {demoState === 'running' && demoMode === 'magic' ? `Magic step ${demoStep}/5` : 'Magic Demo · Storyboard only'}
            </button>
            <button
              onClick={() => startScriptedDemo('full')}
              disabled={demoState === 'running' || isRunningAgents || isRecording}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 to-teal-400 px-4 py-2.5 text-xs font-bold text-slate-950 shadow-lg shadow-amber-500/20 transition hover:scale-[1.02] disabled:opacity-50"
            >
              <Play className="h-4 w-4 fill-current" />
              {demoState === 'running' && demoMode === 'full'
                ? (isRunningAgents ? 'Running actual 7 stages…' : `Full Demo step ${demoStep}/5`)
                : 'Full Demo · Scene + 7 stages'}
            </button>
            <button
              onClick={() => void handleRunPreset(
                `SCRIPTED SYNTHETIC DEMO — Quick Agent Run: ${selectedPatient.name} / ${selectedLanguage.name}`
              )}
              disabled={demoState === 'running' || isRunningAgents || isRecording}
              className="flex items-center gap-2 rounded-xl border border-teal-500/40 bg-slate-900 px-4 py-2.5 text-xs font-bold text-teal-300 transition hover:bg-slate-800 disabled:opacity-50"
            >
              <FastForward className="h-4 w-4" />
              {isRunningAgents ? 'Running 7 stages…' : 'Quick Agent Run'}
            </button>
          </div>
        </div>

        <div className="p-5">
          <div className="mb-4 flex items-center justify-between gap-3 text-[11px]">
            <span className="font-bold text-purple-200">SCRIPTED SYNTHETIC DEMO · VISUAL SCENE</span>
            <span className="font-mono text-slate-400">
              {demoState === 'idle' ? 'Ready' : demoState === 'running' ? `Scene ${demoStep}/5` : demoState === 'failed' ? 'Pipeline incomplete' : 'Scene complete'}
            </span>
          </div>
          <div className="grid gap-2 lg:grid-cols-5">
            {scriptedDemoSteps.map((step, index) => {
              const stepNumber = index + 1;
              const isActive = demoState === 'running' && demoStep === stepNumber;
              const isComplete = demoState === 'completed' || (demoState === 'running' && demoStep > stepNumber);
              return (
                <div
                  key={step.title}
                  className={`min-h-36 rounded-xl border p-3 transition-all duration-500 ${
                    isActive
                      ? 'scale-[1.02] border-purple-400 bg-purple-500/15 shadow-lg shadow-purple-500/10'
                      : isComplete
                        ? 'border-emerald-500/30 bg-emerald-500/5'
                        : 'border-slate-800 bg-slate-950/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`flex h-7 w-7 items-center justify-center rounded-full border text-xs font-black ${
                      isActive
                        ? 'border-purple-300 bg-purple-400 text-slate-950'
                        : isComplete
                          ? 'border-emerald-400 bg-emerald-400/20 text-emerald-300'
                          : 'border-slate-700 text-slate-500'
                    }`}>
                      {isComplete ? <CheckCircle2 className="h-4 w-4" /> : stepNumber}
                    </span>
                    {isActive && <Activity className="h-4 w-4 animate-pulse text-purple-300" />}
                  </div>
                  <h4 className="mt-3 text-xs font-bold text-white">{step.title}</h4>
                  <p className="mt-1.5 text-[10px] leading-relaxed text-slate-400">{step.detail}</p>
                </div>
              );
            })}
          </div>

          {provenance?.source === 'live-microphone' && demoState !== 'idle' && demoMode === 'magic' && (
            <div className="mt-4 rounded-lg border border-cyan-500/30 bg-cyan-500/10 p-3 text-xs text-cyan-200">
              LIVE MICROPHONE result preserved. This scripted Magic scene did not populate or overwrite agent evidence.
            </div>
          )}

          {demoMode === 'full' && fullDemoTrace.length > 0 && (
            <div className="mt-5 rounded-xl border border-teal-500/30 bg-slate-950/60 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
                <span className="text-xs font-bold text-teal-300">SCRIPTED SYNTHETIC DEMO · ACTUAL SEVEN-STAGE TRACE</span>
                <span className="font-mono text-[10px] text-slate-400">{fullDemoTrace.length}/7 emitted decisions</span>
              </div>
              <div className="mt-3 grid gap-2 md:grid-cols-2">
                {fullDemoTrace.map((event, index) => (
                  <div key={`full-demo-${event.agentId}-${index}`} className="rounded-lg border border-slate-800 bg-slate-900 p-3 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-white">{index + 1}. {event.agentName}</span>
                      <span className="font-mono text-[9px] text-slate-500">{event.executionTimeMs}ms</span>
                    </div>
                    <p className="mt-1 text-slate-300">{event.decision}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div>
            <h3 className="flex items-center gap-2 text-sm font-bold text-white"><Activity className="h-4 w-4 text-purple-400" /> Seven-stage pipeline architecture</h3>
            <p className="mt-1 text-[10px] text-slate-500">Architecture cards show idle/running/completed state; only emitted trace events count as execution evidence.</p>
          </div>
          <span className="rounded-full border border-slate-700 bg-slate-950 px-2.5 py-1 font-mono text-[10px] text-slate-400">
            {visibleTrace.length}/7 emitted
          </span>
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {architectureStages.map(([agentId, name, description], index) => {
            const completed = completedStageIds.has(agentId);
            const active = isRunningAgents && !completed && index === visibleTrace.length;
            return (
              <div key={agentId} className={`rounded-xl border p-3 transition ${
                completed
                  ? 'border-emerald-500/35 bg-emerald-500/5'
                  : active
                    ? 'border-purple-400 bg-purple-500/10 shadow-lg shadow-purple-500/10'
                    : 'border-slate-800 bg-slate-950/60'
              }`}>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-[10px] text-slate-500">0{index + 1}</span>
                  <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold ${
                    completed ? 'bg-emerald-500/15 text-emerald-300' : active ? 'bg-purple-500/20 text-purple-300' : 'bg-slate-800 text-slate-500'
                  }`}>{completed ? 'COMPLETED' : active ? 'RUNNING' : 'IDLE'}</span>
                </div>
                <h4 className="mt-2 text-[11px] font-bold text-white">{name}</h4>
                <p className="mt-1 text-[10px] leading-relaxed text-slate-400">{description}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl space-y-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-bold text-white">{selectedPatient.name}</h2>
              <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-300">
                Research prototype · not a medical device
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-400">
              Scenario label: {selectedPatient.condition} · Session {selectedPatient.digitalTwin.sessionsCompleted + 1} · {selectedLanguage.flag} {selectedLanguage.name}
            </p>
          </div>
          <button
            onClick={handleTogglePacing}
            disabled={!lastSessionResult || (!isPacingActive && !actuationDecision.permitted)}
            title={actuationDecision.reason}
            className={`flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
              isPacingActive ? 'bg-rose-500 text-white' : 'border border-teal-500/30 bg-slate-800 text-teal-300'
            }`}
          >
            <Zap className="h-4 w-4" />
            {isPacingActive ? 'Stop pacer' : 'Start approved pacer'}
          </button>
        </div>
        <div className={`rounded-lg border px-3 py-2 text-[11px] font-mono ${
          actuationDecision.permitted
            ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
            : 'border-amber-500/30 bg-amber-500/10 text-amber-300'
        }`}>
          App-level actuator gate: {actuationDecision.permitted ? `${actuationDecision.mode} clearance` : actuationDecision.reason}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-teal-400">Target utterance</span>
            <p className="mt-1 text-[11px] text-slate-500">Edit this before capture if you want to test a different phrase.</p>
          </div>
          <button
            onClick={() => {
              const utterance = new SpeechSynthesisUtterance(targetPhrase);
              utterance.lang = selectedLanguage.code;
              utterance.rate = 0.85;
              window.speechSynthesis.speak(utterance);
            }}
            className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-slate-300"
          >
            <Volume2 className="h-3.5 w-3.5 text-cyan-400" /> Hear target
          </button>
        </div>
        <input
          value={targetPhrase}
          onChange={(event) => setTargetPhrase(event.target.value)}
          className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-4 py-3 text-lg font-bold text-white outline-none focus:border-teal-500 sm:text-2xl"
        />
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-[11px] text-slate-500">Target IPA:</span>
          {selectedLanguage.targetPhonemes.map((phoneme, index) => (
            <span key={`${phoneme}-${index}`} className="rounded-md border border-teal-500/30 bg-teal-500/10 px-2 py-0.5 font-mono text-xs font-bold text-teal-300">
              {phoneme} <span className="font-normal text-slate-400">{selectedLanguage.ipaPhonemes[index]}</span>
            </span>
          ))}
          <span className="rounded-md border border-purple-500/30 bg-purple-500/10 px-2 py-0.5 font-mono text-xs text-purple-300">
            Scenario cadence {selectedPatient.digitalTwin.preferredBpm} BPM
          </span>
        </div>
      </section>

      <PhonemeMouthGuide
        targetPhoneme={lastSessionResult?.intervention.targetPhonemeFocus || selectedLanguage.targetPhonemes[0]}
        visualCueType={lastSessionResult?.intervention.visualCueType || 'mouth_shape'}
        bpm={lastSessionResult?.intervention.bpm || selectedPatient.digitalTwin.preferredBpm}
        currentBeat={currentBeat}
        isPacingActive={isPacingActive}
      />

      <section className="rounded-2xl border border-pink-500/30 bg-gradient-to-br from-slate-900 via-pink-950/10 to-slate-900 p-5 shadow-xl">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Eye className="h-4 w-4 text-pink-400" />
              <h3 className="text-sm font-bold text-white">Vision, PulseSight & FingerSpeak Studio</h3>
              <span className="rounded-full border border-pink-500/30 bg-pink-500/10 px-2 py-0.5 text-[9px] font-bold text-pink-300">INDEPENDENT MODULE</span>
            </div>
            <p className="mt-1 max-w-3xl text-[11px] leading-relaxed text-slate-400">
              Restored MediaPipe kinematics, experimental rPPG, and gesture AAC tools. Camera-derived values stay in this module and are not silently fused into microphone-agent results.
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5 text-[9px] text-slate-400">
              {['468-point face mesh', 'PulseSight rPPG', 'FingerSpeak AAC', 'Lip/jaw visualization'].map((feature) => (
                <span key={feature} className="rounded-md border border-slate-700 bg-slate-950 px-2 py-0.5">{feature}</span>
              ))}
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[9px]">
              <span className="font-bold uppercase tracking-wider text-purple-300">FingerSpeak accessibility gestures:</span>
              {['Yes', 'No', 'Repeat', 'Need help'].map((gesture) => (
                <span key={gesture} className="rounded-md border border-purple-500/25 bg-purple-500/10 px-2 py-0.5 text-purple-200">{gesture}</span>
              ))}
              <span className="text-slate-500">Open its tab for live camera classification.</span>
            </div>
          </div>
          <button
            onClick={() => setShowMultimodalStudio((open) => !open)}
            className="shrink-0 rounded-xl border border-pink-500/40 bg-pink-500/10 px-4 py-2 text-xs font-bold text-pink-300 transition hover:bg-pink-500/20"
          >
            {showMultimodalStudio ? 'Close inline studio' : 'Open inline studio'}
          </button>
        </div>
        {showMultimodalStudio && (
          <div className="mt-5 border-t border-slate-800 pt-5">
            <Suspense fallback={<div className="rounded-xl border border-slate-800 bg-slate-950 p-8 text-center text-xs text-slate-400">Loading vision and AAC modules…</div>}>
              <VisionKinematicsTracker />
            </Suspense>
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-bold text-white">Speech input</h3>
            <p className="text-[11px] text-slate-500">Nothing runs automatically. Choose live capture or an explicitly labelled fixture.</p>
          </div>
          <div className="flex rounded-lg border border-slate-800 bg-slate-950 p-0.5">
            <button
              onClick={() => setInputMode('mic')}
              disabled={isRecording || demoState === 'running' || isRunningAgents}
              className={`rounded-md px-3 py-1 text-xs ${inputMode === 'mic' ? 'bg-teal-500 font-semibold text-slate-950' : 'text-slate-400'}`}
            >
              Live microphone
            </button>
            <button
              onClick={() => setInputMode('preset')}
              disabled={isRecording || demoState === 'running' || isRunningAgents}
              className={`rounded-md px-3 py-1 text-xs ${inputMode === 'preset' ? 'bg-amber-400 font-semibold text-slate-950' : 'text-slate-400'}`}
            >
              Synthetic fixture
            </button>
          </div>
        </div>

        <AudioWaveformVisualizer
          isRecording={isRecording}
          rmsDb={rmsDb}
          frequencyData={frequencyData}
          pauses={pendingCapture?.pauses ?? []}
        />

        {inputMode === 'mic' ? (
          <div className="space-y-4">
            <button
              onClick={handleToggleRecording}
              disabled={isRunningAgents || demoState === 'running'}
              className={`flex items-center gap-2.5 rounded-xl px-6 py-3 text-sm font-bold shadow-lg transition disabled:opacity-50 ${
                isRecording ? 'bg-red-500 text-white' : 'bg-gradient-to-r from-teal-500 to-cyan-500 text-slate-950'
              }`}
            >
              {isRecording ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
              {isRecording ? 'Stop and review transcript' : 'Record live speech'}
            </button>

            {pendingCapture && (
              <div className="space-y-3 rounded-xl border border-cyan-500/30 bg-cyan-500/5 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="text-xs font-bold text-cyan-300">Review the exact agent input</span>
                    <p className="text-[10px] text-slate-400">Captured {pendingCapture.durationSec}s · {pendingCapture.pitchSamples.length} pitch samples · {pendingCapture.pauses.length} observed pauses</p>
                  </div>
                  <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 text-[10px] text-cyan-300">
                    {pendingCapture.transcriptSource === 'unavailable'
                      ? 'No browser transcript'
                      : pendingCapture.transcriptSource === 'gemini-audio-transcription'
                        ? 'Gemini candidate · review required'
                        : 'Browser transcript'}
                  </span>
                </div>

                {audioPlaybackUrl ? (
                  <div className="space-y-3 rounded-lg border border-slate-700 bg-slate-950/70 p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <span className="text-[11px] font-bold text-white">Replay the actual captured speech</span>
                        <p className="mt-0.5 text-[10px] text-slate-500">Kept in browser memory. It is not uploaded unless you explicitly request cloud transcription below.</p>
                      </div>
                      <span className="font-mono text-[9px] text-slate-500">{pendingCapture.audioMimeType ?? 'browser audio'}</span>
                    </div>
                    <audio controls preload="metadata" src={audioPlaybackUrl} className="h-9 w-full" />
                  </div>
                ) : (
                  <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 text-[10px] text-amber-200">
                    {pendingCapture.audioCaptureWarning ?? 'This browser captured acoustic features but did not provide an encoded recording for replay or AI transcription.'}
                  </div>
                )}

                {pendingCapture.audioBlob && (
                  <div className="space-y-3 rounded-lg border border-purple-500/30 bg-purple-500/5 p-3">
                    <div className="flex items-start gap-2">
                      <Cloud className="mt-0.5 h-4 w-4 shrink-0 text-purple-300" />
                      <div>
                        <span className="text-[11px] font-bold text-purple-200">Optional recovery-speech transcription retry</span>
                        <p className="mt-1 text-[10px] leading-relaxed text-slate-400">
                          Gemini can produce a second candidate from the recording when generic browser recognition fails. This is not guaranteed to understand dysarthric, aphasic, weak, or accented speech and never runs automatically.
                        </p>
                      </div>
                    </div>
                    <label className="flex items-start gap-2 text-[10px] text-slate-300">
                      <input
                        type="checkbox"
                        checked={cloudTranscriptionConsent}
                        onChange={(event) => setCloudTranscriptionConsent(event.target.checked)}
                        className="mt-0.5 accent-purple-500"
                      />
                      <span>I confirm patient/clinician consent to send this one recording to Google Gemini for transcription.</span>
                    </label>
                    <button
                      onClick={() => void handleCloudTranscription()}
                      disabled={isCloudTranscribing || (geminiService.hasApiKey() && !cloudTranscriptionConsent)}
                      className="flex items-center gap-2 rounded-lg border border-purple-500/40 bg-purple-500/15 px-4 py-2 text-xs font-bold text-purple-200 transition hover:bg-purple-500/25 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Cloud className={`h-4 w-4 ${isCloudTranscribing ? 'animate-pulse' : ''}`} />
                      {isCloudTranscribing
                        ? 'Transcribing actual recording…'
                        : geminiService.hasApiKey()
                          ? 'Request Gemini candidate transcript'
                          : 'Configure Gemini transcription key'}
                    </button>
                    {cloudTranscriptionStatus && (
                      <p className="rounded-md border border-slate-700 bg-slate-950/70 px-3 py-2 text-[10px] leading-relaxed text-slate-300">
                        {cloudTranscriptionStatus}
                      </p>
                    )}
                  </div>
                )}

                <textarea
                  value={transcriptDraft}
                  onChange={(event) => setTranscriptDraft(event.target.value)}
                  placeholder="Browser recognition returned no text. Type exactly what you said."
                  rows={3}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 p-3 text-sm text-white outline-none focus:border-cyan-500"
                />
                <button
                  onClick={handleRunReviewedCapture}
                  disabled={isRunningAgents || isCloudTranscribing || !transcriptDraft.trim()}
                  className="flex items-center gap-2 rounded-lg bg-cyan-500 px-4 py-2 text-xs font-bold text-slate-950 disabled:opacity-50"
                >
                  <Play className="h-4 w-4" /> Run seven stages on reviewed text
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-amber-100">
              <strong>SCRIPTED SYNTHETIC DEMO:</strong> this uses bundled scenario values and the scripted transcript shown in the selected language fixture. It is for reproducible demonstration and regression testing, not a microphone measurement.
            </div>
            <button
              onClick={() => void handleRunPreset()}
              disabled={isRunningAgents || isRecording || demoState === 'running'}
              className="flex items-center gap-2.5 rounded-xl bg-amber-400 px-6 py-3 text-sm font-bold text-slate-950 disabled:opacity-50"
            >
              <Play className="h-5 w-5" /> {isRunningAgents ? 'Running fixture…' : 'Run synthetic fixture'}
            </button>
          </div>
        )}

        {captureError && (
          <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> {captureError}
          </div>
        )}

        {isRunningAgents && (
          <div className="space-y-3 rounded-xl border border-teal-500/40 bg-slate-950/90 p-4">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-2 font-bold text-teal-300"><Sparkles className="h-3.5 w-3.5 animate-spin" /> Seven-stage pipeline executing</span>
              <span className="font-mono text-slate-400">{currentStepIndex}/7</span>
            </div>
            <div className="h-1 overflow-hidden rounded-full bg-slate-800">
              <div className="h-1 rounded-full bg-teal-400 transition-all" style={{ width: `${(currentStepIndex / 7) * 100}%` }} />
            </div>
            <div className="space-y-1.5">
              {streamingTrace.map((event, index) => (
                <div key={`${event.agentId}-${index}`} className="rounded-lg border border-slate-800 bg-slate-900/60 p-2 text-xs">
                  <span className="font-bold text-white">{index + 1}. {event.agentName}</span>
                  <p className="mt-0.5 text-slate-300">{event.decision}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {lastSessionResult && provenance && (
        <section className="space-y-5 rounded-2xl border border-teal-500/40 bg-gradient-to-br from-slate-900 via-[#0a1426] to-slate-900 p-6 shadow-2xl">
          <div className="flex flex-col gap-3 border-b border-slate-800 pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-teal-400">Trial execution complete · Pipeline result</span>
                <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${
                  provenance.source === 'live-microphone'
                    ? 'border-cyan-500/40 bg-cyan-500/10 text-cyan-300'
                    : 'border-amber-500/40 bg-amber-500/10 text-amber-300'
                }`}>
                  {provenance.source === 'live-microphone' ? 'LIVE MICROPHONE' : 'SCRIPTED SYNTHETIC DEMO · SYNTHETIC FIXTURE'}
                </span>
                <span className="rounded-full border border-slate-700 bg-slate-800 px-2 py-0.5 text-[10px] text-slate-300">
                  {provenance.transcriptSource.replace(/-/g, ' ')}
                </span>
              </div>
              <p className="mt-1 text-[11px] text-slate-400">{provenance.label}</p>
              <p className="mt-1 text-sm font-semibold text-white">Prototype phenotype: {lastSessionResult.phenotype.primaryDeficit}</p>
            </div>
            <button onClick={onNavigateToTrace} className="flex items-center gap-1.5 rounded-lg border border-teal-500/40 bg-teal-500/20 px-3 py-1.5 text-xs font-semibold text-teal-300">
              Inspect full trace <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
              <span className="text-[10px] font-bold uppercase text-slate-500">Target text</span>
              <p className="mt-1 text-sm text-white">{lastSessionResult.targetPhrase}</p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
              <span className="text-[10px] font-bold uppercase text-slate-500">Reviewed transcript supplied to agents</span>
              <p className="mt-1 text-sm text-white">{lastSessionResult.spokenTranscript}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[
              ['Speaking-rate proxy', `${lastSessionResult.biomarkers.speakingRateWpm} WPM`],
              ['Observed mean pause', `${lastSessionResult.biomarkers.meanPauseDurationSec}s`],
              ['Rhythm proxy', `${Math.round(lastSessionResult.biomarkers.rhythmStabilityIndex * 100)}%`],
              ['Speech-motor proxy', `${Math.round(lastSessionResult.phenotype.motorPlanningScore * 100)}%`]
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                <span className="block text-[10px] text-slate-400">{label}</span>
                <strong className="mt-1 block text-xl text-teal-300">{value}</strong>
              </div>
            ))}
          </div>

          <div className="grid gap-3 lg:grid-cols-3">
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 text-xs lg:col-span-2">
              <span className="font-bold uppercase text-slate-300">Configured text substitutions</span>
              {configuredErrors.length ? (
                <ul className="mt-2 space-y-1 text-slate-300">
                  {configuredErrors.map((error, index) => (
                    <li key={`${error.word}-${index}`}>• {error.word}: {error.targetPhoneme} → {error.substitutedPhoneme} ({Math.round(error.confidence * 100)}% heuristic score)</li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-emerald-300">No configured substitution pattern was found in the reviewed transcript.</p>
              )}
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 text-xs">
              <span className="font-bold uppercase text-slate-300">Suggested intervention</span>
              <p className="mt-2 text-cyan-300">{lastSessionResult.intervention.bpm} BPM · {lastSessionResult.intervention.hapticIntensityPercent}% · {lastSessionResult.intervention.modality.replace(/_/g, ' ')}</p>
              <p className="mt-2 text-slate-400">No post-intervention retry was captured in this run, so no improvement claim is calculated.</p>
            </div>
          </div>

          <div className="rounded-2xl border border-teal-500/30 bg-gradient-to-r from-slate-950 via-teal-950/10 to-slate-950 p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-teal-300"><Sparkles className="h-4 w-4" /> Closed-loop intervention storyboard</span>
              <span className="rounded-full border border-slate-700 bg-slate-900 px-2 py-0.5 text-[9px] font-bold text-slate-400">NO POST-RETRY OUTCOME CLAIM</span>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <div className="rounded-xl border border-rose-500/25 bg-rose-500/5 p-3 text-xs">
                <span className="text-[10px] font-bold uppercase text-rose-300">1. Bound input</span>
                <p className="mt-2 font-mono text-[11px] text-slate-200">“{lastSessionResult.spokenTranscript}”</p>
                <p className="mt-2 text-[10px] text-slate-500">Source: {provenance.transcriptSource.replace(/-/g, ' ')}</p>
              </div>
              <div className="rounded-xl border border-cyan-500/25 bg-cyan-500/5 p-3 text-xs">
                <span className="text-[10px] font-bold uppercase text-cyan-300">2. Proposed cue</span>
                <p className="mt-2 font-semibold text-cyan-200">{lastSessionResult.intervention.bpm} BPM · {lastSessionResult.intervention.hapticPattern}</p>
                <p className="mt-2 text-[10px] text-slate-400">The proposal remains behind the app-level safety and approval gate.</p>
              </div>
              <div className="rounded-xl border border-amber-500/25 bg-amber-500/5 p-3 text-xs">
                <span className="text-[10px] font-bold uppercase text-amber-300">3. Retry required</span>
                <p className="mt-2 text-slate-300">Capture a separate coached retry to calculate any before/after change.</p>
                <p className="mt-2 text-[10px] text-slate-500">This run contains no measured treatment delta.</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
              <span className="flex items-center gap-2 text-xs font-bold uppercase text-white"><Activity className="h-4 w-4 text-purple-400" /> Actual trace events from this run</span>
              <span className="font-mono text-[10px] text-slate-400">{lastSessionResult.traceEvents.length}/7 terminal events</span>
            </div>
            <div className="mt-3 grid gap-2 md:grid-cols-2">
              {lastSessionResult.traceEvents.map((event, index) => (
                <div key={`${event.agentId}-${index}`} className="rounded-lg border border-slate-800 bg-slate-900 p-3 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-1.5 font-bold text-white"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> {index + 1}. {event.agentName}</span>
                    <span className="font-mono text-[9px] text-slate-500">{event.executionTimeMs}ms</span>
                  </div>
                  <p className="mt-1.5 text-slate-300">{event.decision}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-purple-500/30 bg-slate-950/70">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 px-4 py-3">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-purple-300">Actual agent decision chain · Live reasoning trace</span>
                <p className="mt-1 text-[10px] text-slate-500">Every row is rendered from the emitted trace for this labelled run; no camera evidence is inserted into microphone-agent decisions.</p>
              </div>
              <span className="rounded-full border border-purple-500/30 bg-purple-500/10 px-2 py-0.5 font-mono text-[9px] text-purple-200">{lastSessionResult.traceEvents.length} emitted rows</span>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-[920px] w-full table-fixed text-left text-[10px]">
                <thead className="bg-slate-900 text-slate-400">
                  <tr>
                    <th className="w-[18%] px-3 py-2 font-bold uppercase">Agent</th>
                    <th className="w-[27%] px-3 py-2 font-bold uppercase">Input received / observation</th>
                    <th className="w-[28%] px-3 py-2 font-bold uppercase">Decision made</th>
                    <th className="w-[27%] px-3 py-2 font-bold uppercase">Structured output / action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {lastSessionResult.traceEvents.map((event, index) => (
                    <tr key={`decision-chain-${event.agentId}-${index}`} className="align-top text-slate-300">
                      <td className="px-3 py-3">
                        <span className="font-bold text-white">{index + 1}. {event.agentName}</span>
                        <span className="mt-1 block text-[9px] text-slate-500">{event.role} · {event.executionTimeMs}ms</span>
                      </td>
                      <td className="px-3 py-3 leading-relaxed">{event.observation}</td>
                      <td className="px-3 py-3 leading-relaxed text-teal-100">{event.decision}</td>
                      <td className="break-words px-3 py-3 font-mono leading-relaxed text-purple-200">{summarizeTraceOutput(event.outputData)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className={`flex items-start gap-2 rounded-xl border p-3 text-xs ${
            lastSessionResult.safety.actuationPermitted
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
              : 'border-rose-500/30 bg-rose-500/10 text-rose-200'
          }`}>
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{lastSessionResult.safety.sanitizedClinicalRationale} Physical output is still controlled by the separate app-level approval gate.</span>
          </div>
        </section>
      )}
    </div>
  );
};
