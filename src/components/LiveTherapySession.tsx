import React, { useEffect, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Mic,
  MicOff,
  Play,
  ShieldCheck,
  Sparkles,
  Volume2,
  Zap
} from 'lucide-react';
import { PatientPresetCase } from '../services/MockPatientCases';
import { AudioWaveformVisualizer } from './AudioWaveformVisualizer';
import { PhonemeMouthGuide } from './PhonemeMouthGuide';
import { AgentTraceEvent, SessionInputProvenance, SessionRunResult } from '../agents/types';
import { AudioAnalysisResult, AudioAnalyzer } from '../services/AudioAnalyzer';
import { HapticPacket } from '../services/HapticController';
import { ActuationGateDecision } from '../services/ActuationSafetyGate';
import { AgentOrchestrator } from '../agents/AgentOrchestrator';
import { GlobalLanguageConfig } from '../services/GlobalLanguageService';

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
  currentBeat
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

  useEffect(() => {
    setTargetPhrase(selectedLanguage.defaultPhrase);
    setPendingCapture(null);
    setTranscriptDraft('');
    setCaptureError(null);
  }, [selectedLanguage, selectedPatient]);

  const runPipeline = async (
    audio: AudioAnalysisResult,
    transcript: string,
    provenance: SessionInputProvenance
  ) => {
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
    } catch (error) {
      setCaptureError(`Pipeline failed: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsRunningAgents(false);
    }
  };

  const handleToggleRecording = async () => {
    if (!isRecording) {
      onTrialStarted();
      setPendingCapture(null);
      setTranscriptDraft('');
      setCaptureError(null);
      const started = await audioAnalyzer.startRecording((data, db) => {
        setFrequencyData(new Uint8Array(data));
        setRmsDb(db);
      }, selectedLanguage.code);

      if (!started) {
        setCaptureError('Microphone access did not start. Check browser permission and try again. No synthetic audio was substituted.');
        return;
      }
      setIsRecording(true);
      return;
    }

    setIsRecording(false);
    const capture = await audioAnalyzer.stopRecording();
    setPendingCapture(capture);
    setTranscriptDraft(capture.transcript);
    if (!capture.transcript) {
      setCaptureError('Audio was captured, but browser speech recognition returned no text. Type what you said below before running the agents.');
    } else if (capture.recognitionWarning) {
      setCaptureError(capture.recognitionWarning);
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
    await runPipeline(pendingCapture, reviewedTranscript, {
      source: 'live-microphone',
      transcriptSource: wasCorrected || pendingCapture.transcriptSource === 'unavailable'
        ? 'user-corrected'
        : 'browser-speech-recognition',
      label: wasCorrected
        ? 'Live microphone audio with user-reviewed transcript correction'
        : 'Live microphone audio with browser speech-recognition transcript',
      capturedAt: new Date().toISOString(),
      recognitionWarning: pendingCapture.recognitionWarning
    });
  };

  const handleRunPreset = async () => {
    onTrialStarted();
    const preset = audioAnalyzer.simulatePresetCase({
      transcript: selectedLanguage.sampleSpoken,
      durationSec: selectedPatient.audioDurationSec,
      pauses: selectedPatient.detectedPauses,
      pitchSamples: selectedPatient.pitchSamples,
      rmsDb: selectedPatient.rmsEnergyDb
    });
    await runPipeline(preset, preset.transcript, {
      source: 'synthetic-preset',
      transcriptSource: 'synthetic-fixture',
      label: `Bundled deterministic fixture: ${selectedPatient.name} / ${selectedLanguage.name}`,
      capturedAt: new Date().toISOString()
    });
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

      <section className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl space-y-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-bold text-white">{selectedPatient.name}</h2>
              <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-300">
                Research prototype · not a medical device
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-400">Scenario label: {selectedPatient.condition} · {selectedLanguage.flag} {selectedLanguage.name}</p>
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
      </section>

      <PhonemeMouthGuide
        targetPhoneme={lastSessionResult?.intervention.targetPhonemeFocus || selectedLanguage.targetPhonemes[0]}
        visualCueType={lastSessionResult?.intervention.visualCueType || 'mouth_shape'}
        bpm={lastSessionResult?.intervention.bpm || selectedPatient.digitalTwin.preferredBpm}
        currentBeat={currentBeat}
        isPacingActive={isPacingActive}
      />

      <section className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-bold text-white">Speech input</h3>
            <p className="text-[11px] text-slate-500">Nothing runs automatically. Choose live capture or an explicitly labelled fixture.</p>
          </div>
          <div className="flex rounded-lg border border-slate-800 bg-slate-950 p-0.5">
            <button
              onClick={() => setInputMode('mic')}
              className={`rounded-md px-3 py-1 text-xs ${inputMode === 'mic' ? 'bg-teal-500 font-semibold text-slate-950' : 'text-slate-400'}`}
            >
              Live microphone
            </button>
            <button
              onClick={() => setInputMode('preset')}
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
              disabled={isRunningAgents}
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
                    {pendingCapture.transcriptSource === 'unavailable' ? 'No browser transcript' : 'Browser transcript'}
                  </span>
                </div>
                <textarea
                  value={transcriptDraft}
                  onChange={(event) => setTranscriptDraft(event.target.value)}
                  placeholder="Browser recognition returned no text. Type exactly what you said."
                  rows={3}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 p-3 text-sm text-white outline-none focus:border-cyan-500"
                />
                <button
                  onClick={handleRunReviewedCapture}
                  disabled={isRunningAgents || !transcriptDraft.trim()}
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
              This uses bundled scenario values and the scripted transcript shown in the selected language fixture. It is for reproducible demonstration and regression testing, not a microphone measurement.
            </div>
            <button
              onClick={handleRunPreset}
              disabled={isRunningAgents}
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
                <span className="text-xs font-bold uppercase tracking-wider text-teal-400">Pipeline result</span>
                <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${
                  provenance.source === 'live-microphone'
                    ? 'border-cyan-500/40 bg-cyan-500/10 text-cyan-300'
                    : 'border-amber-500/40 bg-amber-500/10 text-amber-300'
                }`}>
                  {provenance.source === 'live-microphone' ? 'LIVE MICROPHONE' : 'SYNTHETIC FIXTURE'}
                </span>
                <span className="rounded-full border border-slate-700 bg-slate-800 px-2 py-0.5 text-[10px] text-slate-300">
                  {provenance.transcriptSource.replace(/-/g, ' ')}
                </span>
              </div>
              <p className="mt-1 text-[11px] text-slate-400">{provenance.label}</p>
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
