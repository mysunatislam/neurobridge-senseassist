export interface FormantBiomarkers {
  measurementKind: 'exploratory-spectral-proxy';
  f0FundamentalHz: number;
  f1FormantHz: number;
  f2FormantHz: number;
  vowelSpaceAreaHz2: number;
  jitterPercent: number;
  shimmerDb: number;
  harmonicsToNoiseRatioDb: number;
}

export class AdvancedDspMathEngine {
  /**
   * Computes deterministic exploratory spectral proxies. These values are useful
   * for prototype visualization and scenario comparison, but are not validated
   * clinical formant or perturbation measurements.
   */
  public computeAcousticFormants(
    frequencyData: Uint8Array,
    sampleRate = 44100,
    pitchSamples: number[] = []
  ): FormantBiomarkers {
    const nyquist = sampleRate / 2;
    const binWidth = nyquist / frequencyData.length;

    // Peak detection for F0 (100 - 300 Hz range)
    let f0Bin = 0;
    let maxF0Val = 0;
    const f0MinBin = Math.floor(80 / binWidth);
    const f0MaxBin = Math.floor(350 / binWidth);

    for (let i = f0MinBin; i <= f0MaxBin; i++) {
      if (frequencyData[i] > maxF0Val) {
        maxF0Val = frequencyData[i];
        f0Bin = i;
      }
    }
    const meanPitchHz = pitchSamples.length > 0
      ? pitchSamples.reduce((sum, value) => sum + value, 0) / pitchSamples.length
      : 0;
    const f0FundamentalHz = Math.round(meanPitchHz || (f0Bin * binWidth) || 128);

    // Peak detection for F1 (300 - 900 Hz range) - correlates with tongue height
    let f1Bin = 0;
    let maxF1Val = 0;
    const f1MinBin = Math.floor(300 / binWidth);
    const f1MaxBin = Math.floor(900 / binWidth);

    for (let i = f1MinBin; i <= f1MaxBin; i++) {
      if (frequencyData[i] > maxF1Val) {
        maxF1Val = frequencyData[i];
        f1Bin = i;
      }
    }
    const f1FormantHz = Math.round(f1Bin * binWidth) || 520;

    // Peak detection for F2 (900 - 2400 Hz range) - correlates with tongue advancement
    let f2Bin = 0;
    let maxF2Val = 0;
    const f2MinBin = Math.floor(900 / binWidth);
    const f2MaxBin = Math.floor(2400 / binWidth);

    for (let i = f2MinBin; i <= f2MaxBin; i++) {
      if (frequencyData[i] > maxF2Val) {
        maxF2Val = frequencyData[i];
        f2Bin = i;
      }
    }
    const f2FormantHz = Math.round(f2Bin * binWidth) || 1680;

    // Vowel Space Area estimate (F1 x F2 articulatory working acoustic dispersion)
    const vowelSpaceAreaHz2 = Math.round((f1FormantHz * f2FormantHz) / 100);

    // Deterministic perturbation proxies. No random values are introduced.
    let energySum = 0;
    let highFreqEnergy = 0;
    for (let i = 0; i < frequencyData.length; i++) {
      energySum += frequencyData[i];
      if (i > frequencyData.length / 2) highFreqEnergy += frequencyData[i];
    }

    const noiseRatio = energySum > 0 ? highFreqEnergy / energySum : 0.05;
    let pitchDeltaRatio = noiseRatio * 0.06;
    if (pitchSamples.length > 1 && meanPitchHz > 0) {
      const meanAbsoluteDelta = pitchSamples
        .slice(1)
        .reduce((sum, value, index) => sum + Math.abs(value - pitchSamples[index]), 0) / (pitchSamples.length - 1);
      pitchDeltaRatio = meanAbsoluteDelta / meanPitchHz;
    }
    const jitterPercent = Number(Math.max(0.05, Math.min(5, pitchDeltaRatio * 100)).toFixed(2));
    const shimmerDb = Number(Math.max(0.1, Math.min(2.8, (noiseRatio * 4.2) + 0.15)).toFixed(2));
    const harmonicsToNoiseRatioDb = Number(Math.max(8.0, Math.min(26.0, 24.0 - (noiseRatio * 40))).toFixed(1));

    return {
      measurementKind: 'exploratory-spectral-proxy',
      f0FundamentalHz,
      f1FormantHz,
      f2FormantHz,
      vowelSpaceAreaHz2,
      jitterPercent,
      shimmerDb,
      harmonicsToNoiseRatioDb
    };
  }
}

export const advancedDspMathEngine = new AdvancedDspMathEngine();
