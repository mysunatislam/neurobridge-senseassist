import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AudioAnalyzer } from '../src/services/AudioAnalyzer';
import { GeminiService } from '../src/services/GeminiService';

describe('captured microphone audio', () => {
  const originalWindow = globalThis.window;
  const originalNavigator = globalThis.navigator;
  const originalMediaRecorder = globalThis.MediaRecorder;
  const originalRequestAnimationFrame = globalThis.requestAnimationFrame;

  let stoppedTracks: ReturnType<typeof vi.fn>[];
  let recorderPayloads: string[];

  class FakeAudioContext {
    state: AudioContextState = 'running';
    sampleRate = 44_100;

    createMediaStreamSource() {
      return { connect: vi.fn() };
    }

    createAnalyser() {
      return {
        fftSize: 512,
        frequencyBinCount: 256,
        getByteFrequencyData: vi.fn(),
        getFloatTimeDomainData: vi.fn()
      };
    }

    async close() {
      this.state = 'closed';
    }
  }

  class FakeMediaRecorder extends EventTarget {
    static isTypeSupported(type: string) {
      return type === 'audio/webm;codecs=opus';
    }

    state: RecordingState = 'inactive';
    mimeType: string;
    private payload: string;

    constructor(_stream: MediaStream, options?: MediaRecorderOptions) {
      super();
      this.mimeType = options?.mimeType || 'audio/webm';
      this.payload = recorderPayloads.shift() || '';
    }

    start() {
      this.state = 'recording';
    }

    stop() {
      if (this.state === 'inactive') throw new Error('already stopped');
      this.state = 'inactive';
      const dataEvent = new Event('dataavailable') as Event & { data: Blob };
      Object.defineProperty(dataEvent, 'data', {
        value: new Blob([this.payload], { type: this.mimeType })
      });
      this.dispatchEvent(dataEvent);
      this.dispatchEvent(new Event('stop'));
    }
  }

  beforeEach(() => {
    stoppedTracks = [];
    recorderPayloads = [];
    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      value: Object.assign(globalThis, {
        AudioContext: FakeAudioContext,
        webkitAudioContext: FakeAudioContext,
        SpeechRecognition: undefined,
        webkitSpeechRecognition: undefined
      })
    });
    Object.defineProperty(globalThis, 'navigator', {
      configurable: true,
      value: {
        mediaDevices: {
          getUserMedia: vi.fn(async () => {
            const stop = vi.fn();
            stoppedTracks.push(stop);
            return { getTracks: () => [{ stop }] } as unknown as MediaStream;
          })
        }
      }
    });
    Object.defineProperty(globalThis, 'MediaRecorder', {
      configurable: true,
      value: FakeMediaRecorder
    });
    Object.defineProperty(globalThis, 'requestAnimationFrame', {
      configurable: true,
      value: vi.fn(() => 1)
    });
  });

  afterEach(() => {
    Object.defineProperty(globalThis, 'window', { configurable: true, value: originalWindow });
    Object.defineProperty(globalThis, 'navigator', { configurable: true, value: originalNavigator });
    Object.defineProperty(globalThis, 'MediaRecorder', { configurable: true, value: originalMediaRecorder });
    Object.defineProperty(globalThis, 'requestAnimationFrame', { configurable: true, value: originalRequestAnimationFrame });
  });

  it('returns the real MediaRecorder blob and resets chunks between captures', async () => {
    recorderPayloads.push('first-patient-audio', 'second-patient-audio');
    const analyzer = new AudioAnalyzer();

    expect(await analyzer.startRecording()).toBe(true);
    const first = await analyzer.stopRecording();
    expect(first.audioMimeType).toBe('audio/webm;codecs=opus');
    expect(await first.audioBlob?.text()).toBe('first-patient-audio');

    expect(await analyzer.startRecording()).toBe(true);
    const second = await analyzer.stopRecording();
    expect(await second.audioBlob?.text()).toBe('second-patient-audio');
    expect(await second.audioBlob?.text()).not.toContain('first-patient-audio');
    expect(stoppedTracks.every((stop) => stop.mock.calls.length === 1)).toBe(true);
  });

  it('cancels safely and discards the pending encoded audio', async () => {
    recorderPayloads.push('discard-me', 'kept');
    const analyzer = new AudioAnalyzer();
    expect(await analyzer.startRecording()).toBe(true);
    await analyzer.cancelRecording();
    await analyzer.cancelRecording();

    expect(await analyzer.startRecording()).toBe(true);
    const kept = await analyzer.stopRecording();
    expect(await kept.audioBlob?.text()).toBe('kept');
  });
});

describe('Gemini captured-audio transcription', () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    vi.restoreAllMocks();
    Object.defineProperty(globalThis, 'fetch', { configurable: true, value: originalFetch });
  });

  it('sends the exact audio bytes inline and marks the output for clinician review', async () => {
    const service = new GeminiService();
    service.setApiKey('AIzaSy-test-audio-key-123456789');
    const fetchMock = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        candidates: [{ content: { parts: [{ text: 'we went home' }] } }]
      })
    }));
    Object.defineProperty(globalThis, 'fetch', { configurable: true, value: fetchMock });

    const audio = new Blob([new Uint8Array([1, 2, 3, 4])], {
      type: 'audio/webm;codecs=opus'
    });
    const result = await service.transcribeCapturedAudio(audio);

    expect(result).toMatchObject({
      transcript: 'we went home',
      source: 'gemini-audio-transcription',
      model: 'gemini-3.7-flash',
      clinicianReviewRequired: true,
      audioMimeType: 'audio/webm;codecs=opus'
    });
    expect(result.limitations).toContain('review and correct');

    const [url, request] = fetchMock.mock.calls[0];
    expect(String(url)).toContain('/models/gemini-3.7-flash:generateContent');
    const body = JSON.parse(String((request as RequestInit).body));
    expect(body.contents[0].parts[1].inlineData).toEqual({
      mimeType: 'audio/webm;codecs=opus',
      data: 'AQIDBA=='
    });
    expect(body.contents[0].parts[0].text).toContain('may have dysarthria');
    expect(body.contents[0].parts[0].text).toContain('Do not guess from a therapy target phrase');
  });

  it('fails explicitly without a key instead of inventing a transcript', async () => {
    const service = new GeminiService();
    await expect(
      service.transcribeCapturedAudio(new Blob(['audio'], { type: 'audio/webm' }))
    ).rejects.toThrow('requires a configured Google AI Studio API key');
  });

  it('rejects recordings too large for a sub-20 MB inline request', async () => {
    const service = new GeminiService();
    service.setApiKey('AIzaSy-test-audio-key-123456789');
    const oversizedAudio = new Blob([new Uint8Array(16 * 1024 * 1024)], {
      type: 'audio/webm'
    });

    await expect(service.transcribeCapturedAudio(oversizedAudio)).rejects.toThrow('too large');
  });
});
