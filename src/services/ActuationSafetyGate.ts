import type { ClinicianApproval, SafetyGuardResult } from '../agents/types';

export interface ActuationSafetyContext {
  sessionId: string;
  patientId: string;
  safety: SafetyGuardResult;
}

export type ActuationAuthorizationMode = 'autonomous' | 'clinician-approved' | 'blocked';

export interface ActuationGateDecision {
  permitted: boolean;
  mode: ActuationAuthorizationMode;
  code:
    | 'AUTONOMOUS_CLEARANCE'
    | 'CLINICIAN_APPROVAL'
    | 'NO_ACTIVE_SESSION'
    | 'MANDATORY_REST'
    | 'UNSAFE_STIMULUS'
    | 'APPROVAL_REQUIRED'
    | 'STALE_APPROVAL'
    | 'SAFETY_VETO';
  reason: string;
  sessionId?: string;
}

export function isApprovalBoundToContext(
  approval: ClinicianApproval | null,
  context: ActuationSafetyContext | null
): approval is ClinicianApproval {
  return Boolean(
    approval &&
    context &&
    approval.safetyAcknowledged === true &&
    approval.sessionId === context.sessionId &&
    approval.patientId === context.patientId
  );
}

/**
 * Pure fail-closed authorization policy shared by every haptic entry point.
 * A clinician may authorize an escalation that explicitly requires approval,
 * but may never override a mandatory rest interval or unsafe stimulus.
 */
export function evaluateActuationGate(
  context: ActuationSafetyContext | null,
  approval: ClinicianApproval | null
): ActuationGateDecision {
  if (!context) {
    return {
      permitted: false,
      mode: 'blocked',
      code: 'NO_ACTIVE_SESSION',
      reason: 'Run a trial before enabling the actuator; no current safety result is bound.'
    };
  }

  if (context.safety.requiresImmediateRest) {
    return {
      permitted: false,
      mode: 'blocked',
      code: 'MANDATORY_REST',
      reason: 'Mandatory recovery is active. Clinician approval cannot override a rest veto.',
      sessionId: context.sessionId
    };
  }

  if (!context.safety.stimulusIntensitySafe) {
    return {
      permitted: false,
      mode: 'blocked',
      code: 'UNSAFE_STIMULUS',
      reason: 'The proposed stimulus failed the intensity boundary and must be regenerated.',
      sessionId: context.sessionId
    };
  }

  if (context.safety.actuationPermitted) {
    return {
      permitted: true,
      mode: 'autonomous',
      code: 'AUTONOMOUS_CLEARANCE',
      reason: 'The active session safety result permits autonomous actuation.',
      sessionId: context.sessionId
    };
  }

  if (context.safety.therapistApprovalRequired) {
    if (isApprovalBoundToContext(approval, context)) {
      return {
        permitted: true,
        mode: 'clinician-approved',
        code: 'CLINICIAN_APPROVAL',
        reason: `Clinician approval is bound to active session ${context.sessionId}.`,
        sessionId: context.sessionId
      };
    }

    return {
      permitted: false,
      mode: 'blocked',
      code: approval ? 'STALE_APPROVAL' : 'APPROVAL_REQUIRED',
      reason: approval
        ? 'The available clinician approval belongs to another patient or session.'
        : 'This intervention requires a clinician signature for the active session.',
      sessionId: context.sessionId
    };
  }

  return {
    permitted: false,
    mode: 'blocked',
    code: 'SAFETY_VETO',
    reason: 'The active safety result does not authorize actuator output.',
    sessionId: context.sessionId
  };
}
