export interface AacGestureItem {
  id: string;
  name: string;
  phrase: string;
  icon: string;
  dwellMs: number;
  probability: number; // 0.0 - 1.0
}

export interface AacTriggerEvent {
  gestureName: string;
  spokenPhrase: string;
  icon: string;
  timestamp: string;
}

export class AacGestureService {
  private audioCtx: AudioContext | null = null;
  private gestures: AacGestureItem[] = [
    { id: 'g_rest', name: 'Rest', phrase: '', icon: '🖐️', dwellMs: 500, probability: 0.85 },
    { id: 'g_yes', name: 'Yes', phrase: 'Yes, I understand.', icon: '👍', dwellMs: 700, probability: 0.05 },
    { id: 'g_no', name: 'No', phrase: 'No, let us slow down.', icon: '🙅', dwellMs: 700, probability: 0.03 },
    { id: 'g_water', name: 'Water', phrase: 'I need some water, please.', icon: '💧', dwellMs: 800, probability: 0.03 },
    { id: 'g_nurse', name: 'Help / Nurse', phrase: 'Please call the clinician or caregiver.', icon: '🔔', dwellMs: 900, probability: 0.02 },
    { id: 'g_urgent', name: 'Break / Rest', phrase: 'I need a short 90-second rest break.', icon: '⚠️', dwellMs: 1200, probability: 0.02 }
  ];

  private activeCandidateIdx: number | null = null;
  private candidateStartTime = 0;
  private dwellProgress = 0; // 0.0 to 1.0
  private lastTriggeredTime = 0;
  private onTriggerCallback: ((event: AacTriggerEvent) => void) | null = null;
  private onDwellProgressCallback: ((progress: number, gesture: AacGestureItem | null) => void) | null = null;
  private onProbabilitiesCallback: ((gestures: AacGestureItem[]) => void) | null = null;

  public setCallbacks(
    onTrigger: (event: AacTriggerEvent) => void,
    onProgress: (progress: number, gesture: AacGestureItem | null) => void,
    onProbs: (gestures: AacGestureItem[]) => void
  ) {
    this.onTriggerCallback = onTrigger;
    this.onDwellProgressCallback = onProgress;
    this.onProbabilitiesCallback = onProbs;
  }

  public getGestures(): AacGestureItem[] {
    return this.gestures;
  }

  /**
   * Processes hand coordinates and simulated gesture activations with dwell-time confirmation.
   */
  public processHandFrame(handX: number, handY: number, phase: number) {
    const now = performance.now();
    if (now - this.lastTriggeredTime < 1800) {
      return; // Lockout cooldown after speaking
    }

    // Dynamic gesture simulation based on kinetic hand movement phase
    const cycle = Math.floor((phase * 0.2) % this.gestures.length);
    const targetGestureIdx = Math.sin(phase * 0.6) > 0.7 ? cycle : 0; // 0 is Rest

    // Update probabilities
    this.gestures = this.gestures.map((g, idx) => ({
      ...g,
      probability: idx === targetGestureIdx ? 0.88 : Number((0.12 / (this.gestures.length - 1)).toFixed(2))
    }));

    if (this.onProbabilitiesCallback) {
      this.onProbabilitiesCallback(this.gestures);
    }

    // State Machine logic
    if (targetGestureIdx === 0) {
      // Rest
      this.activeCandidateIdx = null;
      this.dwellProgress = 0;
      if (this.onDwellProgressCallback) this.onDwellProgressCallback(0, null);
      return;
    }

    const candidate = this.gestures[targetGestureIdx];

    if (this.activeCandidateIdx !== targetGestureIdx) {
      this.activeCandidateIdx = targetGestureIdx;
      this.candidateStartTime = now;
      this.dwellProgress = 0;
    } else {
      const elapsed = now - this.candidateStartTime;
      this.dwellProgress = Math.min(1.0, elapsed / candidate.dwellMs);

      if (this.onDwellProgressCallback) {
        this.onDwellProgressCallback(this.dwellProgress, candidate);
      }

      if (this.dwellProgress >= 1.0) {
        this.triggerGesture(candidate);
      }
    }
  }

  public triggerGesture(gesture: AacGestureItem) {
    this.lastTriggeredTime = performance.now();
    this.activeCandidateIdx = null;
    this.dwellProgress = 0;

    if (this.onDwellProgressCallback) {
      this.onDwellProgressCallback(0, null);
    }

    this.playChime();
    this.speakPhrase(gesture.phrase);

    if (this.onTriggerCallback) {
      this.onTriggerCallback({
        gestureName: gesture.name,
        spokenPhrase: gesture.phrase,
        icon: gesture.icon,
        timestamp: new Date().toLocaleTimeString()
      });
    }
  }

  private playChime() {
    try {
      if (!this.audioCtx) {
        this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      if (this.audioCtx.state === 'suspended') this.audioCtx.resume();

      const o = this.audioCtx.createOscillator();
      const g = this.audioCtx.createGain();

      o.type = 'sine';
      o.frequency.setValueAtTime(880, this.audioCtx.currentTime);
      o.frequency.exponentialRampToValueAtTime(1320, this.audioCtx.currentTime + 0.15);

      g.gain.setValueAtTime(0.001, this.audioCtx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.25, this.audioCtx.currentTime + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.4);

      o.connect(g);
      g.connect(this.audioCtx.destination);

      o.start();
      o.stop(this.audioCtx.currentTime + 0.4);
    } catch (e) {}
  }

  public speakPhrase(text: string) {
    if (!text || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.rate = 0.95;
      u.pitch = 1.05;
      window.speechSynthesis.speak(u);
    } catch (e) {}
  }
}

export const aacGestureService = new AacGestureService();
