import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, Sparkles, X, Activity, Heart, ShieldCheck, Brain, Zap } from 'lucide-react';
import { voiceAssistantService, VoiceAgentState, VoiceMessage } from '../services/VoiceAssistantService';

interface SiriVoiceAgentOrbProps {
  onStartTrial?: () => void;
  onAdjustBpm?: (bpm: number) => void;
  onCheckVitals?: () => void;
  onTriggerRest?: () => void;
  // Live clinical context wired from App.tsx
  lastSessionResult?: any;
  currentHrBpm?: number | null;
  currentHrvMs?: number | null;
  currentBpm?: number;
  stressIndex?: number | null;
}

export const SiriVoiceAgentOrb: React.FC<SiriVoiceAgentOrbProps> = ({
  onStartTrial,
  onAdjustBpm,
  onCheckVitals,
  onTriggerRest,
  lastSessionResult,
  currentHrBpm,
  currentHrvMs,
  currentBpm,
  stressIndex
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [state, setState] = useState<VoiceAgentState>('IDLE');
  const [messages, setMessages] = useState<VoiceMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: "Hi, I'm Asha, your Autonomous Hands-Free Speech Co-Pilot. I coordinate with our 7 clinical agents to guide your trials, analyze pronunciation, and pace rhythm.",
      timestamp: new Date().toLocaleTimeString(),
      agenticTag: 'Clinical Voice Co-Pilot'
    }
  ]);
  const [inputText, setInputText] = useState('');
  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  // Inject live clinical context into Asha whenever any prop changes
  useEffect(() => {
    voiceAssistantService.injectContext({
      lastSessionResult: lastSessionResult ?? null,
      currentHrBpm: currentHrBpm ?? null,
      currentHrvMs: currentHrvMs ?? null,
      currentBpm: currentBpm ?? 80,
      stressIndex: stressIndex ?? null,
    });
  }, [lastSessionResult, currentHrBpm, currentHrvMs, currentBpm, stressIndex]);

  useEffect(() => {
    voiceAssistantService.setCallbacks(
      (newState) => setState(newState),
      (newMsg) => {
        setMessages((prev) => [...prev, newMsg]);
        setTimeout(() => chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      },
      (cmd, params) => {
        if (cmd === 'START_TRIAL' && onStartTrial) onStartTrial();
        if (cmd === 'ADJUST_BPM' && onAdjustBpm) onAdjustBpm(params || 72);
        if (cmd === 'CHECK_VITALS' && onCheckVitals) onCheckVitals();
        if (cmd === 'TRIGGER_REST' && onTriggerRest) onTriggerRest();
      }
    );
  }, [onStartTrial, onAdjustBpm, onCheckVitals, onTriggerRest]);

  const handleToggleMic = () => {
    if (state === 'LISTENING') {
      voiceAssistantService.stopListening();
    } else {
      voiceAssistantService.startListening();
    }
  };

  const handleSendText = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    const text = inputText;
    setInputText('');
    voiceAssistantService.handleUserInput(text);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Expanded Clinical Voice Chat Drawer */}
      {isOpen && (
        <div className="w-80 sm:w-96 rounded-2xl bg-slate-900/95 border border-purple-500/40 shadow-2xl backdrop-blur-md mb-4 p-4 space-y-3 animate-in slide-in-from-bottom-5">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-purple-500 to-teal-400 p-0.5 shadow-md">
                <div className="w-full h-full bg-slate-950 rounded-full flex items-center justify-center">
                  <Brain className="w-3.5 h-3.5 text-purple-400" />
                </div>
              </div>
              <div>
                <h4 className="text-xs font-bold text-white flex items-center space-x-1">
                  <span>Asha Clinical Voice Co-Pilot</span>
                  <span className="text-[8px] px-1.5 py-0.2 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30 font-mono">
                    7-Agent Interface
                  </span>
                </h4>
                <span className="text-[10px] text-slate-400">
                  {state === 'LISTENING' ? 'Listening for speech...' : state === 'SPEAKING' ? 'Vocalizing clinical feedback...' : state === 'THINKING' ? 'Consulting agentic trajectory...' : 'Hands-Free Stroke & Speech Co-Pilot'}
                </span>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Voice Command Chips */}
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 text-[10px] font-medium text-slate-300">
            <button
              onClick={() => voiceAssistantService.handleUserInput('Start speech motor trial')}
              className="px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700 border border-slate-700 whitespace-nowrap flex items-center space-x-1"
            >
              <Zap className="w-3 h-3 text-amber-400" />
              <span>Start Trial</span>
            </button>
            <button
              onClick={() => voiceAssistantService.handleUserInput('Analyze my pronunciation and vowel space')}
              className="px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700 border border-slate-700 whitespace-nowrap flex items-center space-x-1"
            >
              <Activity className="w-3 h-3 text-teal-400" />
              <span>Pronunciation Score</span>
            </button>
            <button
              onClick={() => voiceAssistantService.handleUserInput('Why did you slow down the metronome?')}
              className="px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700 border border-slate-700 whitespace-nowrap flex items-center space-x-1"
            >
              <Brain className="w-3 h-3 text-purple-400" />
              <span>Explain Trajectory</span>
            </button>
            <button
              onClick={() => voiceAssistantService.handleUserInput('Check my vital signs')}
              className="px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700 border border-slate-700 whitespace-nowrap flex items-center space-x-1"
            >
              <Heart className="w-3 h-3 text-rose-400" />
              <span>Vitals</span>
            </button>
            <button
              onClick={() => voiceAssistantService.handleUserInput('How did I do? What were my results?')}
              className="px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700 border border-slate-700 whitespace-nowrap flex items-center space-x-1"
            >
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              <span>Results</span>
            </button>
          </div>

          {/* Live Context Strip — shows Asha is wired to real data */}
          <div className="flex items-center gap-2 flex-wrap px-1 py-1.5 rounded-xl bg-slate-950/60 border border-slate-800 text-[10px]">
            <span className="text-slate-500 shrink-0">Live context:</span>
            {currentHrBpm ? (
              <span className="flex items-center space-x-1 text-rose-400 font-mono">
                <Heart className="w-2.5 h-2.5" />
                <span>{currentHrBpm} BPM</span>
              </span>
            ) : (
              <span className="text-slate-600">HR —</span>
            )}
            {lastSessionResult?.biomarkers ? (
              <span className="flex items-center space-x-1 text-teal-400 font-mono">
                <Activity className="w-2.5 h-2.5" />
                <span>{lastSessionResult.biomarkers.speakingRateWpm} WPM</span>
              </span>
            ) : (
              <span className="text-slate-600">WPM —</span>
            )}
            {lastSessionResult?.phenotype && (
              <span className="flex items-center space-x-1 text-purple-400 font-mono">
                <Brain className="w-2.5 h-2.5" />
                <span className="capitalize">{lastSessionResult.phenotype.severity}</span>
              </span>
            )}
            {currentBpm && (
              <span className="flex items-center space-x-1 text-amber-400 font-mono">
                <Zap className="w-2.5 h-2.5" />
                <span>{currentBpm} BPM pacer</span>
              </span>
            )}
          </div>

          {/* Messages History */}
          <div className="max-h-56 overflow-y-auto space-y-2 text-xs pr-1">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                {m.agenticTag && m.sender === 'assistant' && (
                  <span className="text-[9px] font-mono text-teal-400 px-1 mb-0.5 flex items-center space-x-1">
                    <ShieldCheck className="w-2.5 h-2.5" />
                    <span>{m.agenticTag}</span>
                  </span>
                )}
                <div
                  className={`p-2.5 rounded-xl max-w-[85%] leading-relaxed ${
                    m.sender === 'user'
                      ? 'bg-teal-500 text-slate-950 font-medium'
                      : 'bg-slate-950 border border-slate-800 text-slate-200'
                  }`}
                >
                  {m.text}
                </div>
                <span className="text-[9px] text-slate-400 px-1 mt-0.5">{m.timestamp}</span>
              </div>
            ))}
            <div ref={chatBottomRef} />
          </div>

          {/* Input Bar */}
          <form onSubmit={handleSendText} className="flex items-center space-x-2 pt-1 border-t border-slate-800">
            <input
              type="text"
              placeholder="Ask Asha or speak..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="flex-1 text-xs bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500"
            />
            <button
              type="button"
              onClick={handleToggleMic}
              className={`p-2 rounded-xl border transition-all ${
                state === 'LISTENING'
                  ? 'bg-rose-500 text-white border-rose-400 animate-pulse'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
              }`}
              title="Speak to Assistant"
            >
              {state === 'LISTENING' ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4 text-teal-400" />}
            </button>
          </form>
        </div>
      )}

      {/* Floating Animated Siri/Asha Glowing Orb */}
      <div className="flex items-center space-x-3">
        {!isOpen && (
          <div
            onClick={() => setIsOpen(true)}
            className="hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-full bg-slate-900/90 border border-purple-500/30 text-xs text-purple-200 shadow-xl cursor-pointer hover:border-purple-400 transition-all backdrop-blur-md"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
            <span className="font-semibold">Asha Speech Co-Pilot</span>
            <span className="text-[10px] text-slate-400">
              {state === 'SPEAKING' ? '(Coaching...)' : state === 'LISTENING' ? '(Listening...)' : '(Hands-Free)'}
            </span>
          </div>
        )}

        <button
          onClick={() => {
            if (!isOpen) setIsOpen(true);
            handleToggleMic();
          }}
          className={`relative group flex items-center justify-center w-14 h-14 rounded-full transition-all duration-300 shadow-2xl focus:outline-none ${
            state === 'LISTENING'
              ? 'bg-gradient-to-r from-rose-500 via-purple-500 to-teal-400 scale-110 shadow-rose-500/50'
              : state === 'SPEAKING'
              ? 'bg-gradient-to-r from-purple-600 via-pink-500 to-cyan-400 shadow-purple-500/50 animate-pulse'
              : 'bg-gradient-to-r from-teal-500 via-indigo-500 to-purple-600 shadow-teal-500/30 hover:scale-105'
          }`}
          title="Asha Speech Therapy Voice Assistant"
        >
          <div className="absolute inset-0 rounded-full bg-inherit filter blur-md opacity-70 group-hover:opacity-100 transition-opacity animate-spin-slow" />
          
          <div className="relative w-12 h-12 rounded-full bg-slate-950/90 flex items-center justify-center text-white">
            {state === 'LISTENING' ? (
              <Mic className="w-6 h-6 text-rose-400 animate-bounce" />
            ) : state === 'SPEAKING' ? (
              <Volume2 className="w-6 h-6 text-teal-300 animate-pulse" />
            ) : (
              <Sparkles className="w-6 h-6 text-teal-400 group-hover:scale-110 transition-transform" />
            )}
          </div>
        </button>
      </div>
    </div>
  );
};
