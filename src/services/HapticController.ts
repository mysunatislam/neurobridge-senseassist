import type { ClinicianApproval } from '../agents/types';
import {
  evaluateActuationGate,
  isApprovalBoundToContext,
  type ActuationGateDecision,
  type ActuationSafetyContext
} from './ActuationSafetyGate';

export interface HapticPacket {
  bpm: number;
  pattern: '1-2-3-4' | 'tap-tap-pause-tap' | 'ascending_sync' | 'calming_wave';
  intensity: number; // 0 - 100; clamped to 80 before output
  durationMs: number;
  active: boolean;
  transducerType?: 'ERM_DISC' | 'LRA_LINEAR';
}

type PulseListener = (beatIndex: number, intensity: number, jitterMs: number) => void;
type GateListener = (decision: ActuationGateDecision) => void;

export class HapticController {
  private audioCtx: AudioContext | null = null;
  private isMetronomePlaying = false;
  private metronomeTimer: ReturnType<typeof setTimeout> | null = null;
  private bleDevice: any = null;
  private bleCharacteristic: any = null;
  private onHapticPulseListeners: PulseListener[] = [];
  private onGateDecisionListeners: GateListener[] = [];
  private safetyContext: ActuationSafetyContext | null = null;
  private clinicianApproval: ClinicianApproval | null = null;
  private activePacket: HapticPacket | null = null;

  // Phase-Locked Jitter Calibration State
  private expectedNextBeatTime = 0;
  private measuredJitterMs = 0.8;

  private readonly handleBleDisconnect = () => {
    this.stopPacing();
    this.bleCharacteristic = null;
    this.bleDevice = null;
  };

  private initAudio() {
    if (typeof window === 'undefined') return;
    if (!this.audioCtx) {
      this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.audioCtx.state === 'suspended') {
      void this.audioCtx.resume();
    }
  }

  public addPulseListener(listener: PulseListener) {
    this.onHapticPulseListeners.push(listener);
  }

  public removePulseListener(listener: PulseListener) {
    this.onHapticPulseListeners = this.onHapticPulseListeners.filter(l => l !== listener);
  }

  public addGateDecisionListener(listener: GateListener) {
    this.onGateDecisionListeners.push(listener);
  }

  public removeGateDecisionListener(listener: GateListener) {
    this.onGateDecisionListeners = this.onGateDecisionListeners.filter(l => l !== listener);
  }

  public setSafetyContext(context: ActuationSafetyContext | null) {
    // A new/cleared result invalidates any running actuator before the gate is replaced.
    this.stopPacing();
    this.safetyContext = context;
    if (!isApprovalBoundToContext(this.clinicianApproval, context)) {
      this.clinicianApproval = null;
    }
    this.emitGateDecision();
  }

  public setClinicianApproval(approval: ClinicianApproval | null): boolean {
    const accepted = isApprovalBoundToContext(approval, this.safetyContext);
    this.clinicianApproval = accepted
      ? approval
      : null;
    this.emitGateDecision();
    return approval === null || accepted;
  }

  public getActuationDecision(): ActuationGateDecision {
    return evaluateActuationGate(this.safetyContext, this.clinicianApproval);
  }

  public isPacing(): boolean {
    return this.isMetronomePlaying;
  }

  private emitGateDecision(): ActuationGateDecision {
    const decision = this.getActuationDecision();
    this.onGateDecisionListeners.forEach(listener => listener(decision));
    return decision;
  }

  /**
   * Triggers one calibrated pulse. This public entry point is independently
   * gated, including pulses invoked while an already-running cadence is active.
   */
  public triggerPulse(
    intensity = 60,
    durationMs = 120,
    frequency = 55,
    transducerType: 'ERM_DISC' | 'LRA_LINEAR' = 'ERM_DISC',
    pacing?: Pick<HapticPacket, 'bpm' | 'pattern'>
  ): ActuationGateDecision {
    const decision = this.emitGateDecision();
    if (!decision.permitted) {
      this.stopPacing();
      return decision;
    }

    this.initAudio();

    // Independent safety clamp: never exceed 80% duty cycle.
    const safeIntensity = Math.max(0, Math.min(80, intensity));
    const safeDurationMs = Math.max(20, Math.min(500, durationMs));

    if (this.audioCtx) {
      try {
        const now = this.audioCtx.currentTime;
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();

        const targetFreq = transducerType === 'LRA_LINEAR' ? 175 : frequency;
        osc.type = transducerType === 'LRA_LINEAR' ? 'triangle' : 'sine';
        osc.frequency.setValueAtTime(targetFreq, now);
        osc.frequency.exponentialRampToValueAtTime(35, now + (safeDurationMs / 1000));

        const targetGain = (safeIntensity / 100) * 0.85;
        gain.gain.setValueAtTime(0.001, now);
        gain.gain.exponentialRampToValueAtTime(targetGain, now + 0.012);
        gain.gain.exponentialRampToValueAtTime(0.001, now + (safeDurationMs / 1000));

        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start();
        osc.stop(now + (safeDurationMs / 1000));
      } catch (error) {
        console.warn('Audio tactile rumble pulse warning:', error);
      }
    }

    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(Math.min(safeDurationMs, 100));
      } catch {}
    }

    const packetSource = this.activePacket ?? {
      bpm: pacing?.bpm ?? 80,
      pattern: pacing?.pattern ?? '1-2-3-4',
      intensity: safeIntensity,
      durationMs: safeDurationMs,
      active: true,
      transducerType
    };

    void this.sendBlePacket({
      ...packetSource,
      bpm: this.clampBpm(pacing?.bpm ?? packetSource.bpm),
      pattern: pacing?.pattern ?? packetSource.pattern,
      intensity: safeIntensity,
      durationMs: safeDurationMs,
      active: true,
      transducerType
    });

    return decision;
  }

  /** Starts a phase-locked cadence only after the active session is authorized. */
  public startPacing(packet: HapticPacket): ActuationGateDecision {
    const decision = this.emitGateDecision();
    this.stopPacing();
    if (!decision.permitted) return decision;

    const safePacket: HapticPacket = {
      ...packet,
      bpm: this.clampBpm(packet.bpm),
      intensity: Math.max(0, Math.min(80, packet.intensity)),
      durationMs: Math.max(20, Math.min(500, packet.durationMs)),
      active: true
    };

    this.activePacket = safePacket;
    this.isMetronomePlaying = true;
    this.initAudio();

    const targetIntervalMs = (60 / safePacket.bpm) * 1000;
    let step = 0;
    this.expectedNextBeatTime = performance.now();

    const playBeat = () => {
      if (!this.isMetronomePlaying || !this.activePacket) return;

      const currentDecision = this.getActuationDecision();
      if (!currentDecision.permitted) {
        this.emitGateDecision();
        this.stopPacing();
        return;
      }

      const currentTime = performance.now();
      this.measuredJitterMs = Number(Math.abs(currentTime - this.expectedNextBeatTime).toFixed(2));

      let isPulseActive = true;
      let pulseIntensity = safePacket.intensity;

      if (safePacket.pattern === 'tap-tap-pause-tap') {
        const patternStep = step % 4;
        if (patternStep === 2) {
          isPulseActive = false;
        } else {
          pulseIntensity = patternStep === 0 ? safePacket.intensity * 1.1 : safePacket.intensity * 0.85;
        }
      } else if (safePacket.pattern === 'ascending_sync') {
        const patternStep = step % 4;
        pulseIntensity = safePacket.intensity * (0.5 + patternStep * 0.2);
      } else if (safePacket.pattern === 'calming_wave') {
        const wave = Math.sin((step % 8) * (Math.PI / 4));
        pulseIntensity = Math.round(safePacket.intensity * (0.6 + wave * 0.35));
      }

      pulseIntensity = Math.max(0, Math.min(80, pulseIntensity));
      if (isPulseActive) {
        this.triggerPulse(
          pulseIntensity,
          safePacket.durationMs,
          step % 4 === 0 ? 75 : 55,
          safePacket.transducerType || 'ERM_DISC',
          { bpm: safePacket.bpm, pattern: safePacket.pattern }
        );
        this.playMetronomeClick(step % 4 === 0);
      } else {
        // Preserve the hardware watchdog even on a deliberately silent beat.
        void this.sendBlePacket({ ...safePacket, intensity: 0, active: true });
      }

      this.onHapticPulseListeners.forEach(listener =>
        listener(step % 4, isPulseActive ? pulseIntensity : 0, this.measuredJitterMs)
      );

      step++;
      this.expectedNextBeatTime += targetIntervalMs;
      // Schedule against the absolute phase target; the previous formula added
      // nearly two intervals before the first follow-up beat.
      const nextDelayMs = Math.max(10, this.expectedNextBeatTime - performance.now());
      this.metronomeTimer = setTimeout(playBeat, nextDelayMs);
    };

    playBeat();
    return decision;
  }

  public stopPacing() {
    const lastPacket = this.activePacket;
    this.isMetronomePlaying = false;
    this.activePacket = null;
    if (this.metronomeTimer) {
      clearTimeout(this.metronomeTimer);
      this.metronomeTimer = null;
    }
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(0);
      } catch {}
    }

    void this.sendBlePacket({
      bpm: lastPacket?.bpm ?? 40,
      pattern: lastPacket?.pattern ?? '1-2-3-4',
      intensity: 0,
      durationMs: 0,
      active: false,
      transducerType: lastPacket?.transducerType
    });
  }

  public getMeasuredJitterMs(): number {
    return this.measuredJitterMs;
  }

  private clampBpm(bpm: number): number {
    return Math.max(40, Math.min(120, Math.round(bpm)));
  }

  private playMetronomeClick(isDownbeat: boolean) {
    if (!this.audioCtx) return;
    try {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(isDownbeat ? 880 : 580, this.audioCtx.currentTime);
      gain.gain.setValueAtTime(0.2, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.04);
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start();
      osc.stop(this.audioCtx.currentTime + 0.045);
    } catch {}
  }

  /** Connects to real ESP32 BLE hardware via Web Bluetooth. */
  public async connectBleDevice(): Promise<{ success: boolean; deviceName?: string; error?: string }> {
    if (typeof navigator === 'undefined' || !(navigator as any).bluetooth) {
      return { success: false, error: 'Web Bluetooth is not supported on this browser (use Chrome or Edge).' };
    }

    try {
      const device = await (navigator as any).bluetooth.requestDevice({
        filters: [{ namePrefix: 'NeuroBridge' }],
        optionalServices: ['4fafc201-1fb5-459e-8fcc-c5c9c331914b']
      });
      const server = await device.gatt.connect();
      const service = await server.getPrimaryService('4fafc201-1fb5-459e-8fcc-c5c9c331914b');
      this.bleCharacteristic = await service.getCharacteristic('beb5483e-36e1-4688-b7f5-ea07361b26a8');
      this.bleDevice = device;
      device.addEventListener?.('gattserverdisconnected', this.handleBleDisconnect);
      return { success: true, deviceName: device.name || 'NeuroBridge ESP32' };
    } catch (error: any) {
      return { success: false, error: error.message || 'Bluetooth connection cancelled.' };
    }
  }

  private async sendBlePacket(packet: HapticPacket) {
    if (!this.bleCharacteristic) return;
    try {
      const patternCode = packet.pattern === '1-2-3-4'
        ? 1
        : packet.pattern === 'tap-tap-pause-tap'
          ? 2
          : packet.pattern === 'ascending_sync'
            ? 3
            : 4;
      const payload = new Uint8Array([
        this.clampBpm(packet.bpm),
        Math.max(0, Math.min(80, Math.round(packet.intensity))),
        patternCode,
        packet.active ? 1 : 0
      ]);
      await this.bleCharacteristic.writeValue(payload);
    } catch (error) {
      console.warn('BLE Packet transmission error:', error);
    }
  }
}
