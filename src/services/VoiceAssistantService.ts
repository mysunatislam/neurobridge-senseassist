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

  public injectContext(ctx: AshaLiveContext) {
    this.ctx = ctx;
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
    if (this.recognition && this.state !== 'LISTENING' && this.state !== 'SPEAKING') {
      try {
        this.recognition.start();
      } catch (e) {
        this.setState('LISTENING');
      }
    } else {
      this.setState('LISTENING');
      setTimeout(() => {
        this.handleUserInput('How is my pronunciation and motor cadence?');
      }, 1800);
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
   * Processes hands-free voice inputs and dispatches clinical commands to the 7-Agent System.
   */
  public async handleUserInput(userText: string) {
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
    let agenticTag = 'Clinical Voice Co-Pilot';

    // 1. Rhythmic Trial Initialization & Metronome Cueing
    if (lower.includes('start') || lower.includes('begin') || lower.includes('trial') || lower.includes('ready')) {
      agenticTag = 'Sensory-Motor Adaptation Agent';
      const bpm = this.ctx?.currentBpm ?? 80;
      responseText = `Starting clinical trial. Synchronizing ${bpm} BPM haptic pacer. 1… 2… 3… running 7 autonomous agents now. Results will appear in the Live Therapy Room.`;
      if (this.onCommandCallback) this.onCommandCallback('START_TRIAL');
    }
    // 2. Articulatory & Phonemic Pronunciation Analysis — reads actual session data
    else if (lower.includes('pronunciation') || lower.includes('score') || lower.includes('how did i do') || lower.includes('result') || lower.includes('vowel') || lower.includes('dsi')) {
      agenticTag = 'Speech Perception Agent';
      const r = this.ctx?.lastSessionResult;
      if (r?.biomarkers) {
        const wpm = r.biomarkers.speakingRateWpm ?? '?';
        const rhythm = Math.round((r.biomarkers.rhythmStabilityIndex ?? 0) * 100);
        const severity = r.phenotype?.severity ?? 'unknown';
        const phonemeErrors = r.phenotype?.phonemeErrors?.length ?? 0;
        const wpmDelta = r.progress?.wpmImprovementPercent;
        responseText = `Your last trial: ${wpm} words per minute, rhythm stability ${rhythm}%, classified as ${severity}. ${phonemeErrors} phoneme error${phonemeErrors !== 1 ? 's' : ''} detected. ${wpmDelta ? `That is ${wpmDelta}% faster than baseline.` : ''} ${wpm < 80 ? 'Focus on your plosive consonants — add more lip pressure on B and P sounds.' : 'Strong fluency improvement. Keep building on this.'}`;
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
      responseText = `Recalibrating haptic pacer from ${currentBpm} to ${newBpm} BPM. Motor synchronization updating — this gives your articulators ${lower.includes('slow') ? 'more' : 'less'} time per phoneme.`;
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
        responseText = `The Neuro-Cognitive Reasoning Agent identified the primary deficit as ${primary}. The Sensory-Motor Agent responded by setting haptic pacing to ${bpm} BPM using ${modality} stimulation to synchronize your motor speech cortex before each utterance.`;
      } else {
        responseText = 'Run a clinical trial first so the 7 agents can generate a reasoning trajectory for me to explain.';
      }
      if (this.onCommandCallback) this.onCommandCallback('EXPLAIN_REASONING');
    }
    // 7. General Clinical Voice Support
    else {
      agenticTag = 'Clinical Voice Co-Pilot';
      responseText = "I'm Asha, your hands-free Speech Co-Pilot. Ask me: 'How did I do?', 'Check my vitals', 'Slow down the pacer', 'Why did you do that?', or say 'Start trial' to begin.";
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
    if (!text || typeof window === 'undefined' || !('speechSynthesis' in window)) {
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
