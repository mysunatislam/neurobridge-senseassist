import { geminiService } from './GeminiService';

export type VoiceAgentState = 'IDLE' | 'LISTENING' | 'THINKING' | 'SPEAKING';

export interface VoiceMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  agenticTag?: string;
}

export interface AshaLiveContext {
  lastSessionResult: any | null;
  currentHrBpm: number | null;
  currentHrvMs: number | null;
  currentBpm: number;
  stressIndex: number | null;
}

export class VoiceAssistantService {
  private state: VoiceAgentState = 'IDLE';
  private recognition: any = null;
  private isVoiceSupported = false;
  private conversationHistory: VoiceMessage[] = [];
  private onStateChangeCallback: ((state: VoiceAgentState) => void) | null = null;
  private onMessageCallback: ((message: VoiceMessage) => void) | null = null;
  private onCommandCallback: ((command: string, params?: any) => void) | null = null;
  private ctx: AshaLiveContext | null = null;
  private liveCaptureLocked = false;

  public injectContext(ctx: AshaLiveContext) {
    this.ctx = ctx;
  }

  public setLiveCaptureLock(locked: boolean) {
    this.liveCaptureLocked = locked;
    if (locked) {
      this.stopListening();
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      this.setState('IDLE');
    }
  }

  constructor() {
    this.initSpeechRecognition();
  }

  private initSpeechRecognition() {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        this.isVoiceSupported = true;
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = false;
        this.recognition.interimResults = false;
        this.recognition.lang = 'en-US';

        this.recognition.onstart = () => {
          this.setState('LISTENING');
        };

        this.recognition.onresult = (event: any) => {
          const spokenText = event.results[0][0].transcript;
          this.handleUserInput(spokenText);
        };

        this.recognition.onerror = (e: any) => {
          console.warn('Speech recognition error:', e.error);
          this.setState('IDLE');
        };

        this.recognition.onend = () => {
          if (this.state === 'LISTENING') {
            this.setState('IDLE');
          }
        };
      }
    }
  }

  public setCallbacks(
    onStateChange: (state: VoiceAgentState) => void,
    onMessage: (message: VoiceMessage) => void,
    onCommand: (command: string, params?: any) => void
  ) {
    this.onStateChangeCallback = onStateChange;
    this.onMessageCallback = onMessage;
    this.onCommandCallback = onCommand;
  }

  public startListening() {
    if (this.liveCaptureLocked) return;
    if (this.recognition && this.state !== 'LISTENING' && this.state !== 'SPEAKING') {
      try {
        this.recognition.start();
      } catch (e) {
        this.setState('LISTENING');
      }
    } else {
      this.setState('IDLE');
      this.addMessage({
        id: 'voice_unavailable_' + Date.now(),
        sender: 'assistant',
        text: 'Browser voice recognition is unavailable. Type a command instead; no simulated voice command was inserted.',
        timestamp: new Date().toLocaleTimeString(),
        agenticTag: 'Input status'
      });
    }
  }

  public stopListening() {
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (e) {}
    }
    this.setState('IDLE');
  }

  /**
   * Processes voice-navigation commands. Therapy audio is captured separately.
   */
  public async handleUserInput(userText: string) {
    if (this.liveCaptureLocked) return;
    const userMsg: VoiceMessage = {
      id: 'msg_' + Date.now(),
      sender: 'user',
      text: userText,
      timestamp: new Date().toLocaleTimeString()
    };
    this.addMessage(userMsg);
    this.setState('THINKING');

    const lower = userText.toLowerCase();

    let responseText = '';
    let agenticTag = 'Prototype Voice Navigator';

    // 1a. An explicitly requested demo may run the labelled synthetic fixture.
    if (lower.includes('synthetic demo') || lower.includes('run demo') || lower.includes('full demo') || lower.includes('showcase')) {
      agenticTag = 'Synthetic Showcase Navigator';
      responseText = 'Running the labelled synthetic showcase through the actual seven-stage software pipeline. This is fixture evidence, not microphone or patient evidence.';
      if (this.onCommandCallback) this.onCommandCallback('RUN_SYNTHETIC_DEMO');
    }
    // 1b. Generic trial language opens live capture and never launches a fixture.
    else if (lower.includes('start') || lower.includes('begin') || lower.includes('trial') || lower.includes('ready')) {
      agenticTag = 'Live Input Navigator';
      responseText = 'I opened the live microphone workflow. Press Record live speech, speak the target, then review the browser transcript before you run the seven stages. I did not start a synthetic preset.';
      if (this.onCommandCallback) this.onCommandCallback('START_TRIAL');
    }
    // 2. Articulatory & Phonemic Pronunciation Analysis — reads actual session data
    else if (lower.includes('pronunciation') || lower.includes('score') || lower.includes('how did i do') || lower.includes('result') || lower.includes('vowel') || lower.includes('dsi')) {
      agenticTag = 'Speech Perception Agent';
      const r = this.ctx?.lastSessionResult;
      if (r?.biomarkers) {
        const wpm = r.biomarkers.speakingRateWpm ?? '?';
        const rhythm = Math.round((r.biomarkers.rhythmStabilityIndex ?? 0) * 100);
        const phonemeErrors = r.phenotype?.phonemeErrors?.length ?? 0;
        const source = r.inputProvenance?.source === 'live-microphone' ? 'live microphone' : 'synthetic fixture';
        responseText = `The latest labelled ${source} result contains a ${wpm} words-per-minute proxy, a ${rhythm}% rhythm proxy, and ${phonemeErrors} configured text substitution${phonemeErrors !== 1 ? 's' : ''}. These are prototype heuristics, not a diagnosis or measured treatment improvement.`;
      } else {
        responseText = 'No session data yet. Run a trial first — press Simulate Trial or Record Live Speech.';
      }
      if (this.onCommandCallback) this.onCommandCallback('ANALYZE_PHONEMES');
    }
    // 3. Dynamic Rhythmic Tempo Modulation — adjusts actual BPM
    else if (lower.includes('slow') || lower.includes('tempo') || lower.includes('cadence') || lower.includes('speed') || lower.includes('faster') || lower.includes('bpm')) {
      agenticTag = 'Sensory-Motor Adaptation Agent';
      const currentBpm = this.ctx?.currentBpm ?? 80;
      const newBpm = lower.includes('faster') ? Math.min(100, currentBpm + 8) : Math.max(60, currentBpm - 8);
      responseText = `Requesting a change from ${currentBpm} to ${newBpm} BPM. The app-level safety and clinician-approval gate will decide whether any physical output is allowed.`;
      if (this.onCommandCallback) this.onCommandCallback('ADJUST_BPM', newBpm);
    }
    // 4. Contactless rPPG Vitals & Autonomic Stress — reads actual PulseSight data
    else if (lower.includes('vital') || lower.includes('heart') || lower.includes('pulse') || lower.includes('stress') || lower.includes('hrv')) {
      agenticTag = 'Digital Twin & Safety Agent';
      const hr = this.ctx?.currentHrBpm;
      const hrv = this.ctx?.currentHrvMs;
      const stress = this.ctx?.stressIndex;
      if (hr) {
        const stressPct = stress !== null && stress !== undefined ? Math.round(stress * 100) : null;
        const hrvStatus = hrv && hrv > 40 ? 'healthy parasympathetic tone' : hrv ? 'slightly elevated sympathetic drive' : 'not yet measured';
        responseText = `PulseSight rPPG reports heart rate ${hr} BPM, HRV RMSSD ${hrv ?? '—'} milliseconds (${hrvStatus}). Autonomic stress index ${stressPct !== null ? stressPct + '%' : 'nominal'}. ${stressPct !== null && stressPct > 60 ? 'Consider a 90-second rest before the next trial.' : 'Autonomic state is suitable for speech practice.'}`;
      } else {
        responseText = 'PulseSight vitals are not yet active. Go to the PulseSight and AAC tab, start the camera, and hold still for 12 seconds to calibrate.';
      }
      if (this.onCommandCallback) this.onCommandCallback('CHECK_VITALS');
    }
    // 5. Fatigue & Vocal Rest Intervention
    else if (lower.includes('tired') || lower.includes('fatigue') || lower.includes('rest') || lower.includes('break') || lower.includes('pause') || lower.includes('stop')) {
      agenticTag = 'Safety & Boundary Agent';
      const requiresRest = this.ctx?.lastSessionResult?.safety?.requiresImmediateRest;
      responseText = requiresRest
        ? 'Safety agent flagged vocal fatigue in the last session. Halting motor pacing now. Take a 90-second recovery: inhale slowly through your nose for 4 counts, hold 4 counts, exhale through pursed lips for 6 counts.'
        : 'Halting motor pacing. Taking a rest interval. Inhale slowly through your nose, relax your larynx, and exhale through pursed lips. I will check in after 90 seconds.';
      if (this.onCommandCallback) this.onCommandCallback('TRIGGER_REST');
    }
    // 6. Explain Agentic Trajectory Rationale — reads actual agent decisions
    else if (lower.includes('why') || lower.includes('explain') || lower.includes('decision') || lower.includes('reason') || lower.includes('agent')) {
      agenticTag = 'Neuro-Cognitive Reasoning Agent';
      const r = this.ctx?.lastSessionResult;
      if (r?.reasoning && r?.intervention) {
        const primary = r.reasoning.primaryTarget ?? 'motor planning';
        const bpm = r.intervention.bpm ?? 80;
        const modality = r.intervention.modality ?? 'combined';
        responseText = `The prototype reasoning stage suggested this practice target: ${primary}. The sensory stage proposed ${bpm} BPM using ${modality}. This is a heuristic recommendation, and physical output still requires the app safety gate.`;
      } else {
        responseText = 'Run a clinical trial first so the 7 agents can generate a reasoning trajectory for me to explain.';
      }
      if (this.onCommandCallback) this.onCommandCallback('EXPLAIN_REASONING');
    }
    // 7. General Clinical Voice Support
    else {
      agenticTag = 'Prototype Voice Navigator';
      responseText = "I'm Asha, the prototype voice navigator. Ask me to open live capture, summarize the latest labelled result, show vitals, or explain the stored trace.";
    }

    await new Promise(r => setTimeout(r, 400));

    const assistantMsg: VoiceMessage = {
      id: 'msg_ai_' + Date.now(),
      sender: 'assistant',
      text: responseText,
      timestamp: new Date().toLocaleTimeString(),
      agenticTag
    };
    this.addMessage(assistantMsg);
    this.speak(responseText);
  }

  public speak(text: string, onComplete?: () => void) {
    if (this.liveCaptureLocked || !text || typeof window === 'undefined' || !('speechSynthesis' in window)) {
      this.setState('IDLE');
      if (onComplete) onComplete();
      return;
    }

    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.rate = 1.0;
      u.pitch = 1.05;

      this.setState('SPEAKING');

      u.onend = () => {
        this.setState('IDLE');
        if (onComplete) onComplete();
      };

      u.onerror = () => {
        this.setState('IDLE');
        if (onComplete) onComplete();
      };

      window.speechSynthesis.speak(u);
    } catch (e) {
      this.setState('IDLE');
      if (onComplete) onComplete();
    }
  }

  private setState(newState: VoiceAgentState) {
    this.state = newState;
    if (this.onStateChangeCallback) {
      this.onStateChangeCallback(newState);
    }
  }

  public getState(): VoiceAgentState {
    return this.state;
  }

  public getHistory(): VoiceMessage[] {
    return this.conversationHistory;
  }

  private addMessage(msg: VoiceMessage) {
    this.conversationHistory.push(msg);
    if (this.onMessageCallback) {
      this.onMessageCallback(msg);
    }
  }
}

export const voiceAssistantService = new VoiceAssistantService();
