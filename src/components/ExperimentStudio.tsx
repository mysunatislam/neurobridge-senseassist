import React, { useState } from 'react';
import { FlaskConical, Play, CheckCircle2, ArrowRight, TrendingUp, Sparkles, Zap, Award, BarChart3, Binary } from 'lucide-react';
import { MicroExperiment, PatientDigitalTwin } from '../agents/types';
import { ExperimentDesignerAgent } from '../agents/ExperimentDesignerAgent';
import { reinforcementLearningEngine, BanditArm } from '../services/ReinforcementLearningEngine';

interface ExperimentStudioProps {
  digitalTwin: PatientDigitalTwin;
  lastExperiment: MicroExperiment | null;
  onExperimentComplete: (experiment: MicroExperiment) => void;
}

export const ExperimentStudio: React.FC<ExperimentStudioProps> = ({
  digitalTwin,
  lastExperiment,
  onExperimentComplete
}) => {
  const [isRunning, setIsRunning] = useState(false);
  const [banditArms, setBanditArms] = useState<BanditArm[]>(() => reinforcementLearningEngine.initializeArms());
  const [customHypothesis, setCustomHypothesis] = useState(
    lastExperiment?.hypothesis ||
    `Multi-sensory haptic entrainment at ${digitalTwin.preferredBpm} BPM reduces motor speech initiation latency by >25% and improves segmental phonemic stability compared to un-cued spontaneous speech.`
  );

  const experimentDesigner = new ExperimentDesignerAgent();

  const handleRunMicroExperiment = () => {
    setIsRunning(true);
    setTimeout(() => {
      const { experiment } = experimentDesigner.conductExperiment(
        {
          speakingRateWpm: 76,
          pauseCount: 2,
          meanPauseDurationSec: 1.3,
          initiationLatencySec: 0.9,
          articulationTimeRatio: 0.72,
          rhythmStabilityIndex: digitalTwin.rhythmStability,
          pitchVariabilityHz: 18.5,
          tremorIndex: 0.28,
          voiceEnergyDb: -18.2
        },
        {
          primaryDeficit: 'Phonemic Articulatory Substitution & Hesitation',
          secondaryDeficit: 'Sub-harmonic Rhythm Jitter',
          cognitiveLayerScore: 0.85,
          motorPlanningScore: digitalTwin.articulationScore,
          sensoryMotorSyncScore: digitalTwin.rhythmStability,
          severity: 'moderate',
          summary: 'Acoustic evaluation completed.',
          phonemeErrors: []
        },
        digitalTwin
      );

      // Update Bandit RL Policy
      const updatedArms = reinforcementLearningEngine.updateArmReward(
        banditArms,
        'arm-haptic',
        experiment.reinforcementReward
      );
      setBanditArms(updatedArms);

      onExperimentComplete(experiment);
      setIsRunning(false);
    }, 900);
  };

  const exp = lastExperiment;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-900 via-[#0c1527] to-slate-900 p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <FlaskConical className="w-5 h-5 text-emerald-400" />
            <h2 className="text-xl font-bold text-white">Autonomous A/B Micro-Experiment Studio</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Multi-Armed Bandit (UCB1) reinforcement learning agent autonomously evaluating sensory modalities and adapting therapy policy weights.
          </p>
        </div>

        <button
          onClick={handleRunMicroExperiment}
          disabled={isRunning}
          className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50"
        >
          <Play className="w-4 h-4 fill-current" />
          <span>{isRunning ? 'Executing Trial...' : 'Run Micro-Experiment & Update RL'}</span>
        </button>
      </div>

      {/* Hypothesis Card */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl space-y-3">
        <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center space-x-1.5">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Clinical Experiment Hypothesis</span>
        </span>
        <p className="text-sm text-slate-200 bg-slate-950/80 p-4 rounded-xl border border-slate-800 leading-relaxed font-mono">
          {customHypothesis}
        </p>
      </div>

      {/* Side-by-Side Trial Comparison: Condition A vs Condition B */}
      {exp && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in">
          {/* Condition A Card */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                  Control Group
                </span>
                <h3 className="text-base font-bold text-white mt-1">{exp.conditionA.name}</h3>
              </div>
              <span className="text-xs text-slate-400">{exp.conditionA.sentencesCount} Sentences</span>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs">
                <span className="text-slate-400">Sensory Cueing:</span>
                <span className="text-slate-300 font-semibold">{exp.conditionA.sensoryCue}</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs">
                <span className="text-slate-400">Articulatory Accuracy:</span>
                <span className="text-slate-300 font-mono font-bold text-base">{exp.conditionA.accuracy}%</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs">
                <span className="text-slate-400">Average Pause Latency:</span>
                <span className="text-slate-300 font-mono font-bold text-base">{exp.conditionA.avgPauseSec}s</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs">
                <span className="text-slate-400">Speaking Velocity:</span>
                <span className="text-slate-300 font-mono font-bold text-base">{exp.conditionA.wpm} WPM</span>
              </div>
            </div>
          </div>

          {/* Condition B Card (Winning Sensory Pacing) */}
          <div className="rounded-2xl border border-emerald-500/40 bg-gradient-to-br from-slate-900 via-emerald-950/20 to-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center space-x-1">
                  <Award className="w-3 h-3 text-emerald-400" />
                  <span>Winning Modality</span>
                </span>
                <h3 className="text-base font-bold text-white mt-1">{exp.conditionB.name}</h3>
              </div>
              <span className="text-xs text-slate-400">{exp.conditionB.sentencesCount} Sentences</span>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs">
                <span className="text-slate-400">Sensory Cueing:</span>
                <span className="text-emerald-300 font-semibold">{exp.conditionB.sensoryCue}</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs">
                <span className="text-slate-400">Articulatory Accuracy:</span>
                <span className="text-emerald-400 font-mono font-bold text-base">
                  {exp.conditionB.accuracy}% <span className="text-xs text-emerald-400 font-normal">(+{exp.deltaAccuracy}%)</span>
                </span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs">
                <span className="text-slate-400">Average Pause Latency:</span>
                <span className="text-cyan-400 font-mono font-bold text-base">
                  {exp.conditionB.avgPauseSec}s <span className="text-xs text-cyan-400 font-normal">(-{exp.deltaPauseReductionPercent}%)</span>
                </span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs">
                <span className="text-slate-400">Speaking Velocity:</span>
                <span className="text-amber-400 font-mono font-bold text-base">{exp.conditionB.wpm} WPM</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Multi-Armed Bandit RL Policy Inspector */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <Binary className="w-5 h-5 text-teal-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Multi-Armed Bandit (UCB1) Sensory Selection Policy Distribution
            </h3>
          </div>
          <span className="text-xs font-mono text-teal-400">
            UCB1: Q(a) + c·√(ln(t)/N(a))
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {banditArms.map((arm) => (
            <div
              key={arm.id}
              className={`p-4 rounded-xl border transition-all ${
                arm.id === 'arm-haptic'
                  ? 'bg-teal-950/30 border-teal-500/50 shadow-md shadow-teal-500/10'
                  : 'bg-slate-950/60 border-slate-800'
              }`}
            >
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold text-white">{arm.name}</span>
                <span className="text-xs font-mono font-bold text-teal-400">
                  {Math.round(arm.policyWeight * 100)}% Weight
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden mb-2.5">
                <div
                  className="bg-gradient-to-r from-teal-400 to-cyan-400 h-full rounded-full transition-all duration-500"
                  style={{ width: `${arm.policyWeight * 100}%` }}
                />
              </div>

              <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                <span>Trials N(a): {arm.trialsCount}</span>
                <span>Avg Reward Q(a): {arm.averageReward}</span>
                <span>UCB1 Score: {arm.ucbScore}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
