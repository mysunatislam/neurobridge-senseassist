import React from 'react';
import { Sparkles, CheckCircle2 } from 'lucide-react';

interface PhonemeMouthGuideProps {
  targetPhoneme: string;
  visualCueType: 'mouth_shape' | 'finger_tap_prompt' | 'tempo_bar' | 'none';
  bpm: number;
  currentBeat: number;
  isPacingActive: boolean;
}

export const PhonemeMouthGuide: React.FC<PhonemeMouthGuideProps> = ({
  targetPhoneme,
  visualCueType,
  bpm,
  currentBeat,
  isPacingActive
}) => {
  if (visualCueType === 'none') return null;

  return (
    <div className="rounded-xl border border-teal-500/30 bg-gradient-to-br from-slate-900 via-teal-950/20 to-slate-900 p-4 shadow-lg">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-4 h-4 text-teal-400 animate-spin" />
          <span className="text-xs font-bold text-teal-300 uppercase tracking-wider">
            {isPacingActive ? 'Active Sensory-Motor Guidance' : 'Sensory-Motor Guidance Preview'}
          </span>
        </div>
        <span className="text-[11px] px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 font-mono">
          Target: {targetPhoneme} @ {bpm} BPM
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
        {/* Kinetic Rhythm Beat Synchronizer */}
        <div className="flex flex-col items-center justify-center p-3 rounded-lg bg-slate-950/60 border border-slate-800">
          <span className="text-[11px] text-slate-400 mb-2 font-medium">Kinetic Pacing Beat</span>
          <div className="flex space-x-2">
            {[0, 1, 2, 3].map((beat) => {
              const isCurrent = isPacingActive && currentBeat === beat;
              return (
                <div
                  key={beat}
                  className={`w-9 h-9 rounded-lg flex items-center justify-center font-mono font-bold text-xs transition-all duration-100 ${
                    isCurrent
                      ? 'bg-gradient-to-tr from-teal-400 to-cyan-300 text-slate-950 scale-110 shadow-lg shadow-teal-500/50'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {beat + 1}
                </div>
              );
            })}
          </div>
          <span className="text-[10px] text-teal-400 mt-2 font-medium">
            {isPacingActive ? (currentBeat === 0 ? '⬇ Initiate Vocalization' : 'Tactile pacing beat') : 'Pacer is not active'}
          </span>
        </div>

        {/* Anatomical Articulatory Mouth Diagram */}
        <div className="flex flex-col items-center justify-center p-3 rounded-lg bg-slate-950/60 border border-slate-800">
          <span className="text-[11px] text-slate-400 mb-1 font-medium">Phonemic Articulatory Posture</span>
          <div className="relative w-24 h-16 flex items-center justify-center">
            {targetPhoneme.includes('r') ? (
              // Retroflex tongue elevation diagram
              <svg viewBox="0 0 100 60" className="w-full h-full text-teal-400">
                {/* Lip outline */}
                <ellipse cx="50" cy="30" rx="36" ry="18" fill="none" stroke="#0d9488" strokeWidth="2.5" />
                {/* Teeth */}
                <rect x="35" y="16" width="30" height="6" rx="2" fill="#334155" />
                <rect x="35" y="38" width="30" height="6" rx="2" fill="#334155" />
                {/* Curled retroflex tongue tip */}
                <path d="M 28 36 Q 50 18 68 24" fill="none" stroke="#2dd4bf" strokeWidth="4" strokeLinecap="round" />
                <circle cx="68" cy="24" r="3" fill="#38bdf8" className="animate-ping" />
              </svg>
            ) : (
              // Bilabial / general opening
              <svg viewBox="0 0 100 60" className="w-full h-full text-teal-400">
                <ellipse cx="50" cy="30" rx="30" ry="14" fill="#0f172a" stroke="#2dd4bf" strokeWidth="3" />
                <circle cx="50" cy="30" r="6" fill="#38bdf8" />
              </svg>
            )}
          </div>
          <span className="text-[10px] text-slate-300 text-center font-medium mt-1">
            {targetPhoneme.includes('r') ? 'Curl tongue tip up & back (Retroflex)' : 'Bilabial release with continuous airflow'}
          </span>
        </div>

        {/* Sensory Motor Cue Description */}
        <div className="flex flex-col justify-center p-3 rounded-lg bg-slate-950/60 border border-slate-800 space-y-1.5">
          <span className="text-[11px] text-slate-400 font-medium">Motor Action Prompt</span>
          <div className="flex items-start space-x-2">
            <CheckCircle2 className="w-4 h-4 text-teal-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-slate-200 leading-snug">
              {visualCueType === 'finger_tap_prompt'
                ? 'Tap thumb to index finger on beat 1 before speaking the first syllable to unlock motor speech freezing.'
                : 'Synchronize speech initiation with beat 1. Exaggerate lip posture.'}
            </p>
          </div>
          <div className="text-[10px] text-cyan-400 bg-cyan-950/40 px-2 py-1 rounded border border-cyan-800/40">
            Haptic output: <strong>{isPacingActive ? 'App-gated pacing active' : 'Inactive'}</strong>
          </div>
        </div>
      </div>
    </div>
  );
};
