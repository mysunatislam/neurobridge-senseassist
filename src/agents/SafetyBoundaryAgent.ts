import { AcousticBiomarkers, SensoryIntervention, SafetyGuardResult, AgentTraceEvent } from './types';

export class SafetyBoundaryAgent {
  public name = 'Safety & Clinical Boundary Agent';
  public role = 'Clinical Boundary Guardrails & Fatigue Monitoring';
  public badgeColor = 'bg-rose-500/20 text-rose-300 border-rose-500/40';

  /**
   * Enforces strict clinical boundaries, screens for diagnostic over-reach, and validates sensory fatigue limits.
   */
  public evaluate(
    biomarkers: AcousticBiomarkers,
    intervention: SensoryIntervention,
    rationaleText: string
  ): {
    safety: SafetyGuardResult;
    trace: AgentTraceEvent;
  } {
    const startTime = performance.now();

    const violations: string[] = [];

    // 1. Diagnostic Phrasing Check (Responsible AI Rule: Assistive & Therapeutic, NOT Diagnostic)
    const prohibitedDiagnosticPhrases = [
      /diagnosed with/i,
      /patient has dysarthria/i,
      /patient suffers from severe aphasia/i,
      /confirmed apraxia/i,
      /pathology detected/i
    ];

    let sanitizedRationale = rationaleText;
    prohibitedDiagnosticPhrases.forEach((regex) => {
      if (regex.test(sanitizedRationale)) {
        violations.push(`Flagged diagnostic term matching ${regex.source}. Transformed to objective acoustic biomarker description.`);
        sanitizedRationale = sanitizedRationale.replace(regex, 'acoustic observations indicate speech motor coordination characteristics');
      }
    });

    // 2. Vocal & Cognitive Fatigue Index Calculation
    // Spikes in tremor, pitch variability, and excessive pauses correlate with neurological vocal fatigue
    const fatigueIndex = Number(
      Math.min(
        1.0,
        (biomarkers.tremorIndex * 0.4) +
        (Math.min(1.0, biomarkers.meanPauseDurationSec / 2.5) * 0.4) +
        (biomarkers.pitchVariabilityHz > 25 ? 0.2 : 0.05)
      ).toFixed(2)
    );

    let fatigueRisk: SafetyGuardResult['fatigueRisk'] = 'low';
    if (fatigueIndex > 0.7) {
      fatigueRisk = 'high';
      violations.push('High vocal/cognitive fatigue detected. Recommending mandatory 90-second sensory rest interval.');
    } else if (fatigueIndex > 0.45) {
      fatigueRisk = 'moderate';
    }

    // 3. Sensory Stimulus Boundary Validation
    let stimulusIntensitySafe = true;
    if (intervention.hapticIntensityPercent > 80) {
      stimulusIntensitySafe = false;
      violations.push(`Haptic intensity ${intervention.hapticIntensityPercent}% exceeds the wearable maximum 80%. Clamped to 80%; regenerate the plan before actuation.`);
      intervention.hapticIntensityPercent = 80;
    }

    const requiresImmediateRest = fatigueIndex > 0.65;
    if (requiresImmediateRest && fatigueRisk !== 'high') {
      violations.push('Fatigue crossed the actuator rest threshold. A mandatory 90-second recovery interval is required.');
    }

    const passed = violations.length === 0;
    // Clinician approval can authorize a high-difficulty escalation, but never a
    // hard rest/intensity veto or another unresolved boundary violation.
    const therapistApprovalRequired =
      intervention.difficultyLevel >= 8 &&
      !requiresImmediateRest &&
      stimulusIntensitySafe &&
      passed;
    
    // Fail-Closed Actuator Gate: Actuation is strictly blocked if any safety boundary is tripped
    const actuationPermitted = passed && !therapistApprovalRequired && stimulusIntensitySafe && !requiresImmediateRest;

    const safety: SafetyGuardResult = {
      passed,
      actuationPermitted,
      requiresImmediateRest,
      fatigueRisk,
      stimulusIntensitySafe,
      therapistApprovalRequired,
      clinicalBoundaryViolations: violations,
      sanitizedClinicalRationale: sanitizedRationale,
      fatigueIndex
    };

    const executionTimeMs = Math.round(performance.now() - startTime);

    const trace: AgentTraceEvent = {
      agentId: 'agent-safety-boundary',
      agentName: this.name,
      role: this.role,
      badgeColor: this.badgeColor,
      timestamp: new Date().toISOString().substring(11, 19),
      status: actuationPermitted ? 'completed' : 'warning',
      observation: `Fatigue Index: ${fatigueIndex} (${fatigueRisk} risk). Haptic Intensity: ${intervention.hapticIntensityPercent}%. Actuation Permitted: ${actuationPermitted ? 'YES' : 'FAIL-CLOSED BLOCKED'}.`,
      thought: `Screening intervention against clinical safety boundaries. Therapist approval required: ${therapistApprovalRequired ? 'YES (Level ' + intervention.difficultyLevel + ')' : 'NO'}. Immediate rest required: ${requiresImmediateRest ? 'YES' : 'NO'}.`,
      decision: actuationPermitted
        ? `SAFETY VERIFIED: Protocol cleared for autonomous patient actuation (Intensity: ${intervention.hapticIntensityPercent}%, Tempo: ${intervention.bpm} BPM).`
        : therapistApprovalRequired
          ? 'FAIL-CLOSED PENDING APPROVAL: A clinician signature bound to this patient and session is required before wearable pacing may proceed.'
          : `FAIL-CLOSED SAFETY VETO: Hardware actuation is strictly BLOCKED. ${requiresImmediateRest ? 'Mandatory 90s vocal recovery interval initiated. ' : ''}The intervention must be regenerated after the safety condition is resolved.`,
      outputData: { safety },
      executionTimeMs
    };

    return { safety, trace };
  }
}
