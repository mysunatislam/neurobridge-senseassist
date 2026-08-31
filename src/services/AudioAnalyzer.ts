export interface AudioAnalysisResult {
  transcript: string;
  durationSec: number;
  pauses: Array<{ start: number; duration: number }>;
  pitchSamples: number[];
  rmsDb: number;
  waveformSamples: number[];
  signalSource: 'live-microphone' | 'synthetic-preset';
  transcriptSource: 'browser-speech-recognition' | 'gemini-audio-transcription' | 'synthetic-fixture' | 'unavailable';
  recognitionWarning?: string;
  /** The exact encoded microphone recording produced by MediaRecorder. */
  audioBlob?: Blob;
  /** The recorder-provided MIME type for audioBlob (for example audio/webm;codecs=opus). */
  audioMimeType?: string;
  /** Explains why encoded audio is absent while acoustic analysis may still be available. */
  audioCaptureWarning?: string;
}

export class AudioAnalyzer {
  private audioCtx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private micStream: MediaStream | null = null;
  private recognition: any = null;
  private mediaRecorder: MediaRecorder | null = null;
  private mediaRecorderChunks: Blob[] = [];
  private mediaRecorderMimeType = '';
  private audioCaptureWarning: string | null = null;
  private isRecording = false;
  private recordedChunks: Float32Array[] = [];
  private startTime = 0;
  private pauseEvents: Array<{ start: number; duration: number }> = [];
  private lastSoundTime = 0;
  private accumulatedTranscript = '';
  private interimTranscript = '';
  private recognitionWarning: string | null = null;
  private capturedPitchHz: number[] = [];
  private capturedRmsDb: number[] = [];
  private latestWaveformSamples: number[] = [];
  private lastFeatureSampleTime = 0;
  private microphoneAvailable = false;

  public async startRecording(
    onDataUpdate?: (frequencyData: Uint8Array, rmsDb: number) => void,
    languageCode = 'en-US'
  ): Promise<boolean> {
    // Finish any abandoned capture before clearing its callbacks/chunks. This
    // prevents a late MediaRecorder dataavailable event from contaminating the
    // next patient's recording.
    this.stopSpeechRecognition(true);
    await this.releaseCaptureResources();

    // Reset all per-capture state before requesting permission so a denied second
    // recording can never leak transcript/features from the previous one.
    this.isRecording = false;
    this.startTime = 0;
    this.pauseEvents = [];
    this.accumulatedTranscript = '';
    this.interimTranscript = '';
    this.recognitionWarning = null;
    this.recordedChunks = [];
    this.capturedPitchHz = [];
    this.capturedRmsDb = [];
    this.latestWaveformSamples = [];
    this.lastFeatureSampleTime = 0;
    this.microphoneAvailable = false;
    this.recognition = null;
    this.mediaRecorder = null;
    this.mediaRecorderChunks = [];
    this.mediaRecorderMimeType = '';
    this.audioCaptureWarning = null;

    try {
      this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const source = this.audioCtx.createMediaStreamSource(this.micStream);
      this.analyser = this.audioCtx.createAnalyser();
      this.analyser.fftSize = 512;
      source.connect(this.analyser);

      this.isRecording = true;
      this.startTime = performance.now();
      this.lastSoundTime = this.startTime;
      this.microphoneAvailable = true;

      this.startMediaRecorder(this.micStream);

      // Initialize Speech Recognition if supported
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = languageCode;

        this.recognition.onresult = (event: any) => {
          let interim = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              this.accumulatedTranscript += event.results[i][0].transcript + ' ';
            } else {
              interim += event.results[i][0].transcript;
            }
          }
          this.interimTranscript = interim.trim();
        };

        this.recognition.onerror = (e: any) => {
          console.warn('Speech recognition notice:', e.error);
          this.recognitionWarning = `Browser speech recognition: ${String(e.error || 'unknown error')}`;
        };

        try {
          this.recognition.start();
        } catch (e) {
          // Already started or blocked
        }
      }

      // Start audio analysis loop
      const bufferLength = this.analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      const timeDomainData = new Float32Array(this.analyser.fftSize);

      const checkAudio = () => {
        if (!this.isRecording || !this.analyser) return;

        this.analyser.getByteFrequencyData(dataArray);
        this.analyser.getFloatTimeDomainData(timeDomainData);

        // Compute RMS from the captured time-domain waveform, not FFT display bins.
        let sum = 0;
        for (let i = 0; i < timeDomainData.length; i++) {
          sum += timeDomainData[i] * timeDomainData[i];
        }
        const rms = Math.sqrt(sum / timeDomainData.length);
        const rmsDb = rms > 0.001 ? Math.max(-60, Math.round(20 * Math.log10(rms))) : -60;

        const now = performance.now();
        if (now - this.lastFeatureSampleTime >= 100) {
          this.lastFeatureSampleTime = now;
          this.capturedRmsDb.push(rmsDb);
          const pitchHz = this.estimatePitchHz(timeDomainData, this.audioCtx?.sampleRate || 44100);
          if (pitchHz !== null) this.capturedPitchHz.push(pitchHz);
          this.latestWaveformSamples = this.downsampleWaveform(timeDomainData, 40);
        }

        // Detect silence threshold (-45 dB) for pauses longer than 350ms
        if (rmsDb > -42) {
          if (now - this.lastSoundTime > 350) {
            const pauseDuration = (now - this.lastSoundTime) / 1000;
            const pauseStart = (this.lastSoundTime - this.startTime) / 1000;
            if (pauseStart > 0.2) {
              this.pauseEvents.push({ start: Number(pauseStart.toFixed(2)), duration: Number(pauseDuration.toFixed(2)) });
            }
          }
          this.lastSoundTime = now;
        }

        if (onDataUpdate) {
          onDataUpdate(dataArray, rmsDb);
        }

        requestAnimationFrame(checkAudio);
      };

      requestAnimationFrame(checkAudio);
      return true;
    } catch (err) {
      console.warn('Microphone access unavailable or denied:', err);
      this.isRecording = false;
      this.microphoneAvailable = false;
      this.recognitionWarning = err instanceof Error ? err.message : String(err);
      this.stopSpeechRecognition(true);
      await this.releaseCaptureResources();
      return false;
    }
  }

  public async stopRecording(): Promise<AudioAnalysisResult> {
    this.isRecording = false;
    const durationSec = this.startTime > 0
      ? Number(((performance.now() - this.startTime) / 1000).toFixed(2))
      : 0;

    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (e) {}
      // Give the browser a brief chance to promote the latest interim result to final.
      await new Promise((resolve) => setTimeout(resolve, 180));
    }

    // MediaRecorder emits its final dataavailable event before stop. Await that
    // event before stopping the stream so the returned Blob is the real capture.
    await this.stopMediaRecorderSafely();

    const audioMimeType = this.mediaRecorderMimeType
      || this.mediaRecorderChunks.find((chunk) => Boolean(chunk.type))?.type
      || '';
    const audioBlob = this.mediaRecorderChunks.length > 0
      ? new Blob(this.mediaRecorderChunks, audioMimeType ? { type: audioMimeType } : undefined)
      : undefined;

    await this.releaseCaptureResources();

    const finalText = this.accumulatedTranscript.trim();
    const interimText = this.interimTranscript.trim();
    const transcript = [finalText, interimText].filter(Boolean).join(' ').trim();

    const pitchSamples = this.microphoneAvailable ? [...this.capturedPitchHz] : [];
    const waveformSamples = this.microphoneAvailable ? [...this.latestWaveformSamples] : [];
    const meanRmsDb = this.capturedRmsDb.length > 0
      ? Math.round(this.capturedRmsDb.reduce((sum, value) => sum + value, 0) / this.capturedRmsDb.length)
      : -60;

    const pauses = [...this.pauseEvents];

    return {
      transcript,
      durationSec: Math.max(durationSec, 0.01),
      pauses,
      pitchSamples,
      rmsDb: meanRmsDb,
      waveformSamples,
      signalSource: 'live-microphone',
      transcriptSource: transcript ? 'browser-speech-recognition' : 'unavailable',
      recognitionWarning: this.recognitionWarning || undefined,
      audioBlob,
      audioMimeType: audioBlob && audioMimeType ? audioMimeType : undefined,
      audioCaptureWarning: this.audioCaptureWarning || undefined
    };
  }

  /**
   * Abandons an in-progress capture and releases every browser resource without
   * returning or retaining patient audio. Safe to call repeatedly (for example
   * during React unmount or a patient/context switch).
   */
  public async cancelRecording(): Promise<void> {
    this.isRecording = false;

    if (this.recognition) {
      this.stopSpeechRecognition(true);
    }

    await this.releaseCaptureResources();
    this.mediaRecorderChunks = [];
    this.mediaRecorderMimeType = '';
    this.audioCaptureWarning = null;
    this.accumulatedTranscript = '';
    this.interimTranscript = '';
  }

  public simulatePresetCase(preset: {
    transcript: string;
    durationSec: number;
    pauses: Array<{ start: number; duration: number }>;
    pitchSamples: number[];
    rmsDb: number;
  }): AudioAnalysisResult {
    return {
      transcript: preset.transcript,
      durationSec: preset.durationSec,
      pauses: preset.pauses,
      pitchSamples: preset.pitchSamples,
      rmsDb: preset.rmsDb,
      waveformSamples: this.createDeterministicWaveform(preset.pitchSamples),
      signalSource: 'synthetic-preset',
      transcriptSource: 'synthetic-fixture'
    };
  }

  private estimatePitchHz(samples: Float32Array, sampleRate: number): number | null {
    let energy = 0;
    for (let i = 0; i < samples.length; i++) energy += samples[i] * samples[i];
    const rms = Math.sqrt(energy / samples.length);
    if (rms < 0.01) return null;

    const minLag = Math.max(1, Math.floor(sampleRate / 350));
    const maxLag = Math.min(samples.length - 2, Math.floor(sampleRate / 70));
    let bestLag = 0;
    let bestCorrelation = 0;

    for (let lag = minLag; lag <= maxLag; lag++) {
      let correlation = 0;
      let normA = 0;
      let normB = 0;
      for (let i = 0; i < samples.length - lag; i++) {
        const a = samples[i];
        const b = samples[i + lag];
        correlation += a * b;
        normA += a * a;
        normB += b * b;
      }
      const normalized = correlation / Math.sqrt(Math.max(normA * normB, 1e-12));
      if (normalized > bestCorrelation) {
        bestCorrelation = normalized;
        bestLag = lag;
      }
    }

    if (bestLag === 0 || bestCorrelation < 0.35) return null;
    return Number((sampleRate / bestLag).toFixed(1));
  }

  private downsampleWaveform(samples: Float32Array, targetLength: number): number[] {
    const step = Math.max(1, Math.floor(samples.length / targetLength));
    const result: number[] = [];
    for (let i = 0; i < samples.length && result.length < targetLength; i += step) {
      result.push(Number(samples[i].toFixed(4)));
    }
    return result;
  }

  private createDeterministicWaveform(pitchSamples: number[]): number[] {
    const meanPitch = pitchSamples.length > 0
      ? pitchSamples.reduce((sum, value) => sum + value, 0) / pitchSamples.length
      : 125;
    return Array.from({ length: 40 }, (_, index) =>
      Number((Math.sin(index * (meanPitch / 500)) * 0.55).toFixed(4))
    );
  }

  private startMediaRecorder(stream: MediaStream): void {
    if (typeof MediaRecorder === 'undefined') {
      this.audioCaptureWarning = 'This browser does not support MediaRecorder, so no encoded audio is available for optional cloud transcription.';
      return;
    }

    try {
      const preferredTypes = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/ogg;codecs=opus',
        'audio/mp4'
      ];
      const supportedType = typeof MediaRecorder.isTypeSupported === 'function'
        ? preferredTypes.find((type) => MediaRecorder.isTypeSupported(type))
        : undefined;
      const recorder = supportedType
        ? new MediaRecorder(stream, { mimeType: supportedType })
        : new MediaRecorder(stream);

      this.mediaRecorder = recorder;
      this.mediaRecorderMimeType = recorder.mimeType || supportedType || '';
      recorder.addEventListener('dataavailable', (event: BlobEvent) => {
        if (event.data && event.data.size > 0) {
          this.mediaRecorderChunks.push(event.data);
        }
      });
      recorder.addEventListener('error', (event: Event) => {
        const recorderError = (event as Event & { error?: DOMException }).error;
        this.audioCaptureWarning = `Encoded microphone capture failed: ${recorderError?.message || 'MediaRecorder error'}`;
      });
      recorder.start();
    } catch (error) {
      this.mediaRecorder = null;
      this.audioCaptureWarning = `Encoded microphone capture is unavailable: ${error instanceof Error ? error.message : String(error)}`;
    }
  }

  private async stopMediaRecorderSafely(): Promise<void> {
    const recorder = this.mediaRecorder;
    if (!recorder || recorder.state === 'inactive') return;

    await new Promise<void>((resolve) => {
      let settled = false;
      const finish = () => {
        if (settled) return;
        settled = true;
        clearTimeout(timeoutId);
        resolve();
      };
      const timeoutId = setTimeout(finish, 1500);
      recorder.addEventListener('stop', finish, { once: true });
      recorder.addEventListener('error', finish, { once: true });

      try {
        recorder.stop();
      } catch (error) {
        this.audioCaptureWarning = `Encoded microphone capture could not be finalized: ${error instanceof Error ? error.message : String(error)}`;
        finish();
      }
    });
  }

  private async releaseCaptureResources(): Promise<void> {
    await this.stopMediaRecorderSafely();

    if (this.micStream) {
      this.micStream.getTracks().forEach((track) => track.stop());
    }
    if (this.audioCtx && this.audioCtx.state !== 'closed') {
      try {
        await this.audioCtx.close();
      } catch (e) {}
    }

    this.micStream = null;
    this.audioCtx = null;
    this.analyser = null;
    this.mediaRecorder = null;
    this.recognition = null;
  }

  private stopSpeechRecognition(preferAbort: boolean): void {
    if (!this.recognition) return;

    try {
      if (preferAbort && typeof this.recognition.abort === 'function') {
        this.recognition.abort();
      } else if (typeof this.recognition.stop === 'function') {
        this.recognition.stop();
      }
    } catch (error) {
      // Recognition may already be inactive. Resource cleanup must remain
      // idempotent during unmounts and rapid patient/context changes.
    }
  }
}
