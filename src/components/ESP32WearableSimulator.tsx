import React, { useState, useEffect } from 'react';
import { Radio, Bluetooth, Zap, RefreshCw, Terminal, CheckCircle2, Play, Square, Copy, Check } from 'lucide-react';
import { HapticController, HapticPacket } from '../services/HapticController';
import { ActuationGateDecision } from '../services/ActuationSafetyGate';

interface ESP32WearableSimulatorProps {
  hapticController: HapticController;
  isBleConnected: boolean;
  onConnectBle: () => void;
  isPacingActive: boolean;
  currentBeat: number;
  onRequestPacing: (packet: HapticPacket) => ActuationGateDecision;
  onStopPacing: () => void;
  onRequestPulse: (packet: HapticPacket) => ActuationGateDecision;
  actuationDecision: ActuationGateDecision;
}

export const ESP32WearableSimulator: React.FC<ESP32WearableSimulatorProps> = ({
  hapticController,
  isBleConnected,
  onConnectBle,
  isPacingActive,
  currentBeat,
  onRequestPacing,
  onStopPacing,
  onRequestPulse,
  actuationDecision
}) => {
  const [bpm, setBpm] = useState(80);
  const [intensity, setIntensity] = useState(65);
  const [pattern, setPattern] = useState<'1-2-3-4' | 'tap-tap-pause-tap' | 'ascending_sync' | 'calming_wave'>('1-2-3-4');
  const [serialLogs, setSerialLogs] = useState<string[]>([
    '[INIT] ESP32-WROOM-32 Booting up...',
    '[INIT] MPU6050 6-Axis IMU Initialized @ 400kHz I2C',
    '[BLE] Advertising as "NeuroBridge SenseAssist"...',
    '[READY] Standing by for autonomous agent actuation protocol.'
  ]);
  const [copiedFirmware, setCopiedFirmware] = useState(false);

  // Pulse animation trigger
  const [isVibrating, setIsVibrating] = useState(false);

  useEffect(() => {
    const pulseHandler = (beatIndex: number, pulseIntensity: number) => {
      if (pulseIntensity > 0) {
        setIsVibrating(true);
        setTimeout(() => setIsVibrating(false), 140);

        setSerialLogs(prev => [
          `[HAPTIC] Beat ${beatIndex + 1}/4 | Pulse ${pulseIntensity}% | MotPWM: ${Math.round((pulseIntensity / 100) * 255)}`,
          ...prev.slice(0, 15)
        ]);
      }
    };

    hapticController.addPulseListener(pulseHandler);
    return () => {
      hapticController.removePulseListener(pulseHandler);
    };
  }, [hapticController]);

  const handleTestSinglePulse = () => {
    const decision = onRequestPulse({
      bpm,
      pattern,
      intensity,
      durationMs: 140,
      active: true
    });
    if (!decision.permitted) {
      setSerialLogs(prev => [`[SAFETY] Pulse blocked: ${decision.reason}`, ...prev.slice(0, 15)]);
      return;
    }
    setIsVibrating(true);
    setTimeout(() => setIsVibrating(false), 160);
    setSerialLogs(prev => [
      `[MANUAL] Triggered single haptic pulse (${intensity}% @ 55Hz sub-bass)`,
      ...prev.slice(0, 15)
    ]);
  };

  const handleTogglePacing = () => {
    if (isPacingActive) {
      onStopPacing();
    } else {
      const decision = onRequestPacing({
        bpm,
        pattern,
        intensity,
        durationMs: 120,
        active: true
      });
      if (!decision.permitted) {
        setSerialLogs(prev => [`[SAFETY] Continuous pacing blocked: ${decision.reason}`, ...prev.slice(0, 15)]);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-900 via-[#0c1527] to-slate-900 p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Radio className="w-5 h-5 text-teal-400" />
            <h2 className="text-xl font-bold text-white">ESP32 Haptic Wearable Studio</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time sensory-motor tactile actuator, Web Bluetooth BLE link, and sub-bass vibration synthesizer.
          </p>
        </div>

        <button
          onClick={onConnectBle}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-semibold text-xs transition-all shadow-md ${
            isBleConnected
              ? 'bg-teal-500 text-slate-950 shadow-teal-500/20'
              : 'bg-slate-800 hover:bg-slate-700 text-teal-300 border border-teal-500/30'
          }`}
        >
          <Bluetooth className="w-4 h-4" />
          <span>{isBleConnected ? 'ESP32 Device Paired' : 'Pair Real Hardware (Web BLE)'}</span>
        </button>
      </div>

      {/* Hardware Visualizer & Actuator Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Visual ESP32 Wearable Device Rendering */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl flex flex-col items-center justify-center relative min-h-[360px] overflow-hidden">
          <div className="absolute top-4 left-4 flex items-center space-x-2">
            <span className={`w-2.5 h-2.5 rounded-full ${isBleConnected ? 'bg-teal-400 animate-pulse' : 'bg-slate-600'}`} />
            <span className="text-xs font-mono text-slate-400">
              {isBleConnected ? 'BLE GATT: CONNECTED' : 'BLE GATT: STANDBY'}
            </span>
          </div>

          <div className="absolute top-4 right-4 flex items-center space-x-2">
            <span className={`w-2.5 h-2.5 rounded-full ${isVibrating ? 'bg-pink-500 animate-ping' : 'bg-slate-700'}`} />
            <span className="text-xs font-mono text-slate-400">
              HAPTIC MOTOR: {isVibrating ? 'FIRING' : 'IDLE'}
            </span>
          </div>

          {/* Interactive Wearable Device PCB Representation */}
          <div className="relative mt-8">
            {/* Ripple Shockwave Ring when vibrating */}
            {isVibrating && (
              <>
                <div className="absolute inset-0 rounded-full border-2 border-pink-500 animate-ping opacity-75 pointer-events-none scale-150" />
                <div className="absolute inset-0 rounded-full border-4 border-teal-400 animate-pulse opacity-50 pointer-events-none scale-125" />
              </>
            )}

            {/* Wearable Enclosure */}
            <div className={`w-52 h-52 rounded-3xl bg-gradient-to-br from-slate-800 via-slate-900 to-black border-2 transition-all duration-100 flex flex-col items-center justify-center p-4 shadow-2xl ${
              isVibrating ? 'border-pink-500 scale-105 shadow-pink-500/40 translate-x-0.5 -translate-y-0.5' : 'border-teal-500/40 shadow-teal-500/10'
            }`}>
              {/* ESP32 Microcontroller Core */}
              <div className="w-24 h-16 rounded-lg bg-slate-950 border border-slate-700 flex flex-col items-center justify-center p-1 text-center shadow-inner">
                <span className="text-[9px] font-mono text-slate-400 font-bold">ESP32-WROOM</span>
                <span className="text-[8px] font-mono text-teal-400 font-semibold mt-0.5">2.4GHz BLE + WiFi</span>
              </div>

              {/* Vibration Motor Representation */}
              <div className="flex items-center justify-between w-full px-4 mt-4">
                <div className={`w-10 h-10 rounded-full border flex items-center justify-center transition-all ${
                  isVibrating ? 'bg-pink-500/30 border-pink-400 text-pink-300 animate-bounce' : 'bg-slate-800 border-slate-700 text-slate-500'
                }`}>
                  <Zap className="w-5 h-5" />
                </div>
                <div className="text-center">
                  <span className="text-[10px] text-slate-400 font-mono block">CADENCE</span>
                  <span className="text-base font-bold text-teal-300 font-mono">{bpm} BPM</span>
                </div>
                <div className={`w-10 h-10 rounded-full border flex items-center justify-center transition-all ${
                  isVibrating ? 'bg-teal-500/30 border-teal-400 text-teal-300 animate-bounce' : 'bg-slate-800 border-slate-700 text-slate-500'
                }`}>
                  <Radio className="w-5 h-5" />
                </div>
              </div>

              {/* Status LEDs */}
              <div className="flex space-x-3 mt-3">
                <div className={`w-2 h-2 rounded-full ${isBleConnected ? 'bg-blue-400 animate-pulse' : 'bg-slate-700'}`} title="BLE LED" />
                <div className={`w-2 h-2 rounded-full ${isVibrating ? 'bg-amber-400 animate-ping' : 'bg-slate-700'}`} title="Haptic LED" />
                <div className="w-2 h-2 rounded-full bg-emerald-400" title="Power LED" />
              </div>
            </div>
          </div>

          <span className="text-xs text-slate-400 mt-6 font-mono">
            NeuroBridge SenseAssist Wristband / Tactile Collar Emulator
          </span>
        </div>

        {/* Actuator Controls Panel */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Sensory Pacing & Pattern Controls
            </h3>
            <button
              onClick={handleTestSinglePulse}
              disabled={!actuationDecision.permitted}
              title={actuationDecision.reason}
              className="px-3 py-1.5 rounded-lg bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 border border-teal-500/40 text-xs font-semibold transition-colors flex items-center space-x-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Test Single Pulse</span>
            </button>
          </div>

          {/* BPM Slider */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300 font-medium">Pacing Cadence (BPM)</span>
              <span className="text-teal-400 font-mono font-bold text-sm">{bpm} BPM</span>
            </div>
            <input
              type="range"
              min="40"
              max="140"
              step="2"
              value={bpm}
              onChange={(e) => setBpm(parseInt(e.target.value))}
              className="w-full accent-teal-500"
            />
          </div>

          {/* Intensity Slider */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300 font-medium">Tactile Pulse Intensity (%)</span>
              <span className="text-pink-400 font-mono font-bold text-sm">{intensity}%</span>
            </div>
            <input
              type="range"
              min="20"
              max="80"
              step="5"
              value={intensity}
              onChange={(e) => setIntensity(parseInt(e.target.value))}
              className="w-full accent-pink-500"
            />
          </div>

          {/* Pattern Selector */}
          <div className="space-y-2">
            <span className="text-xs text-slate-300 font-medium block">Tactile Stimulation Pattern</span>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: '1-2-3-4', label: '1-2-3-4 Metronome' },
                { id: 'tap-tap-pause-tap', label: 'Tap-Tap-Pause-Tap' },
                { id: 'ascending_sync', label: 'Ascending Intensity' },
                { id: 'calming_wave', label: 'Calming Sinusoid' },
              ].map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPattern(p.id as any)}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold text-left border transition-all ${
                    pattern === p.id
                      ? 'bg-teal-500/20 text-teal-300 border-teal-500 shadow-sm'
                      : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Continuous Toggle */}
          <button
            onClick={handleTogglePacing}
            disabled={!isPacingActive && !actuationDecision.permitted}
            title={actuationDecision.reason}
            className={`w-full flex items-center justify-center space-x-2 py-3 rounded-xl font-bold text-sm transition-all shadow-lg ${
              isPacingActive
                ? 'bg-red-500 hover:bg-red-600 text-white shadow-red-500/30'
                : 'bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-slate-950 shadow-teal-500/20'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isPacingActive ? <Square className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
            <span>{isPacingActive ? 'Stop Continuous Pacer' : `Start Pacing @ ${bpm} BPM`}</span>
          </button>
          <div className={`rounded-lg border px-3 py-2 text-[11px] font-mono ${
            actuationDecision.permitted
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
              : 'border-amber-500/30 bg-amber-500/10 text-amber-300'
          }`}>
            Safety gate: {actuationDecision.reason}
          </div>
        </div>
      </div>

      {/* Live Hex Serial Monitor Console */}
      <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5 shadow-2xl space-y-3 font-mono">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div className="flex items-center space-x-2">
            <Terminal className="w-4 h-4 text-teal-400" />
            <span className="text-xs font-bold text-slate-300">ESP32 Live Serial Telemetry (115200 Baud)</span>
          </div>
          <span className="text-[10px] text-teal-400">GATT Service: 4fafc201</span>
        </div>

        <div className="h-32 overflow-y-auto space-y-1 text-xs text-teal-400/90 scrollbar-thin">
          {serialLogs.map((log, idx) => (
            <div key={idx} className="flex space-x-2">
              <span className="text-slate-600 select-none">&gt;</span>
              <span className={log.includes('HAPTIC') ? 'text-pink-400 font-bold' : log.includes('BLE') ? 'text-cyan-400' : 'text-slate-300'}>
                {log}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
