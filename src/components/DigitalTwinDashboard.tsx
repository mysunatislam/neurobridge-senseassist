import React, { useState } from 'react';
import { Brain, TrendingUp, Zap, Sliders, Shield, Award, Sparkles, RefreshCw } from 'lucide-react';
import { PatientDigitalTwin } from '../agents/types';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale
} from 'chart.js';
import { Radar, Line } from 'react-chartjs-2';

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale
);

interface DigitalTwinDashboardProps {
  digitalTwin: PatientDigitalTwin;
  onUpdateDigitalTwin: (updated: PatientDigitalTwin) => void;
}

export const DigitalTwinDashboard: React.FC<DigitalTwinDashboardProps> = ({
  digitalTwin,
  onUpdateDigitalTwin
}) => {
  const [twinState, setTwinState] = useState<PatientDigitalTwin>(digitalTwin);

  // Sync state if props change
  React.useEffect(() => {
    setTwinState(digitalTwin);
  }, [digitalTwin]);

  const handleSliderChange = (key: keyof PatientDigitalTwin, value: number) => {
    const updated = { ...twinState, [key]: value };
    setTwinState(updated);
    onUpdateDigitalTwin(updated);
  };

  // Radar Chart Data Configuration
  const radarData = {
    labels: [
      'Articulation Precision',
      'Rhythm Stability',
      'Initiation Fluency',
      'Haptic Entrainment',
      'Visual Responsiveness',
      'Learning Velocity'
    ],
    datasets: [
      {
        label: `Current Twin (${twinState.name})`,
        data: [
          twinState.articulationScore * 100,
          twinState.rhythmStability * 100,
          twinState.initiationFluency * 100,
          twinState.hapticResponsiveness * 100,
          twinState.visualResponsiveness * 100,
          twinState.learningVelocity * 100
        ],
        backgroundColor: 'rgba(45, 212, 191, 0.25)',
        borderColor: '#2dd4bf',
        borderWidth: 2.5,
        pointBackgroundColor: '#2dd4bf',
        pointBorderColor: '#080d1a',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: '#2dd4bf'
      },
      {
        label: 'Initial Baseline Calibrator',
        data: [45, 38, 40, 60, 50, 45],
        backgroundColor: 'rgba(148, 163, 184, 0.12)',
        borderColor: '#64748b',
        borderWidth: 1.5,
        borderDash: [4, 4],
        pointBackgroundColor: '#64748b'
      }
    ]
  };

  const radarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      r: {
        angleLines: { color: 'rgba(255, 255, 255, 0.1)' },
        grid: { color: 'rgba(255, 255, 255, 0.08)' },
        pointLabels: {
          color: '#94a3b8',
          font: { size: 11, weight: 'bold' as const }
        },
        ticks: {
          display: false,
          max: 100,
          min: 0,
          stepSize: 20
        },
        suggestedMin: 0,
        suggestedMax: 100
      }
    },
    plugins: {
      legend: {
        labels: {
          color: '#cbd5e1',
          font: { size: 11 }
        }
      }
    }
  };

  // Trajectory Line Chart
  const lineLabels = twinState.historicalTrajectory.map(t => `Session ${t.session}`);
  const lineData = {
    labels: lineLabels.length > 0 ? lineLabels : ['Session 1', 'Session 2', 'Session 3', 'Session 4', 'Session 5'],
    datasets: [
      {
        label: 'Articulation Precision (%)',
        data: twinState.historicalTrajectory.map(t => Math.round(t.articulation * 100)),
        borderColor: '#2dd4bf',
        backgroundColor: 'rgba(45, 212, 191, 0.1)',
        tension: 0.3,
        fill: true
      },
      {
        label: 'Rhythm Stability (%)',
        data: twinState.historicalTrajectory.map(t => Math.round(t.rhythm * 100)),
        borderColor: '#c084fc',
        backgroundColor: 'transparent',
        tension: 0.3,
        borderDash: [3, 3]
      },
      {
        label: 'Speaking Velocity (WPM)',
        data: twinState.historicalTrajectory.map(t => t.wpm),
        borderColor: '#f59e0b',
        backgroundColor: 'transparent',
        tension: 0.3
      }
    ]
  };

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: { color: '#94a3b8', font: { size: 10 } }
      },
      y: {
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: { color: '#94a3b8', font: { size: 10 } }
      }
    },
    plugins: {
      legend: {
        labels: { color: '#cbd5e1', font: { size: 11 } }
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-900 via-[#0c1527] to-slate-900 p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Brain className="w-5 h-5 text-teal-400" />
            <h2 className="text-xl font-bold text-white">Patient Communication Digital Twin</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Dynamic computational model reflecting real-time neuromuscular articulation, cadence stability, and sensory responsiveness.
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <span className="px-3 py-1 rounded-lg bg-teal-500/20 text-teal-300 border border-teal-500/40 font-mono">
            Twin Model: Active (v5.2)
          </span>
        </div>
      </div>

      {/* Main Digital Twin Grid: Radar + Trajectory */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Radar Chart Card */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-teal-400" />
              <span>Multi-Dimensional Neuromuscular Profile</span>
            </h3>
            <span className="text-[11px] text-teal-400 font-mono">
              Sensory Modality: {twinState.preferredModality}
            </span>
          </div>

          <div className="h-72 relative">
            <Radar data={radarData} options={radarOptions} />
          </div>
        </div>

        {/* Trajectory Line Chart Card */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-cyan-400" />
              <span>Longitudinal Neuro-Recovery Trajectory</span>
            </h3>
            <span className="text-[11px] text-slate-400">
              {twinState.sessionsCompleted} Sessions Completed
            </span>
          </div>

          <div className="h-72 relative">
            <Line data={lineData} options={lineOptions} />
          </div>
        </div>
      </div>

      {/* Interactive Digital Twin Parameter Controls & Forward Simulator */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Sliders className="w-4 h-4 text-purple-400" />
            <h3 className="text-sm font-bold text-white">Live Digital Twin Parameter Modifiers</h3>
          </div>
          <span className="text-[11px] text-slate-400">
            Adjust sliders to test how agent decisions adapt dynamically
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2 p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300 font-medium">Articulation Precision</span>
              <span className="text-teal-400 font-mono font-bold">{Math.round(twinState.articulationScore * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="1.0"
              step="0.02"
              value={twinState.articulationScore}
              onChange={(e) => handleSliderChange('articulationScore', parseFloat(e.target.value))}
              className="w-full accent-teal-500"
            />
          </div>

          <div className="space-y-2 p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300 font-medium">Rhythm Stability</span>
              <span className="text-purple-400 font-mono font-bold">{Math.round(twinState.rhythmStability * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="1.0"
              step="0.02"
              value={twinState.rhythmStability}
              onChange={(e) => handleSliderChange('rhythmStability', parseFloat(e.target.value))}
              className="w-full accent-purple-500"
            />
          </div>

          <div className="space-y-2 p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300 font-medium">Haptic Responsiveness</span>
              <span className="text-cyan-400 font-mono font-bold">{Math.round(twinState.hapticResponsiveness * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="1.0"
              step="0.02"
              value={twinState.hapticResponsiveness}
              onChange={(e) => handleSliderChange('hapticResponsiveness', parseFloat(e.target.value))}
              className="w-full accent-cyan-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
