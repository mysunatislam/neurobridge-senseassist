import React, { useState } from 'react';
import { Key, Sparkles, Check, AlertCircle, ShieldCheck, Cpu, Cloud, Zap, ExternalLink, Activity, CheckCircle2, Trash2 } from 'lucide-react';
import { geminiService, EngineTier } from '../services/GeminiService';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, onClose }) => {
  const [selectedTier, setSelectedTier] = useState<EngineTier>(geminiService.getTier());
  const [key, setKey] = useState(geminiService.getApiKey());
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; latencyMs: number; message: string } | null>(null);
  const [saved, setSaved] = useState(false);

  if (!isOpen) return null;

  const handleTestKey = async () => {
    setIsTesting(true);
    setTestResult(null);
    const result = await geminiService.testApiKey(key);
    setTestResult(result);
    setIsTesting(false);
    if (result.success) {
      geminiService.setApiKey(key);
      geminiService.setTier('cloud_gemini_free');
      setSelectedTier('cloud_gemini_free');
    }
  };

  const handleSave = () => {
    geminiService.setTier(selectedTier);
    if (selectedTier === 'cloud_gemini_free' && key.trim()) {
      geminiService.setApiKey(key);
    }
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 600);
  };

  const handleClearKey = () => {
    geminiService.clearApiKey();
    setKey('');
    setSelectedTier('local_edge_free');
    setTestResult({ success: true, latencyMs: 0, message: 'Stored API key removed from this browser.' });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-6 space-y-5 text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-teal-400" />
            <h3 className="font-bold text-white text-base">
              AI Engine &amp; Free Tier Configuration Hub
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-xs px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Free Tier Selector Cards */}
        <div className="space-y-3">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
            Select the prototype execution mode:
          </span>

          {/* Tier 1: Local Edge Free Tier */}
          <div
            onClick={() => setSelectedTier('local_edge_free')}
            className={`p-4 rounded-xl border transition-all cursor-pointer flex items-start space-x-3 ${
              selectedTier === 'local_edge_free'
                ? 'bg-teal-950/40 border-teal-400 shadow-lg shadow-teal-500/10 ring-1 ring-teal-400'
                : 'bg-slate-950/60 border-slate-800 hover:bg-slate-850'
            }`}
          >
            <div className="p-2 rounded-lg bg-teal-500/20 text-teal-300 mt-0.5">
              <Cpu className="w-5 h-5" />
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-white">Tier 1: Local Edge Autonomous Engine</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 font-bold">
                  $0.00 / mo (Default)
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Local orchestration and deterministic scenario logic. MediaPipe assets and browser speech services may still require a network connection.
              </p>
              <div className="flex items-center space-x-4 pt-1 text-[10px] font-mono text-slate-400">
                <span className="text-teal-400">No API key required</span>
                <span>Data stays local unless a browser/CDN service is used</span>
              </div>
            </div>
          </div>

          {/* Tier 2: Free Google AI Studio Gemini Cloud Tier */}
          <div
            onClick={() => setSelectedTier('cloud_gemini_free')}
            className={`p-4 rounded-xl border transition-all cursor-pointer flex items-start space-x-3 ${
              selectedTier === 'cloud_gemini_free'
                ? 'bg-purple-950/40 border-purple-400 shadow-lg shadow-purple-500/10 ring-1 ring-purple-400'
                : 'bg-slate-950/60 border-slate-800 hover:bg-slate-850'
            }`}
          >
            <div className="p-2 rounded-lg bg-purple-500/20 text-purple-300 mt-0.5">
              <Cloud className="w-5 h-5" />
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-white">Tier 2: Google Gemini Cloud Free Tier</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-bold">
                  Account limits apply
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Optional Gemini API assistance. Availability, models, quotas, and pricing depend on your Google AI Studio account.
              </p>
              <div className="flex items-center space-x-4 pt-1 text-[10px] font-mono text-slate-400">
                <span className="text-purple-400">🧠 Multimodal LLM</span>
                <span>Account quota applies</span>
              </div>
            </div>
          </div>
        </div>

        {/* Gemini Free Key Input (Visible if Tier 2 Selected) */}
        {selectedTier === 'cloud_gemini_free' && (
          <div className="p-4 rounded-xl bg-slate-950/90 border border-purple-800/40 space-y-3 animate-in fade-in">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-purple-300 flex items-center space-x-1.5">
                <Key className="w-3.5 h-3.5 text-purple-400" />
                <span>Google AI Studio API Key (Free)</span>
              </label>
              <a
                href="https://aistudio.google.com/"
                target="_blank"
                rel="noreferrer"
                className="text-[10px] text-teal-400 hover:underline flex items-center space-x-1"
              >
                <span>Get Free Key (30s)</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="password"
                placeholder="AIzaSy..."
                value={key}
                onChange={(e) => setKey(e.target.value)}
                className="flex-1 text-xs bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-purple-500"
              />
              <button
                onClick={handleTestKey}
                disabled={isTesting || !key.trim()}
                className="px-3 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs transition-colors disabled:opacity-50 flex items-center space-x-1"
              >
                {isTesting ? <Activity className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
                <span>{isTesting ? 'Pinging...' : 'Test Key'}</span>
              </button>
            </div>

            {testResult && (
              <div
                className={`p-2.5 rounded-lg text-[11px] font-mono flex items-center space-x-2 ${
                  testResult.success
                    ? 'bg-emerald-950/30 text-emerald-300 border border-emerald-500/30'
                    : 'bg-rose-950/30 text-rose-300 border border-rose-500/30'
                }`}
              >
                {testResult.success ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
                <span>{testResult.message}</span>
              </div>
            )}
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800">
          <div className="flex items-center space-x-1.5 text-[10px] text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
            <span>Stored in browser localStorage (plaintext). Cloud mode transmits session text/features; captured audio is sent only after the separate per-recording consent action.</span>
          </div>

          <div className="flex space-x-2">
            {geminiService.hasApiKey() && (
              <button
                onClick={handleClearKey}
                className="px-3.5 py-1.5 rounded-xl bg-rose-950/50 hover:bg-rose-900/60 text-rose-300 border border-rose-800 text-xs font-semibold flex items-center space-x-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remove Key</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-400 text-slate-950 font-bold text-xs shadow-lg shadow-teal-500/20 flex items-center space-x-1.5 hover:scale-105 transition-all"
            >
              {saved ? <Check className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
              <span>{saved ? 'Active!' : 'Apply Free Tier'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
