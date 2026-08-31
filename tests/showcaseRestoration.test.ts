import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { VoiceAssistantService } from '../src/services/VoiceAssistantService';

afterEach(() => {
  vi.useRealTimers();
});

describe('showcase restoration', () => {
  it('keeps the restored showcase controls and multimodal studio in the session UI', () => {
    const componentPath = fileURLToPath(new URL('../src/components/LiveTherapySession.tsx', import.meta.url));
    const source = readFileSync(componentPath, 'utf8');

    expect(source).toContain('Magic Demo · Storyboard only');
    expect(source).toContain('Full Demo · Scene + 7 stages');
    expect(source).toContain('Quick Agent Run');
    expect(source).toContain('Seven-stage pipeline architecture');
    expect(source).toContain('Vision, PulseSight & FingerSpeak Studio');
    expect(source).toContain('SCRIPTED SYNTHETIC DEMO');
    expect(source).toContain('Replay the actual captured speech');
    expect(source).toContain('Request Gemini candidate transcript');
  });

  it('routes generic trial language to live capture and explicit demo language to the fixture', async () => {
    vi.useFakeTimers();
    const commands: string[] = [];
    const service = new VoiceAssistantService();
    service.setCallbacks(
      () => undefined,
      () => undefined,
      (command) => commands.push(command)
    );

    const liveRequest = service.handleUserInput('Start trial');
    await vi.runAllTimersAsync();
    await liveRequest;
    expect(commands).toEqual(['START_TRIAL']);

    commands.length = 0;
    const demoRequest = service.handleUserInput('Run synthetic demo');
    await vi.runAllTimersAsync();
    await demoRequest;
    expect(commands).toEqual(['RUN_SYNTHETIC_DEMO']);
  });

  it('blocks Asha output and commands while patient speech is being captured', async () => {
    const commands: string[] = [];
    const service = new VoiceAssistantService();
    service.setCallbacks(
      () => undefined,
      () => undefined,
      (command) => commands.push(command)
    );

    service.setLiveCaptureLock(true);
    await service.handleUserInput('Run synthetic demo');
    expect(commands).toEqual([]);

    service.setLiveCaptureLock(false);
  });
});
