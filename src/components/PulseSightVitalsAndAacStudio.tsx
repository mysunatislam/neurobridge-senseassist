import React, { useState } from 'react';
import { Heart, HandMetal, Activity } from 'lucide-react';
import { PulseSightLiveView } from './PulseSightLiveView';
import { FingerSpeakLiveView } from './FingerSpeakLiveView';

export const PulseSightVitalsAndAacStudio: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'vitals' | 'aac'>('vitals');

  return (
    <div className="space-y-6">
      {/* Navigation Sub-Tabs */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-teal-400 to-indigo-500 flex items-center justify-center text-slate-950 font-bold">
            ♥
          </div>
          <div>
            <h2 className="text-base font-bold text-white">PulseSight &amp; FingerSpeak AAC Suite</h2>
            <span className="text-[11px] text-slate-400 font-mono">
              Contactless POS rPPG Vitals &bull; TensorFlow.js BiGRU Gesture AAC Speech Engine
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-1 p-1 rounded-xl bg-slate-950 border border-slate-800">
          <button
            onClick={() => setActiveSubTab('vitals')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center space-x-1.5 ${
              activeSubTab === 'vitals'
                ? 'bg-teal-500 text-slate-950 font-bold shadow-md shadow-teal-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>PulseSight (rPPG Vitals)</span>
          </button>

          <button
            onClick={() => setActiveSubTab('aac')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center space-x-1.5 ${
              activeSubTab === 'aac'
                ? 'bg-purple-500 text-slate-950 font-bold shadow-md shadow-purple-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <HandMetal className="w-3.5 h-3.5" />
            <span>FingerSpeak (TensorFlow.js AAC)</span>
          </button>
        </div>
      </div>

      {/* Render Active View */}
      {activeSubTab === 'vitals' ? <PulseSightLiveView /> : <FingerSpeakLiveView />}
    </div>
  );
};
