import React, { useState } from 'react';
import { FileText, Download, CheckCircle2, ShieldAlert, Award, Clock, ArrowUpRight, Check, Printer } from 'lucide-react';
import { ClinicianApproval, PatientDigitalTwin, SessionRunResult } from '../agents/types';
import { ActuationGateDecision } from '../services/ActuationSafetyGate';
import { ClinicalReportModal } from './ClinicalReportModal';

interface TherapistPortalProps {
  digitalTwin: PatientDigitalTwin;
  sessionResult: SessionRunResult | null;
  clinicianApproval: ClinicianApproval | null;
  onApprovalChange: (approved: boolean) => void;
  actuationDecision: ActuationGateDecision;
}

export const TherapistPortal: React.FC<TherapistPortalProps> = ({
  digitalTwin,
  sessionResult,
  clinicianApproval,
  onApprovalChange,
  actuationDecision
}) => {
  const [showReportModal, setShowReportModal] = useState(false);

  const progress = sessionResult?.progress;
  const isApproved = Boolean(
    clinicianApproval &&
    sessionResult?.sessionId &&
    clinicianApproval.sessionId === sessionResult.sessionId &&
    clinicianApproval.patientId === digitalTwin.patientId
  );
  const approvalHardBlocked = Boolean(
    !sessionResult ||
    sessionResult.safety.requiresImmediateRest ||
    !sessionResult.safety.stimulusIntensitySafe
  );

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-900 via-[#0c1527] to-slate-900 p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-teal-400" />
            <h2 className="text-xl font-bold text-white">Therapist Review & Actuation Approval</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Review labelled prototype evidence and bind approval to the active patient/session before gated output.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowReportModal(true)}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-teal-300 border border-teal-500/30 text-xs font-semibold transition-all shadow-md"
          >
            <Download className="w-4 h-4" />
            <span>Generate Prototype Report</span>
          </button>
        </div>
      </div>

      {/* Evidence comparison from the active scenario result */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
            <Award className="w-4 h-4 text-amber-400" />
            <span>Scenario Evidence Comparison</span>
          </h3>
          <span className="text-[11px] text-teal-400 font-mono font-semibold">
            {progress?.evidenceKind ?? 'No active result'}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-mono text-[11px] uppercase">
                <th className="py-3 px-4">Comparison field</th>
                <th className="py-3 px-4">Stored scenario reference</th>
                <th className="py-3 px-4 text-teal-400 font-bold">Current prototype result</th>
                <th className="py-3 px-4 text-amber-400">Interpretation boundary</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {progress ? progress.comparativeMatrix.map((row) => (
                <tr key={row.parameter}>
                  <td className="py-3 px-4 font-semibold text-white">{row.parameter}</td>
                  <td className="py-3 px-4 text-slate-400">{row.traditionalBaseline}</td>
                  <td className="py-3 px-4 text-teal-300 font-bold">{row.neuroBridgeSenseAssist}</td>
                  <td className="py-3 px-4 text-amber-300">{row.quantifiedAdvantage}</td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={4} className="py-6 px-4 text-center text-slate-500">Run a labelled input to populate this table. No fallback metrics are shown.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Human-in-the-Loop Clinical Oversight Card */}
      <div className="rounded-2xl border border-teal-500/30 bg-gradient-to-br from-slate-900 via-teal-950/10 to-slate-900 p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-5 h-5 text-teal-400" />
              <h3 className="text-base font-bold text-white">Human-in-the-Loop Therapist Plan Approval</h3>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Clinician retains final authoritative oversight over difficulty escalation, haptic intensity, and target phonemes.
            </p>
          </div>

          <button
            onClick={() => onApprovalChange(!isApproved)}
            disabled={approvalHardBlocked}
            title={approvalHardBlocked ? actuationDecision.reason : 'Bind this signature to the active patient and session result.'}
            className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl font-bold text-xs transition-all shadow-lg ${
              isApproved
                ? 'bg-emerald-500 text-slate-950 shadow-emerald-500/30'
                : 'bg-teal-500 hover:bg-teal-400 text-slate-950 shadow-teal-500/20'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <Check className="w-4 h-4" />
            <span>
              {isApproved
                ? 'Plan Approved & Signed'
                : approvalHardBlocked
                  ? 'Approval unavailable — safety veto'
                  : 'Approve Active Session Plan'}
            </span>
          </button>
        </div>

        {/* Current Active Plan Breakdown */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="text-slate-400 block text-[10px] font-semibold uppercase">Target Pacing</span>
            <span className="text-white font-bold text-sm">{sessionResult ? `${sessionResult.intervention.bpm} BPM (${sessionResult.intervention.hapticPattern})` : 'No active plan'}</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="text-slate-400 block text-[10px] font-semibold uppercase">Haptic Wearable Protocol</span>
            <span className="text-teal-300 font-bold text-sm">{sessionResult ? `${sessionResult.intervention.hapticIntensityPercent}% app-requested intensity` : 'No output requested'}</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="text-slate-400 block text-[10px] font-semibold uppercase">Supervisory Status</span>
            <span className={`font-bold text-sm ${isApproved ? 'text-emerald-400' : 'text-amber-400'}`}>
              {isApproved
                ? `Signed ${new Date(clinicianApproval!.approvedAt).toLocaleTimeString()}`
                : actuationDecision.permitted
                  ? 'Safety-agent clearance; unsigned'
                  : 'Pending clinician signature / blocked'}
            </span>
          </div>
        </div>
      </div>

      {/* Report Modal */}
      {showReportModal && (
        <ClinicalReportModal
          digitalTwin={digitalTwin}
          sessionResult={sessionResult}
          clinicianApproval={clinicianApproval}
          onClose={() => setShowReportModal(false)}
        />
      )}
    </div>
  );
};
