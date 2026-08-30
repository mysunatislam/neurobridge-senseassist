import { describe, expect, it } from 'vitest';
import { SpeechPerceptionAgent } from '../src/agents/SpeechPerceptionAgent';

const analyze = (pitchSamples: number[]) => new SpeechPerceptionAgent().analyze(
  'The red rabbit runs through the green grass',
  'The wed wabbit runs through the green grass',
  6,
  [{ start: 0.2, duration: 0.8 }, { start: 3, duration: 0.6 }],
  pitchSamples,
  -22
);

describe('SpeechPerceptionAgent acoustic proxies', () => {
  it('is deterministic for identical synthetic inputs', () => {
    const first = analyze([124, 126, 123, 127, 125]);
    const second = analyze([124, 126, 123, 127, 125]);

    expect(second.biomarkers).toEqual(first.biomarkers);
    expect(second.formants).toEqual(first.formants);
    expect(second.speechMotorProxyScore).toBe(first.speechMotorProxyScore);
  });

  it('keeps tremorIndex within its documented 0–1 range', () => {
    const stable = analyze([124, 126, 123, 127, 125]);
    const variable = analyze([85, 170, 92, 185, 100]);

    expect(stable.biomarkers.tremorIndex).toBeGreaterThanOrEqual(0);
    expect(stable.biomarkers.tremorIndex).toBeLessThanOrEqual(1);
    expect(variable.biomarkers.tremorIndex).toBeGreaterThan(stable.biomarkers.tremorIndex);
    expect(variable.biomarkers.tremorIndex).toBeLessThanOrEqual(1);
  });

  it('labels spectral output as an exploratory proxy', () => {
    const result = analyze([124, 126, 123, 127, 125]);
    expect(result.formants.measurementKind).toBe('exploratory-spectral-proxy');
    expect(result.trace.thought).toContain('not fused');
  });
});
