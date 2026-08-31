import React, { lazy, Suspense, useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Header } from './components/Header';
import { LiveTherapySession } from './components/LiveTherapySession';
import { SiriVoiceAgentOrb } from './components/SiriVoiceAgentOrb';
import { ApiKeyModal } from './components/ApiKeyModal';
import { GlobalPitchModal } from './components/GlobalPitchModal';
import { JudgeGuidedTour } from './components/JudgeGuidedTour';
import { PATIENT_CASES, PatientPresetCase } from './services/MockPatientCases';
import { GLOBAL_LANGUAGES, GlobalLanguageConfig } from './services/GlobalLanguageService';
import { AudioAnalyzer } from './services/AudioAnalyzer';
import { HapticController, HapticPacket } from './services/HapticController';
import { ActuationGateDecision } from './services/ActuationSafetyGate';
import { AgentOrchestrator } from './agents/AgentOrchestrator';
import { SessionRunResult, PatientDigitalTwin, ClinicianApproval } from './agents/types';

const AgentTraceViewer = lazy(() => import('./components/AgentTraceViewer').then(module => ({ default: module.AgentTraceViewer })));
const DigitalTwinDashboard = lazy(() => import('./components/DigitalTwinDashboard').then(module => ({ default: module.DigitalTwinDashboard })));
const ExperimentStudio = lazy(() => import('./components/ExperimentStudio').then(module => ({ default: module.ExperimentStudio })));
const TherapistPortal = lazy(() => import('./components/TherapistPortal').then(module => ({ default: module.TherapistPortal })));
const Micro1EvaluationSuite = lazy(() => import('./components/Micro1EvaluationSuite').then(module => ({ default: module.Micro1EvaluationSuite })));
const ClinicalDefenseStudio = lazy(() => import('./components/ClinicalDefenseStudio').then(module => ({ default: module.ClinicalDefenseStudio })));
const PulseSightVitalsAndAacStudio = lazy(() => import('./components/PulseSightVitalsAndAacStudio').then(module => ({ default: module.PulseSightVitalsAndAacStudio })));
const ESP32WearableSimulator = lazy(() => import('./components/ESP32WearableSimulator').then(module => ({ default: module.ESP32WearableSimulator })));

export function App() {
  const [activeTab, setActiveTab] = useState<string>('session');
  const [selectedPatient, setSelectedPatient] = useState<PatientPresetCase>(PATIENT_CASES[0]);
  const [selectedLanguage, setSelectedLanguage] = useState<GlobalLanguageConfig>(GLOBAL_LANGUAGES[0]);
  const [isBleConnected, setIsBleConnected] = useState(false);
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [isPitchModalOpen, setIsPitchModalOpen] = useState(false);
  const [isTourOpen, setIsTourOpen] = useState(false);
  const [isPacingActive, setIsPacingActive] = useState(false);
  const [currentBeat, setCurrentBeat] = useState(0);

  // Singletons
  const audioAnalyzer = useMemo(() => new AudioAnalyzer(), []);
  const hapticController = useMemo(() => new HapticController(), []);
  const agentOrchestrator = useMemo(() => new AgentOrchestrator(), []);

  const [sessionResult, setSessionResult] = useState<SessionRunResult | null>(null);
  const [clinicianApproval, setClinicianApproval] = useState<ClinicianApproval | null>(null);
  const [actuationDecision, setActuationDecision] = useState<ActuationGateDecision>(() =>
    hapticController.getActuationDecision()
  );
  const sessionSequence = useRef(0);

  // Synchronize Haptic Pulses to UI Beat state
  useEffect(() => {
    const pulseHandler = (beatIndex: number) => {
      setCurrentBeat(beatIndex);
    };
    const gateHandler = (decision: ActuationGateDecision) => {
      setActuationDecision(decision);
      if (!decision.permitted) setIsPacingActive(false);
    };
    hapticController.addPulseListener(pulseHandler);
    hapticController.addGateDecisionListener(gateHandler);
    return () => {
      hapticController.removePulseListener(pulseHandler);
      hapticController.removeGateDecisionListener(gateHandler);
      hapticController.stopPacing();
    };
  }, [hapticController]);

  const beginNewTrial = useCallback(() => {
    hapticController.stopPacing();
    hapticController.setClinicianApproval(null);
    hapticController.setSafetyContext(null);
    setClinicianApproval(null);
    setIsPacingActive(false);
    setSessionResult(null);
  }, [hapticController]);

  const commitSessionResult = useCallback((result: SessionRunResult) => {
    hapticController.stopPacing();
    hapticController.setClinicianApproval(null);
    setClinicianApproval(null);
    setIsPacingActive(false);

    sessionSequence.current += 1;
    const sessionId = `${selectedPatient.digitalTwin.patientId}-session-${Date.now()}-${sessionSequence.current}`;
    const boundResult: SessionRunResult = { ...result, sessionId };
    hapticController.setSafetyContext({
      sessionId,
      patientId: selectedPatient.digitalTwin.patientId,
      safety: boundResult.safety
    });
    setSessionResult(boundResult);
  }, [hapticController, selectedPatient.digitalTwin.patientId]);

  // A context change clears the prior result. Presets run only after an explicit action.
  useEffect(() => {
    beginNewTrial();
    setSessionResult(null);
  }, [
    selectedPatient,
    selectedLanguage,
    beginNewTrial
  ]);

  const handleConnectBle = async () => {
    const res = await hapticController.connectBleDevice();
    if (res.success) {
      setIsBleConnected(true);
    } else {
      console.info('BLE Notice:', res.error);
    }
  };

  const handleTriggerLiveDemoTrial = async () => {
    setActiveTab('session');
    beginNewTrial();
    const presetAudio = audioAnalyzer.simulatePresetCase({
      transcript: selectedLanguage.sampleSpoken,
      durationSec: selectedPatient.audioDurationSec,
      pauses: selectedPatient.detectedPauses,
      pitchSamples: selectedPatient.pitchSamples,
      rmsDb: selectedPatient.rmsEnergyDb
    });

    const result = await agentOrchestrator.executeSessionCycle(
      selectedLanguage.defaultPhrase,
      presetAudio.transcript,
      presetAudio.durationSec,
      presetAudio.pauses,
      presetAudio.pitchSamples,
      presetAudio.rmsDb,
      selectedPatient.digitalTwin,
      undefined,
      {
        source: 'synthetic-preset',
        transcriptSource: 'synthetic-fixture',
        label: `Guided demo fixture: ${selectedPatient.name} / ${selectedLanguage.name}`,
        capturedAt: new Date().toISOString()
      }
    );

    commitSessionResult(result);
  };

  const handleRequestPacing = (packet: HapticPacket): ActuationGateDecision => {
    const decision = hapticController.startPacing(packet);
    setActuationDecision(decision);
    setIsPacingActive(decision.permitted && hapticController.isPacing());
    return decision;
  };

  const handleTriggerPacing = () => {
    if (isPacingActive) return;
    const intervention = sessionResult?.intervention;
    handleRequestPacing({
      bpm: intervention?.bpm ?? selectedPatient.digitalTwin.preferredBpm,
      pattern: intervention?.hapticPattern ?? '1-2-3-4',
      intensity: intervention?.hapticIntensityPercent ?? 65,
      durationMs: intervention?.pulseDurationMs ?? 120,
      active: true
    });
  };

  const handleStopPacing = () => {
    hapticController.stopPacing();
    setIsPacingActive(false);
  };

  const handleRequestPulse = (packet: HapticPacket): ActuationGateDecision => {
    const decision = hapticController.triggerPulse(
      packet.intensity,
      packet.durationMs,
      55,
      packet.transducerType ?? 'ERM_DISC',
      { bpm: packet.bpm, pattern: packet.pattern }
    );
    setActuationDecision(decision);
    return decision;
  };

  const handleClinicianApprovalChange = (approved: boolean) => {
    if (!approved) {
      hapticController.setClinicianApproval(null);
      setClinicianApproval(null);
      return;
    }

    if (!sessionResult?.sessionId) return;
    const approval: ClinicianApproval = {
      sessionId: sessionResult.sessionId,
      patientId: selectedPatient.digitalTwin.patientId,
      approvedAt: new Date().toISOString(),
      approvedBy: 'Therapist Portal clinician',
      safetyAcknowledged: true
    };
    if (hapticController.setClinicianApproval(approval)) {
      setClinicianApproval(approval);
    }
  };

  const handleUpdateDigitalTwin = (updatedTwin: PatientDigitalTwin) => {
    beginNewTrial();
    setSelectedPatient(prev => ({
      ...prev,
      digitalTwin: updatedTwin
    }));
  };

  return (
    <div className="min-h-screen bg-[#080d1a] text-slate-100 flex flex-col selection:bg-teal-500 selection:text-black">
      {/* Navigation Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        selectedPatient={selectedPatient}
        setSelectedPatient={(patient) => {
          beginNewTrial();
          setSelectedPatient(patient);
        }}
        selectedLanguage={selectedLanguage}
        setSelectedLanguage={(language) => {
          beginNewTrial();
          setSelectedLanguage(language);
        }}
        isBleConnected={isBleConnected}
        onConnectBle={handleConnectBle}
        onOpenApiKeyModal={() => setIsApiKeyModalOpen(true)}
        onOpenPitchModal={() => setIsPitchModalOpen(true)}
        onOpenTour={() => setIsTourOpen(true)}
        isPacingActive={isPacingActive}
      />

      {/* Main Interactive Workspace Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Suspense fallback={(
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-10 text-center text-sm text-slate-400">
            Loading module…
          </div>
        )}>
        {activeTab === 'session' && (
          <LiveTherapySession
            selectedPatient={selectedPatient}
            selectedLanguage={selectedLanguage}
            audioAnalyzer={audioAnalyzer}
            agentOrchestrator={agentOrchestrator}
            lastSessionResult={sessionResult}
            setLastSessionResult={commitSessionResult}
            onTrialStarted={beginNewTrial}
            onNavigateToTrace={() => setActiveTab('trace')}
            isPacingActive={isPacingActive}
            onRequestPacing={handleRequestPacing}
            onStopPacing={handleStopPacing}
            actuationDecision={actuationDecision}
            currentBeat={currentBeat}
          />
        )}

        {activeTab === 'trace' && (
          <AgentTraceViewer
            sessionResult={sessionResult}
            onRunTrial={() => setActiveTab('session')}
          />
        )}

        {activeTab === 'vitals-aac' && (
          <PulseSightVitalsAndAacStudio />
        )}

        {activeTab === 'evaluations' && (
          <Micro1EvaluationSuite />
        )}

        {activeTab === 'defense' && (
          <ClinicalDefenseStudio />
        )}

        {activeTab === 'digital-twin' && (
          <DigitalTwinDashboard
            digitalTwin={selectedPatient.digitalTwin}
            onUpdateDigitalTwin={handleUpdateDigitalTwin}
          />
        )}

        {activeTab === 'experiments' && (
          <ExperimentStudio
            digitalTwin={selectedPatient.digitalTwin}
            lastExperiment={sessionResult?.experiment || null}
            onExperimentComplete={(exp) => {
              if (sessionResult) {
                setSessionResult({ ...sessionResult, experiment: exp });
              }
            }}
          />
        )}

        {activeTab === 'therapist' && (
          <TherapistPortal
            digitalTwin={selectedPatient.digitalTwin}
            sessionResult={sessionResult}
            clinicianApproval={clinicianApproval}
            onApprovalChange={handleClinicianApprovalChange}
            actuationDecision={actuationDecision}
          />
        )}

        {activeTab === 'hardware' && (
          <ESP32WearableSimulator
            hapticController={hapticController}
            isBleConnected={isBleConnected}
            onConnectBle={handleConnectBle}
            isPacingActive={isPacingActive}
            currentBeat={currentBeat}
            onRequestPacing={handleRequestPacing}
            onStopPacing={handleStopPacing}
            onRequestPulse={handleRequestPulse}
            actuationDecision={actuationDecision}
          />
        )}
        </Suspense>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-[#060a15] py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>NeuroBridge SenseAssist &copy; 2026 | Research and hackathon prototype</span>
          <div className="flex items-center space-x-4 text-[11px] text-slate-400">
            <span>FHIR R4-shaped prototype &bull; validation pending</span>
            <span>&bull;</span>
            <span>8 Global Languages (IPA)</span>
            <span>&bull;</span>
            <span>ESP32 BLE prototype</span>
          </div>
        </div>
      </footer>

      {/* Settings Modal */}
      <ApiKeyModal
        isOpen={isApiKeyModalOpen}
        onClose={() => setIsApiKeyModalOpen(false)}
      />

      {/* Global Hackathon Pitch Presentation HUD Modal */}
      <GlobalPitchModal
        isOpen={isPitchModalOpen}
        onClose={() => setIsPitchModalOpen(false)}
      />

      {/* Judge Guided Tour Overlay */}
      <JudgeGuidedTour
        isOpen={isTourOpen}
        onClose={() => setIsTourOpen(false)}
        onSelectTab={(tab) => setActiveTab(tab)}
        onTriggerTrial={handleTriggerLiveDemoTrial}
        onTriggerPacing={handleTriggerPacing}
      />

      {/* Floating Asha Voice Assistant Orb — wired to live session data */}
      <SiriVoiceAgentOrb
        onStartTrial={() => {
          beginNewTrial();
          setActiveTab('session');
        }}
        onAdjustBpm={(bpm) => {
          handleRequestPacing({
            bpm,
            pattern: sessionResult?.intervention.hapticPattern ?? '1-2-3-4',
            intensity: sessionResult?.intervention.hapticIntensityPercent ?? 65,
            durationMs: sessionResult?.intervention.pulseDurationMs ?? 120,
            active: true
          });
        }}
        onTriggerRest={handleStopPacing}
        onCheckVitals={() => setActiveTab('vitals-aac')}
        lastSessionResult={sessionResult}
        currentBpm={sessionResult?.intervention?.bpm ?? selectedPatient?.digitalTwin?.preferredBpm ?? 80}
        currentHrBpm={null}
        currentHrvMs={null}
        stressIndex={null}
      />
    </div>
  );
}

export default App;
