import { AcousticBiomarkers, CommunicationPhenotype, PatientDigitalTwin, AgentTraceEvent } from './types';
import { PulseSightReading } from '../services/PulseSightService';
import { geminiService } from '../services/GeminiService';

export class NeuroCognitiveReasoningAgent {
  public name = 'Neuro-Cognitive Reasoning Agent';
  public role = 'Longitudinal Analysis & Deficit Layer Phenotyping';
  public badgeColor = 'bg-purple-500/20 text-purple-300 border-purple-500/40';

  /**
   * Performs clinical reasoning. When a Gemini API key is available this sends
   * the real measured biomarkers to the model and uses its response as the
   * primary reasoning output. Falls back to the deterministic rule engine when
   * no key is configured so the app works without credentials.
   */
  public async reason(
    biomarkers: AcousticBiomarkers,
    phenotype: CommunicationPhenotype,
    digitalTwin: PatientDigitalTwin,
    pulseSight?: PulseSightReading
  ): Promise<{
    reasoning: {
      longitudinalComparison: string;
      cognitiveVsMotorAnalysis: string;
      primaryTarget: string;
      confidence: number;
    };
    trace: AgentTraceEvent;
  }> {
    const startTime = performance.now();
    const history = digitalTwin.historicalTrajectory;
    const baselineSession = history.length > 0 ? history[0] : null;
    const articulatoryImprovement = baselineSession
      ? Math.round((phenotype.motorPlanningScore - baselineSession.articulation) * 100)
      : 0;

    let cognitiveVsMotorAnalysis: string;
    let primaryTarget: string;
    let longitudinalComparison: string;
    let confidence = 0.94;
    let usedGemini = false;

    // ── REAL GEMINI REASONING PATH ──────────────────────────────────────────
    if (geminiService.hasApiKey()) {
      try {
        const facialContext = pulseSight
          ? `\nPulseSight facial-motor analysis: lip symmetry ${pulseSight.lipSymmetryPercent}%, timing delay ${pulseSight.lipTimingDelayMs}ms, oral-motor coordination ${pulseSight.oralMotorCoordinationIndex}%, jaw velocity ${pulseSight.jawVelocityMs} m/s. Flag: ${pulseSight.clinicalFlag}`
          : '';

        const prompt = `You are an autonomous clinical neuro-rehabilitation reasoning agent inside NeuroBridge SenseAssist.

PATIENT: ${digitalTwin.name}, ${digitalTwin.clinicalCondition}, ${digitalTwin.sessionsCompleted} prior sessions.

MEASURED ACOUSTIC BIOMARKERS (computed from real audio):
- Speaking rate: ${biomarkers.speakingRateWpm} WPM
- Mean pause duration: ${biomarkers.meanPauseDurationSec}s (${biomarkers.pauseCount} pauses detected)
- Initiation latency: ${biomarkers.initiationLatencySec}s
- Rhythm stability index: ${(biomarkers.rhythmStabilityIndex * 100).toFixed(0)}%
- Pitch variability: ${biomarkers.pitchVariabilityHz} Hz
- Tremor index: ${biomarkers.tremorIndex}
- Voice energy: ${biomarkers.voiceEnergyDb} dB RMS
- Articulation time ratio: ${biomarkers.articulationTimeRatio}${facialContext}

PHONEME ERRORS DETECTED: ${phenotype.phonemeErrors.length === 0
  ? 'None'
  : phenotype.phonemeErrors.map(e => `${e.targetPhoneme}→${e.substitutedPhoneme} in "${e.word}" (${e.errorType}, confidence ${e.confidence})`).join(', ')}

SEVERITY: ${phenotype.severity.toUpperCase()} — ${phenotype.primaryDeficit}

LONGITUDINAL: ${baselineSession
  ? `Baseline articulation ${Math.round(baselineSession.articulation * 100)}%, current ${Math.round(phenotype.motorPlanningScore * 100)}%`
  : 'First session — no prior data'}

Respond with ONLY a JSON object, no markdown fences, no extra text:
{
  "longitudinalComparison": "<1-2 sentence factual comparison citing specific numbers>",
  "cognitiveVsMotorAnalysis": "<2-3 sentence differential: is the deficit cognitive/linguistic or motor execution? cite the measured numbers to justify>",
  "primaryTarget": "<specific, actionable rehabilitation intervention target>",
  "confidence": <0.0-1.0 float>
}`;

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.7-flash:generateContent?key=${geminiService.getApiKey()}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: { temperature: 0.1, maxOutputTokens: 512 }
            })
          }
        );

        if (!response.ok) throw new Error(`Gemini HTTP ${response.status}`);

        const data = await response.json();
        const raw = (data?.candidates?.[0]?.content?.parts?.[0]?.text || '').trim();
        // Strip markdown fences if the model wrapped the JSON
        const jsonStr = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
        const parsed = JSON.parse(jsonStr);

        cognitiveVsMotorAnalysis = String(parsed.cognitiveVsMotorAnalysis || '');
        primaryTarget = String(parsed.primaryTarget || '');
        longitudinalComparison = String(parsed.longitudinalComparison || '');
        confidence = typeof parsed.confidence === 'number' ? parsed.confidence : 0.94;
        usedGemini = true;
      } catch (err) {
        console.warn('[NeuroCognitive] Gemini call failed, using local engine:', err);
        ({ cognitiveVsMotorAnalysis, primaryTarget, longitudinalComparison, confidence } =
          this.localReasoning(biomarkers, phenotype, digitalTwin, pulseSight, articulatoryImprovement));
      }
    } else {
      // ── LOCAL DETERMINISTIC FALLBACK (no API key) ─────────────────────────
      ({ cognitiveVsMotorAnalysis, primaryTarget, longitudinalComparison, confidence } =
        this.localReasoning(biomarkers, phenotype, digitalTwin, pulseSight, articulatoryImprovement));
    }

    const reasoning = { longitudinalComparison, cognitiveVsMotorAnalysis, primaryTarget, confidence };
    const executionTimeMs = Math.round(performance.now() - startTime);

    const facialSummary = pulseSight
      ? ` Facial: lip symmetry ${pulseSight.lipSymmetryPercent}%, timing delay ${pulseSight.lipTimingDelayMs}ms.`
      : '';

    const trace: AgentTraceEvent = {
      agentId: 'agent-neuro-cognitive-reasoning',
      agentName: this.name,
      role: this.role,
      badgeColor: this.badgeColor,
      timestamp: new Date().toISOString().substring(11, 19),
      status: 'completed',
      observation: `Session: motor score ${phenotype.motorPlanningScore}, rhythm ${biomarkers.rhythmStabilityIndex}, ${biomarkers.pauseCount} pauses, WPM ${biomarkers.speakingRateWpm}.${facialSummary}`,
      thought: usedGemini
        ? `Gemini 3.7 Flash reasoned over real biomarkers + PulseSight → ${longitudinalComparison}`
        : `Local rule engine (no API key configured) → ${longitudinalComparison}`,
      decision: `[${usedGemini ? 'GEMINI' : 'LOCAL'}] Target: "${primaryTarget}" (Confidence: ${Math.round(confidence * 100)}%)`,
      outputData: { reasoning, engine: usedGemini ? 'gemini-3.7-flash' : 'local-edge' },
      executionTimeMs
    };

    return { reasoning, trace };
  }

  private localReasoning(
    biomarkers: AcousticBiomarkers,
    phenotype: CommunicationPhenotype,
    digitalTwin: PatientDigitalTwin,
    pulseSight: PulseSightReading | undefined,
    articulatoryImprovement: number
  ): { cognitiveVsMotorAnalysis: string; primaryTarget: string; longitudinalComparison: string; confidence: number } {
    const history = digitalTwin.historicalTrajectory;
    const baselineSession = history.length > 0 ? history[0] : null;

    const longitudinalComparison = baselineSession
      ? `Across ${digitalTwin.sessionsCompleted} sessions: articulation improved from ${Math.round(baselineSession.articulation * 100)}% to ${Math.round(phenotype.motorPlanningScore * 100)}% (+${articulatoryImprovement}%). Mean pause decreased from ${baselineSession.pauseSec}s to ${biomarkers.meanPauseDurationSec}s.`
      : `First session baseline: initiation latency ${biomarkers.initiationLatencySec}s, speaking rate ${biomarkers.speakingRateWpm} WPM.`;

    const hasPhonemeError = phenotype.phonemeErrors.length > 0;
    const hasInitiationDelay = biomarkers.initiationLatencySec > 0.8;
    const hasRhythmInstability = biomarkers.rhythmStabilityIndex < 0.7;
    const hasFacialDelay = pulseSight && pulseSight.lipTimingDelayMs > 140;
    const hasFacialAsymmetry = pulseSight && pulseSight.lipSymmetryPercent < 72;
    const facialEvidence = pulseSight
      ? ` PulseSight: lip delay ${pulseSight.lipTimingDelayMs}ms, symmetry ${pulseSight.lipSymmetryPercent}%.`
      : '';

    let cognitiveVsMotorAnalysis: string;
    let primaryTarget: string;
    let confidence = 0.91;

    if (hasFacialDelay && hasFacialAsymmetry && hasPhonemeError) {
      cognitiveVsMotorAnalysis = `Multimodal evidence: audio phoneme substitution + PulseSight lip motor delay ${pulseSight!.lipTimingDelayMs}ms + asymmetry ${pulseSight!.lipSymmetryPercent}% converge on motor articulation deficit, not linguistic.${facialEvidence}`;
      primaryTarget = 'Motor Articulation Re-education: Rhythmic Haptic Pacing + Lip Aperture Visual Guide';
      confidence = 0.95;
    } else if (hasInitiationDelay && hasRhythmInstability) {
      cognitiveVsMotorAnalysis = `Sensory-motor sync deficit: initiation latency ${biomarkers.initiationLatencySec}s, rhythm stability ${(biomarkers.rhythmStabilityIndex * 100).toFixed(0)}% below threshold.${facialEvidence}`;
      primaryTarget = 'Rhythmic Auditory-Haptic Entrainment (RAS) to stabilize motor speech planning';
    } else if (hasPhonemeError && articulatoryImprovement >= 20) {
      cognitiveVsMotorAnalysis = `Longitudinal recovery: +${articulatoryImprovement}% articulation gain. Residual deficit migrated from muscular articulation to temporal initiation sequencing.${facialEvidence}`;
      primaryTarget = 'Transition: isolated articulatory cues → temporal initiation flow training';
    } else if (hasInitiationDelay) {
      cognitiveVsMotorAnalysis = `Pure motor initiation delay (${biomarkers.initiationLatencySec}s) with intact phoneme placement. Supplementary Motor Area pre-activation deficit.${facialEvidence}`;
      primaryTarget = 'SMA pre-activation via kinetic motor preparation cue';
    } else {
      cognitiveVsMotorAnalysis = `Mixed pattern: phonemic substitution with tremor index ${biomarkers.tremorIndex}. Concurrent tactile-kinesthetic biofeedback indicated.${facialEvidence}`;
      primaryTarget = 'Multi-sensory phoneme re-education with haptic synchronization';
    }

    return { cognitiveVsMotorAnalysis, primaryTarget, longitudinalComparison, confidence };
  }
}
