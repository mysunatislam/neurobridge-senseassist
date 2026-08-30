import { describe, expect, it } from 'vitest';
import { AdvancedDspMathEngine } from '../src/services/AdvancedDspMathEngine';

describe('AdvancedDspMathEngine exploratory proxies', () => {
  it('does not introduce random jitter into a reproducible evaluation', () => {
    const spectrum = new Uint8Array(256);
    spectrum[2] = 220;
    spectrum[6] = 200;
    spectrum[20] = 180;
    const engine = new AdvancedDspMathEngine();

    const first = engine.computeAcousticFormants(spectrum, 44100, [120, 122, 121, 123]);
    const second = engine.computeAcousticFormants(spectrum, 44100, [120, 122, 121, 123]);

    expect(second).toEqual(first);
  });
});
