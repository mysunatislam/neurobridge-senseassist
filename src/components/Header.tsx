import React, { useState, useEffect } from 'react';
import { Activity, Cpu, Sparkles, Brain, FlaskConical, FileText, Bluetooth, Key, UserCheck, Radio, Globe, Award, PlayCircle, ShieldAlert, Sun, Moon, Heart } from 'lucide-react';
import { PATIENT_CASES, PatientPresetCase } from '../services/MockPatientCases';
import { geminiService } from '../services/GeminiService';
import { GLOBAL_LANGUAGES, GlobalLanguageConfig } from '../services/GlobalLanguageService';
import { themeService, ThemeMode } from '../services/ThemeService';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  selectedPatient: PatientPresetCase;
  setSelectedPatient: (patient: PatientPresetCase) => void;
  selectedLanguage: GlobalLanguageConfig;
  setSelectedLanguage: (lang: GlobalLanguageConfig) => void;
  isBleConnected: boolean;
  onConnectBle: () => void;
  onOpenApiKeyModal: () => void;
  onOpenPitchModal: () => void;
  onOpenTour: () => void;
  isPacingActive: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  selectedPatient,
  setSelectedPatient,
  selectedLanguage,
  setSelectedLanguage,
  isBleConnected,
  onConnectBle,
  onOpenApiKeyModal,
  onOpenPitchModal,
  onOpenTour,
  isPacingActive
}) => {
  const [patientMenuOpen, setPatientMenuOpen] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [theme, setTheme] = useState<ThemeMode>(themeService.getTheme());
  const hasApiKey = geminiService.hasApiKey();

  useEffect(() => {
    const listener = (newTheme: ThemeMode) => setTheme(newTheme);
    themeService.addListener(listener);
    return () => themeService.removeListener(listener);
  }, []);

  const navItems = [
    { id: 'session', label: 'Live Therapy Room', icon: Activity },
    { id: 'vitals-aac', label: 'PulseSight & AAC', icon: Heart },
    { id: 'trace', label: 'Agent Trace Brain', icon: Cpu },
    { id: 'evaluations', label: 'micro1 Benchmarks', icon: Award },
    { id: 'defense', label: 'Clinical Defense & Stress-Test', icon: ShieldAlert },
    { id: 'digital-twin', label: 'Patient Digital Twin', icon: Brain },
    { id: 'experiments', label: 'A/B Micro-Experiments', icon: FlaskConical },
    { id: 'therapist', label: 'Therapist Portal', icon: FileText },
    { id: 'hardware', label: 'ESP32 Wearable Studio', icon: Radio },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-[#080d1a]/95 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-2 min-h-16 py-2">
          {/* Logo and Brand Title */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('session')}>
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-500 to-cyan-400 p-0.5 shadow-lg shadow-teal-500/20">
              <div className="w-full h-full bg-[#080d1a] rounded-[10px] flex items-center justify-center">
                <Brain className="w-6 h-6 text-teal-400 animate-pulse" />
              </div>
              {isPacingActive && (
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-pink-500"></span>
                </span>
              )}
            </div>
            <div className="hidden min-[380px]:block">
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg tracking-tight text-white">NeuroBridge</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30">
                  SenseAssist
                </span>
              </div>
              <p className="hidden xl:block text-[10px] text-slate-400 font-medium tracking-wide">
                Seven-stage assistive workflow prototype
              </p>
            </div>
          </div>

          {/* Controls Group: Language + Patient Dropdowns */}
          <div className="order-3 sm:order-none w-full sm:w-auto flex items-center justify-center space-x-2">
            {/* Global Language Selector */}
            <div className="relative">
              <button
                onClick={() => setLangMenuOpen(!langMenuOpen)}
                className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-xs text-slate-200 transition-colors shadow-sm"
                title="Select Language & International Phoneme Inventory"
              >
                <span>{selectedLanguage.flag}</span>
                <span className="hidden sm:inline font-medium">{selectedLanguage.nativeName}</span>
              </button>

              {langMenuOpen && (
                <div className="absolute left-0 mt-2 w-56 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95">
                  <div className="text-[10px] font-semibold text-slate-400 px-2 py-1 uppercase tracking-wider">
                    Global Languages (IPA)
                  </div>
                  {GLOBAL_LANGUAGES.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => {
                        setSelectedLanguage(lang);
                        setLangMenuOpen(false);
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors flex items-center space-x-2 ${
                        selectedLanguage.code === lang.code
                          ? 'bg-teal-500/20 text-teal-300 font-semibold'
                          : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <span>{lang.flag}</span>
                      <span>{lang.nativeName} ({lang.name.split(' ')[0]})</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Patient Selector Dropdown */}
            <div className="relative">
              <button
                onClick={() => setPatientMenuOpen(!patientMenuOpen)}
                className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-xs text-slate-200 transition-colors shadow-sm"
              >
                <UserCheck className="w-3.5 h-3.5 text-teal-400" />
                <div className="text-left hidden sm:block">
                  <span className="text-[10px] text-slate-400 block leading-tight">Patient</span>
                  <span className="font-semibold text-slate-100">{selectedPatient.name}</span>
                </div>
              </button>

              {patientMenuOpen && (
                <div className="absolute left-0 mt-2 w-72 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95">
                  <div className="text-[10px] font-semibold text-slate-400 px-2 py-1 uppercase tracking-wider">
                    Select Clinical Profile
                  </div>
                  {PATIENT_CASES.map((patient) => (
                    <button
                      key={patient.id}
                      onClick={() => {
                        setSelectedPatient(patient);
                        setPatientMenuOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors flex flex-col space-y-0.5 ${
                        selectedPatient.id === patient.id
                          ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40'
                          : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <div className="font-semibold flex items-center justify-between">
                        <span>{patient.name}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">{patient.id}</span>
                      </div>
                      <span className="text-[11px] text-slate-400 truncate">{patient.condition}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Navigation Tabs — Organized to eliminate horizontal overflow */}
          <nav className="hidden lg:flex items-center space-x-1 bg-slate-900/80 p-1 rounded-xl border border-slate-800">
            {/* Primary Core Workflow Tabs */}
            {[
              { id: 'session', label: 'Live Therapy Room', icon: Activity },
              { id: 'trace', label: 'Agent Trace Brain', icon: Cpu },
              { id: 'evaluations', label: 'micro1 Benchmarks', icon: Award }
            ].map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-teal-500 text-slate-950 font-semibold shadow-md shadow-teal-500/20'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-slate-950' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}

            {/* Extended Clinical Modules Dropdown */}
            <div className="relative">
              <button
                onClick={() => setPatientMenuOpen(false)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  ['vitals-aac', 'defense', 'digital-twin', 'experiments', 'therapist', 'hardware'].includes(activeTab)
                    ? 'bg-purple-500/20 text-purple-300 font-semibold border border-purple-500/40'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
                onClickCapture={(e) => {
                  const target = document.getElementById('modules-menu');
                  if (target) target.classList.toggle('hidden');
                }}
              >
                <FlaskConical className="w-3.5 h-3.5 text-purple-400" />
                <span>Clinical Modules ▾</span>
              </button>

              <div
                id="modules-menu"
                className="hidden absolute right-0 mt-2 w-60 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl p-2 z-50 animate-in fade-in"
              >
                <div className="text-[10px] font-semibold text-slate-400 px-2 py-1 uppercase tracking-wider">
                  Extended Clinical Modalities
                </div>
                {[
                  { id: 'vitals-aac', label: 'PulseSight & AAC', icon: Heart },
                  { id: 'defense', label: 'Clinical Defense Studio', icon: ShieldAlert },
                  { id: 'digital-twin', label: 'Patient Digital Twin', icon: Brain },
                  { id: 'experiments', label: 'A/B Micro-Experiments', icon: FlaskConical },
                  { id: 'therapist', label: 'Therapist Portal', icon: FileText },
                  { id: 'hardware', label: 'ESP32 Wearable Studio', icon: Radio }
                ].map((m) => {
                  const MIcon = m.icon;
                  return (
                    <button
                      key={m.id}
                      onClick={() => {
                        setActiveTab(m.id);
                        document.getElementById('modules-menu')?.classList.add('hidden');
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors flex items-center space-x-2 ${
                        activeTab === m.id
                          ? 'bg-purple-500/20 text-purple-300 font-semibold'
                          : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <MIcon className="w-3.5 h-3.5 text-slate-400" />
                      <span>{m.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </nav>

          {/* Action Tools: Guided Tour, Pitch Deck, BLE, Gemini */}
          <div className="flex items-center space-x-1.5 sm:space-x-2">
            <button
              onClick={onOpenTour}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 border border-teal-500/40 text-xs font-semibold transition-all"
              title="Launch Interactive Judge Guided Walkthrough"
            >
              <PlayCircle className="w-3.5 h-3.5 text-teal-400 animate-pulse" />
              <span className="hidden sm:inline">Guided Demo</span>
            </button>

            <button
              onClick={onOpenPitchModal}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-teal-400 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 transition-all hover:scale-105"
              title="Open Global Hackathon Judges Pitch HUD"
            >
              <Award className="w-3.5 h-3.5 fill-current" />
              <span className="hidden sm:inline">Pitch Deck</span>
            </button>

            <button
              onClick={onConnectBle}
              className={`hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                isBleConnected
                  ? 'bg-teal-500/20 text-teal-300 border-teal-500/50'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700'
              }`}
              title="Pair with ESP32 Haptic Wearable via Web Bluetooth"
            >
              <Bluetooth className={`w-3.5 h-3.5 ${isBleConnected ? 'text-teal-400 animate-pulse' : 'text-slate-400'}`} />
              <span>{isBleConnected ? 'ESP32 Paired' : 'Pair BLE'}</span>
            </button>

            <button
              onClick={onOpenApiKeyModal}
              className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                hasApiKey
                  ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-400 border-slate-700'
              }`}
              title="Configure Gemini LLM API Key"
            >
              <Key className="w-3.5 h-3.5 text-purple-400" />
            </button>

            {/* Dark / Light Mode Toggle */}
            <button
              onClick={() => {
                const next = themeService.toggleTheme();
                setTheme(next);
              }}
              className="flex items-center justify-center p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 transition-colors shadow-sm"
              title={theme === 'dark' ? 'Switch to Clinical Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400 animate-spin-slow" />
              ) : (
                <Moon className="w-4 h-4 text-cyan-500" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Strip */}
        <div className="flex lg:hidden items-center space-x-1.5 overflow-x-auto py-2 border-t border-slate-800/80 text-xs" aria-label="Mobile workspace navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg shrink-0 font-medium ${
                  isActive
                    ? 'bg-teal-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-white bg-slate-900/60'
                }`}
              >
                <Icon className="w-3 h-3" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Persistent Research Prototype Regulatory Disclaimer Banner */}
      <div className="bg-slate-950/90 border-t border-slate-800/80 px-4 py-1 text-center text-[10px] text-slate-400 font-mono flex items-center justify-center space-x-2">
        <span className="text-amber-400 font-bold">RESEARCH PROTOTYPE:</span>
        <span>Built with frozen synthetic fixtures. Not for diagnosis or medical treatment. Clinician supervision required.</span>
      </div>
    </header>
  );
};
