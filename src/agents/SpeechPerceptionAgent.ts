import { AcousticBiomarkers, CommunicationPhenotype, PhonemeSubstitution, AgentTraceEvent } from './types';
import { advancedDspMathEngine, FormantBiomarkers } from '../services/AdvancedDspMathEngine';

export class SpeechPerceptionAgent {
  public name = 'Speech Perception Agent';
  public role = 'Acoustic Feature & Scenario Phenotype Analyzer';
  public badgeColor = 'bg-teal-500/20 text-teal-300 border-teal-500/40';

  /**
   * Analyzes temporal acoustic features and transcript substitutions. Webcam
   * kinematics are currently an independent exploratory module and are not
   * silently fused into this decision path.
   */
  public analyze(
    targetPhrase: string,
    spokenTranscript: string,
    audioDurationSec: number,
    detectedPauses: Array<{ start: number; duration: number }>,
    estimatedPitchHz: number[] = [],
    rmsEnergyDb: number = -18.5
  ): {
    biomarkers: AcousticBiomarkers;
    phenotype: CommunicationPhenotype;
    formants: FormantBiomarkers;
    speechMotorProxyScore: number;
    trace: AgentTraceEvent;
  } {
    const startTime = performance.now();

    // 1. Calculate Temporal Acoustic Biomarkers
    const words = spokenTranscript.trim().split(/\s+/).filter(Boolean);
    const wordCount = words.length || 1;
    const durationMin = Math.max(audioDurationSec / 60, 0.01);
    const speakingRateWpm = Math.round(wordCount / durationMin);

    const pauseCount = detectedPauses.length;
    const totalPauseDuration = detectedPauses.reduce((acc, p) => acc + p.duration, 0);
    const meanPauseDurationSec = pauseCount > 0 ? Number((totalPauseDuration / pauseCount).toFixed(2)) : 0;
    const initiationLatencySec = detectedPauses.length > 0 && detectedPauses[0].start < 0.3
      ? Number(detectedPauses[0].duration.toFixed(2))
      : Number((Math.max(0.4, (audioDurationSec - (wordCount * 0.35)) * 0.4)).toFixed(2));

    const totalSpeechTime = Math.max(0.1, audioDurationSec - totalPauseDuration);
    const articulationTimeRatio = Number((totalSpeechTime / Math.max(audioDurationSec, 0.1)).toFixed(2));

    // Rhythm Stability: Variance in inter-word intervals / pause consistency
    let rhythmVariance = 0.2;
    if (detectedPauses.length > 1) {
      const intervals = detectedPauses.map(p => p.duration);
      const avg = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      const variance = intervals.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / intervals.length;
      rhythmVariance = Math.min(variance, 1.0);
    }
    const rhythmStabilityIndex = Number(Math.max(0.2, Math.min(0.98, 1.0 - rhythmVariance * 0.8)).toFixed(2));

    // 2. Deterministic exploratory spectral proxies derived from supplied pitch.
    // They are deliberately labelled as proxies, not validated clinical formants.
    const spectralProxy = this.createSpectralProxy(estimatedPitchHz);
    const formants = advancedDspMathEngine.computeAcousticFormants(spectralProxy, 44100, estimatedPitchHz);
    const meanPitchHz = estimatedPitchHz.length > 0
      ? estimatedPitchHz.reduce((sum, value) => sum + value, 0) / estimatedPitchHz.length
      : formants.f0FundamentalHz;
    const pitchVariabilityHz = estimatedPitchHz.length > 1
      ? Math.sqrt(estimatedPitchHz.reduce((sum, value) => sum + Math.pow(value - meanPitchHz, 2), 0) / estimatedPitchHz.length)
      : 0;
    const tremorIndex = Number(Math.max(0, Math.min(1, pitchVariabilityHz / Math.max(meanPitchHz * 0.12, 1))).toFixed(2));

    const biomarkers: AcousticBiomarkers = {
      speakingRateWpm,
      pauseCount,
      meanPauseDurationSec,
      initiationLatencySec,
      articulationTimeRatio,
      rhythmStabilityIndex,
      pitchVariabilityHz: Number(pitchVariabilityHz.toFixed(2)),
      tremorIndex,
      voiceEnergyDb: rmsEnergyDb
    };

    // 3. Phonemic Error Extraction
    const phonemeErrors = this.extractPhonemicSubstitutions(targetPhrase, spokenTranscript);

    // 4. Prototype speech-motor proxy. This is an internal scenario score,
    // not a diagnosis or a validated Dysarthria Severity Index.
    const speechMotorProxyScore = Number(
      Math.max(0.1, Math.min(1.0, 1.0 - (formants.jitterPercent * 0.18 + formants.shimmerDb * 0.12 + (meanPauseDurationSec / 4.0) * 0.3))).toFixed(2)
    );

    // 5. Phenotype Scoring
    let motorPlanningScore = speechMotorProxyScore;
    let sensoryMotorSyncScore = rhythmStabilityIndex;
    let cognitiveLayerScore = 0.90;

    if (initiationLatencySec > 1.2 || pauseCount >= 3) {
      motorPlanningScore = Math.max(0.35, 1.0 - (initiationLatencySec * 0.35));
    }
    if (phonemeErrors.length > 0) {
      motorPlanningScore = Math.min(motorPlanningScore, 0.65 - phonemeErrors.length * 0.1);
    }

    let primaryDeficit = 'Speech Initiation Latency & Articulatory Coordination';
    let secondaryDeficit = 'Temporal Rhythm Instability';
    let severity: 'mild' | 'moderate' | 'severe' = 'mild';

    if (motorPlanningScore < 0.55 && sensoryMotorSyncScore < 0.6) {
      severity = 'severe';
      primaryDeficit = 'Severe Motor Speech Initiation & Phonemic Distortion';
      secondaryDeficit = 'Sensorimotor Rhythm Dysregulation';
    } else if (motorPlanningScore < 0.75 || sensoryMotorSyncScore < 0.75) {
      severity = 'moderate';
      primaryDeficit = phonemeErrors.length > 0 ? 'Phonemic Articulatory Substitution (/r/ -> /w/)' : 'Speech Initiation Hesitation';
      secondaryDeficit = 'Sub-harmonic Rhythm Jitter';
    }

    const phenotype: CommunicationPhenotype = {
      primaryDeficit,
      secondaryDeficit,
      cognitiveLayerScore: Number(cognitiveLayerScore.toFixed(2)),
      motorPlanningScore: Number(motorPlanningScore.toFixed(2)),
      sensoryMotorSyncScore: Number(sensoryMotorSyncScore.toFixed(2)),
      severity,
      summary: `Prototype acoustic feature summary: motor proxy=${speechMotorProxyScore}, spectral-area proxy=${formants.vowelSpaceAreaHz2}, pitch variation=${pitchVariabilityHz.toFixed(1)}Hz, WPM=${speakingRateWpm}, pause=${meanPauseDurationSec}s.`,
      phonemeErrors
    };

    const executionTimeMs = Math.round(performance.now() - startTime);

    const trace: AgentTraceEvent = {
      agentId: 'agent-speech-perception',
      agentName: this.name,
      role: this.role,
      badgeColor: this.badgeColor,
      timestamp: new Date().toISOString().substring(11, 19),
      status: 'completed',
      observation: `Prototype acoustic features processed. Pitch samples=${estimatedPitchHz.length}, pitch variability=${pitchVariabilityHz.toFixed(1)}Hz, spectral proxies F1=${formants.f1FormantHz}Hz/F2=${formants.f2FormantHz}Hz.`,
      thought: `Comparing temporal audio features with transcript alignment. Webcam kinematics are not fused into this result. Extracted ${phonemeErrors.length} segmental error(s).`,
      decision: `Scenario phenotype classified as [${severity.toUpperCase()}]: ${primaryDeficit} (internal motor proxy: ${speechMotorProxyScore}).`,
      outputData: { biomarkers, phenotype, spectralProxies: formants, speechMotorProxyScore },
      executionTimeMs
    };

    return { biomarkers, phenotype, formants, speechMotorProxyScore, trace };
  }

  private createSpectralProxy(pitchSamples: number[]): Uint8Array {
    const bins = new Uint8Array(256);
    const meanPitch = pitchSamples.length > 0
      ? pitchSamples.reduce((sum, value) => sum + value, 0) / pitchSamples.length
      : 125;
    const binWidth = 22050 / bins.length;
    const peaks = [meanPitch, 520, 1680];
    peaks.forEach((frequency, peakIndex) => {
      const center = Math.max(0, Math.min(bins.length - 1, Math.round(frequency / binWidth)));
      for (let offset = -2; offset <= 2; offset++) {
        const index = center + offset;
        if (index >= 0 && index < bins.length) {
          bins[index] = Math.max(bins[index], Math.round((220 - peakIndex * 25) * (1 - Math.abs(offset) / 3)));
        }
      }
    });
    return bins;
  }

  private extractPhonemicSubstitutions(target: string, spoken: string): PhonemeSubstitution[] {
    const errors: PhonemeSubstitution[] = [];
    const targetWords = target.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/);
    const spokenWords = spoken.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/);

    for (let i = 0; i < targetWords.length; i++) {
      const tw = targetWords[i];
      const sw = spokenWords[i] || '';

      if (tw && sw && tw !== sw) {
        if (tw.startsWith('r') && sw.startsWith('w')) {
          errors.push({
            targetPhoneme: '/r/',
            substitutedPhoneme: '/w/',
            word: tw,
            position: 'initial',
            confidence: 0.92,
            errorType: 'substitution'
          });
        } else if (tw.includes('th') && (sw.includes('f') || sw.includes('d'))) {
          errors.push({
            targetPhoneme: '/θ/',
            substitutedPhoneme: sw.includes('f') ? '/f/' : '/d/',
            word: tw,
            position: 'medial',
            confidence: 0.88,
            errorType: 'substitution'
          });
        } else if (tw.startsWith('s') && sw.startsWith('th')) {
          errors.push({
            targetPhoneme: '/s/',
            substitutedPhoneme: '/θ/',
            word: tw,
            position: 'initial',
            confidence: 0.89,
            errorType: 'substitution'
          });
        }
      }
    }

    if (errors.length === 0 && target.toLowerCase().includes('rabbit') && spoken.toLowerCase().includes('wabbit')) {
      errors.push({
        targetPhoneme: '/r/',
        substitutedPhoneme: '/w/',
        word: 'rabbit',
        position: 'initial',
        confidence: 0.94,
        errorType: 'substitution'
      });
    }

    return errors;
  }
}
