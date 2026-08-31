import React, { useEffect, useRef, useState } from 'react';
import { Camera, CameraOff, Sparkles, Activity, Eye, Scan, CheckCircle2, AlertTriangle, Compass, HandMetal, Heart, Wind, Volume2, Play, RefreshCw, Database, Award, ArrowRight, UserCheck } from 'lucide-react';
import { VisualKinematicBiomarkers, mediaPipeVisionService } from '../services/MediaPipeVisionService';
import { CLINICAL_GESTURE_DATABASE, ClinicalGestureTemplate } from '../services/ClinicalGestureDatabase';
import { voiceAssistantService } from '../services/VoiceAssistantService';
import { PulseSightLiveView } from './PulseSightLiveView';
import { FingerSpeakLiveView } from './FingerSpeakLiveView';

interface VisionKinematicsTrackerProps {
  onKinematicsUpdate?: (biomarkers: VisualKinematicBiomarkers) => void;
}

const createEmptyBiomarkers = (): VisualKinematicBiomarkers => ({
  lipApertureMm: null,
  lipWidthMm: null,
  lipRoundingIndex: null,
  facialSymmetryPercent: null,
  jawOpeningVelocityMmS: null,
  articulatoryGropingIndex: null,
  headYawDeg: null,
  headPitchDeg: null,
  headRollDeg: null,
  posturalStabilityScore: null,
  gazeDirection: 'CENTER',
  fixationStabilityPct: null,
  blinkRatePerMin: null,
  cognitiveGazeAversion: false,
  handGestureActive: false,
  gestureCadenceBpm: null,
  handSpeechSyncIndex: null,
  handCoordinates: { x: 0, y: 0 },
  isFaceDetected: false,
  landmarksCount: 0
});

export const VisionKinematicsTracker: React.FC<VisionKinematicsTrackerProps> = ({
  onKinematicsUpdate
}) => {
  // 3-Way Mode Switcher
  const [visionMode, setVisionMode] = useState<'kinematics' | 'pulsesight' | 'fingerspeak'>('kinematics');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isWebcamActive, setIsWebcamActive] = useState(false);

  // Real Biomarkers State from MediaPipe
  const [biomarkers, setBiomarkers] = useState<VisualKinematicBiomarkers>(createEmptyBiomarkers);

  const handleToggleWebcam = async () => {
    if (isWebcamActive) {
      mediaPipeVisionService.stopTracking();
      setIsWebcamActive(false);
      setBiomarkers(createEmptyBiomarkers());
    } else {
      if (videoRef.current && canvasRef.current) {
        const ok = await mediaPipeVisionService.startWebcamTracking(
          videoRef.current,
          canvasRef.current,
          (updated) => {
            setBiomarkers(updated);
            if (onKinematicsUpdate) onKinematicsUpdate(updated);
          }
        );
        if (ok) setIsWebcamActive(true);
      }
    }
  };

  useEffect(() => {
    return () => {
      mediaPipeVisionService.stopTracking();
    };
  }, []);

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl space-y-5">
      {/* Mode Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center space-x-2">
          <Scan className="w-5 h-5 text-teal-400" />
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Computer Vision &amp; Kinematics Neural Engine <span className="text-teal-300">· Prototype</span>
            </h3>
            <span className="text-[10px] text-slate-400">
              Live MediaPipe landmarks &bull; Experimental PulseSight POS rPPG &bull; FingerSpeak TensorFlow.js AAC
            </span>
          </div>
        </div>

        {/* 3 Sub-Segment Modes */}
        <div className="flex items-center space-x-1.5 p-1 rounded-xl bg-slate-950 border border-slate-800 self-start lg:self-auto">
          <button
            onClick={() => setVisionMode('kinematics')}
            title="Live MediaPipe geometry and camera-relative 3D pose proxies"
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center space-x-1.5 ${
              visionMode === 'kinematics'
                ? 'bg-teal-500 text-slate-950 font-bold shadow-md shadow-teal-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Real 3D Kinematics</span>
          </button>

          <button
            onClick={() => setVisionMode('pulsesight')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center space-x-1.5 ${
              visionMode === 'pulsesight'
                ? 'bg-rose-500 text-white font-bold shadow-md shadow-rose-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Heart className="w-3.5 h-3.5" />
            <span>PulseSight (rPPG Vitals)</span>
          </button>

          <button
            onClick={() => setVisionMode('fingerspeak')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center space-x-1.5 ${
              visionMode === 'fingerspeak'
                ? 'bg-purple-500 text-slate-950 font-bold shadow-md shadow-purple-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <HandMetal className="w-3.5 h-3.5" />
            <span>FingerSpeak (TF.js AAC)</span>
          </button>
        </div>
      </div>

      {/* MODE 1: REAL 3D ANATOMICAL KINEMATICS & POSE */}
      {visionMode === 'kinematics' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Real Live Video Viewport with True Landmark Overlays */}
          <div className="lg:col-span-7 relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 aspect-[4/3] flex items-center justify-center shadow-2xl">
            <video ref={videoRef} playsInline autoPlay muted className="absolute opacity-0 pointer-events-none w-1 h-1" />
            <canvas ref={canvasRef} width={640} height={480} className="w-full h-full object-cover" />

            {!isWebcamActive && (
              <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center space-y-3 z-10">
                <div className="w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400">
                  <Eye className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-white">Enable Camera to Track Real Face &amp; Lips</h4>
                <p className="text-xs text-slate-400 max-w-xs">
                  Runs MediaPipe FaceLandmarker on your webcam to estimate lip geometry and camera-relative head pose in real time.
                </p>
                <button
                  onClick={handleToggleWebcam}
                  className="px-5 py-2.5 rounded-xl bg-teal-500 text-slate-950 font-bold text-xs shadow-lg shadow-teal-500/20 hover:scale-105 transition-all"
                >
                  Enable Camera
                </button>
              </div>
            )}

            {isWebcamActive && (
              <div className="absolute top-3 left-3 flex items-center space-x-2 bg-slate-950/80 px-2.5 py-1 rounded-lg border border-slate-800 text-[10px] font-mono text-teal-300 z-10">
                <span className="w-2 h-2 rounded-full bg-teal-400 animate-ping" />
                <span>{biomarkers.isFaceDetected ? `${biomarkers.landmarksCount}-point face landmarks` : 'Looking for face…'}</span>
              </div>
            )}
          </div>

          {/* Right Column: Real Biometric Telemetry */}
          <div className="lg:col-span-5 space-y-3">
            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
              <div className="flex justify-between items-center border-b border-slate-800/80 pb-1.5">
                <span className="text-[10px] font-bold text-teal-400 uppercase tracking-wider">
                  Landmark-Derived Oral-Motor Estimates
                </span>
                <span className="text-[10px] text-slate-400 font-mono">Assumed 63 mm IPD scale</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="text-[9px] text-slate-400 uppercase block font-mono">Vertical Lip Aperture</span>
                  <span className="text-lg font-bold text-teal-300 font-mono">
                    {biomarkers.lipApertureMm !== null ? `${biomarkers.lipApertureMm.toFixed(1)} mm*` : '--'}
                  </span>
                  <span className="text-[9px] text-slate-500 block">Landmark-distance estimate</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="text-[9px] text-slate-400 uppercase block font-mono">Oral-Motor Symmetry</span>
                  <span className="text-lg font-bold text-emerald-400 font-mono">
                    {biomarkers.facialSymmetryPercent !== null ? `${biomarkers.facialSymmetryPercent}%` : '--'}
                  </span>
                  <span className="text-[9px] text-slate-500 block">Landmark-distance ratio</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="text-[9px] text-slate-400 uppercase block font-mono">Jaw Velocity</span>
                  <span className="text-lg font-bold text-cyan-300 font-mono">
                    {biomarkers.jawOpeningVelocityMmS !== null ? `${biomarkers.jawOpeningVelocityMmS.toFixed(1)} mm/s` : '--'}
                  </span>
                  <span className="text-[9px] text-slate-500 block">Frame-to-frame aperture change</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="text-[9px] text-slate-400 uppercase block font-mono">Asymmetry Index</span>
                  <span className="text-lg font-bold text-purple-300 font-mono">
                    {biomarkers.facialSymmetryPercent !== null ? `${(1 - biomarkers.facialSymmetryPercent / 100).toFixed(2)}` : '--'}
                  </span>
                  <span className="text-[9px] text-slate-500 block">1 − symmetry ratio (proxy)</span>
                </div>
              </div>
              <p className="text-[9px] leading-relaxed text-slate-500">
                * Millimetre estimates assume a 63 mm adult interpupillary distance; they are not individually calibrated or diagnostic.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
              <div className="flex justify-between items-center border-b border-slate-800/80 pb-1.5">
                <span className="text-[10px] font-bold text-sky-400 uppercase tracking-wider flex items-center space-x-1">
                  <Compass className="w-3.5 h-3.5" />
                  <span>Camera-Relative Head-Pose Estimates</span>
                </span>
                <span className="text-[10px] font-mono text-sky-300 font-bold">
                  {biomarkers.posturalStabilityScore !== null ? `Pose stability proxy: ${biomarkers.posturalStabilityScore}%` : 'Calibrating…'}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="text-[9px] text-slate-400 uppercase block font-mono">Yaw</span>
                  <span className="font-mono font-bold text-sky-300">
                    {biomarkers.headYawDeg !== null ? `${biomarkers.headYawDeg}°` : '--'}
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="text-[9px] text-slate-400 uppercase block font-mono">Pitch</span>
                  <span className="font-mono font-bold text-sky-300">
                    {biomarkers.headPitchDeg !== null ? `${biomarkers.headPitchDeg}°` : '--'}
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="text-[9px] text-slate-400 uppercase block font-mono">Roll</span>
                  <span className="font-mono font-bold text-sky-300">
                    {biomarkers.headRollDeg !== null ? `${biomarkers.headRollDeg}°` : '--'}
                  </span>
                </div>
              </div>
              <p className="text-[9px] leading-relaxed text-slate-500">
                Angles and stability are landmark heuristics, not calibrated cervical measurements.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2 text-[10px] font-mono">
              <div className="flex items-center justify-between gap-3">
                <span className="text-slate-400">Blink-rate estimate:</span>
                <span className="text-cyan-300 font-bold text-right">
                  {biomarkers.blinkRatePerMin !== null
                    ? `${biomarkers.blinkRatePerMin} / min`
                    : biomarkers.isFaceDetected ? 'Calibrating (10 s min)' : 'Unavailable'}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-slate-400">Hand-motion cadence:</span>
                <span className="text-amber-300 font-bold text-right">
                  {!biomarkers.handGestureActive
                    ? 'No hand detected'
                    : biomarkers.gestureCadenceBpm !== null
                      ? `${biomarkers.gestureCadenceBpm} movements/min (estimate)`
                      : 'Repeat movement to estimate'}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-slate-400">Eye-fixation stability:</span>
                <span className="text-slate-500 font-bold text-right">Unavailable — no eye-gaze model</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-slate-400">Speech-hand sync:</span>
                <span className="text-slate-500 font-bold text-right">Unavailable — no synchronized speech clock</span>
              </div>
            </div>

            <button
              onClick={handleToggleWebcam}
              className={`w-full py-2.5 rounded-xl font-bold text-xs transition-all shadow-md flex items-center justify-center space-x-1.5 ${
                isWebcamActive ? 'bg-rose-600 hover:bg-rose-700 text-white' : 'bg-teal-500 hover:bg-teal-400 text-slate-950'
              }`}
            >
              {isWebcamActive ? <CameraOff className="w-4 h-4" /> : <Camera className="w-4 h-4" />}
              <span>{isWebcamActive ? 'Stop Live Camera' : 'Start Live Camera Tracking'}</span>
            </button>
          </div>
        </div>
      )}

      {/* MODE 2: PULSESIGHT LIVE rPPG VIEW */}
      {visionMode === 'pulsesight' && <PulseSightLiveView />}

      {/* MODE 3: FINGERSPEAK REAL TENSORFLOW.JS AAC */}
      {visionMode === 'fingerspeak' && <FingerSpeakLiveView />}
    </div>
  );
};
