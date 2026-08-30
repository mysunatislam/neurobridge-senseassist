import { AcousticBiomarkers, CommunicationPhenotype, PatientDigitalTwin, SensoryIntervention, AgentTraceEvent } from './types';

export class SensoryMotorAgent {
  public name = 'Sensory-Motor Intelligence Agent';
  public role = 'Multimodal Sensory Adaptation & Haptic Pacing';
  public badgeColor = 'bg-amber-500/20 text-amber-300 border-amber-500/40';

  /**
   * Synthesizes tailored sensory-motor interventions combining haptic pulses, rhythmic auditory stimulation, and visual motor cues.
   */
  public designIntervention(
    biomarkers: AcousticBiomarkers,
    phenotype: CommunicationPhenotype,
    reasoningTarget: string,
    digitalTwin: PatientDigitalTwin
  ): {
    intervention: SensoryIntervention;
    trace: AgentTraceEvent;
  } {
    const startTime = performance.now();

    const bpm = digitalTwin.preferredBpm || 80;
    let modality: SensoryIntervention['modality'] = 'combined';
    let hapticPattern: SensoryIntervention['hapticPattern'] = '1-2-3-4';
    let hapticIntensityPercent = Math.min(75, Math.max(35, Math.round(digitalTwin.hapticResponsiveness * 80)));
    let pulseDurationMs = 450;
    let visualCueType: SensoryIntervention['visualCueType'] = 'mouth_shape';
    let targetPhonemeFocus = phenotype.phonemeErrors.length > 0 ? phenotype.phonemeErrors[0].targetPhoneme : '/r/';
    let difficultyLevel = Math.min(10, Math.max(1, Math.round(digitalTwin.sessionsCompleted * 1.5 + 2)));
    let clinicalRationale = '';

    // Condition 1: Rhythm Instability
    if (biomarkers.rhythmStabilityIndex < 0.65) {
      modality = 'combined';
      hapticPattern = '1-2-3-4';
      pulseDurationMs = 500;
      hapticIntensityPercent = 65;
      visualCueType = 'tempo_bar';
      clinicalRationale = `Sensorimotor entrainment activated: Rhythmic haptic pulses at ${bpm} BPM (1-2-3-4 pattern) with auditory metronome to stabilize sub-cortical pacing circuits.`;
    }
    // Condition 2: Initiation Hesitation
    else if (biomarkers.initiationLatencySec > 1.0) {
      modality = 'haptic';
      hapticPattern = 'tap-tap-pause-tap';
      pulseDurationMs = 400;
      hapticIntensityPercent = 70;
      visualCueType = 'finger_tap_prompt';
      clinicalRationale = `Pre-motor kinetic trigger: 'Tap-Tap-Pause-Tap' tactile cue preceding vocalization to activate supplementary motor area (SMA) and overcome speech freezing.`;
    }
    // Condition 3: Segmental Articulation / Substitution
    else if (phenotype.phonemeErrors.length > 0) {
      modality = 'visual_motor';
      hapticPattern = 'ascending_sync';
      pulseDurationMs = 350;
      visualCueType = 'mouth_shape';
      clinicalRationale = `Articulatory biomechanical cueing: Exaggerated phonetic mouth guidance for ${targetPhonemeFocus} synchronized with ascending tactile confirmation.`;
    }
    // Condition 4: Stabilized Progress - Adaptive Difficulty Escalation
    else {
      modality = 'combined';
      hapticPattern = 'calming_wave';
      difficultyLevel = Math.min(10, difficultyLevel + 1);
      hapticIntensityPercent = 45;
      visualCueType = 'tempo_bar';
      clinicalRationale = `Adaptive progression: Performance stabilized. Increasing cognitive-motor load to level ${difficultyLevel} with fading tactile scaffolds.`;
    }

    const intervention: SensoryIntervention = {
      id: `intervention-${Date.now()}`,
      modality,
      bpm,
      hapticPattern,
      hapticIntensityPercent,
      pulseDurationMs,
      visualCueType,
      targetPhonemeFocus,
      difficultyLevel,
      clinicalRationale
    };

    const executionTimeMs = Math.round(performance.now() - startTime);

    const trace: AgentTraceEvent = {
      agentId: 'agent-sensory-motor',
      agentName: this.name,
      role: this.role,
      badgeColor: this.badgeColor,
      timestamp: new Date().toISOString().substring(11, 19),
      status: 'completed',
      observation: `Evaluated sensory channels (Haptic Responsiveness=${digitalTwin.hapticResponsiveness}, Preferred BPM=${bpm}). Target deficit: "${reasoningTarget}".`,
      thought: `Selecting optimal sensory modality. Rhythm index (${biomarkers.rhythmStabilityIndex}) and initiation latency (${biomarkers.initiationLatencySec}s) indicate requirement for ${modality} intervention with '${hapticPattern}' pattern.`,
      decision: `Generated ESP32 Haptic Protocol: ${bpm} BPM, ${hapticIntensityPercent}% intensity, ${visualCueType} visual guidance. Difficulty level: ${difficultyLevel}/10.`,
      outputData: { intervention },
      executionTimeMs
    };

    return { intervention, trace };
  }
}
