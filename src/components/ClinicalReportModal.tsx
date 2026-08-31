import React, { useState } from 'react';
import { FileText, Copy, Check, Printer, X, Download, Code, Sparkles } from 'lucide-react';
import { ClinicianApproval, PatientDigitalTwin, SessionRunResult } from '../agents/types';
import { fhirExportService } from '../services/FhirExportService';

interface ClinicalReportModalProps {
  digitalTwin: PatientDigitalTwin;
  sessionResult: SessionRunResult | null;
  clinicianApproval: ClinicianApproval | null;
  onClose: () => void;
}

export const ClinicalReportModal: React.FC<ClinicalReportModalProps> = ({
  digitalTwin,
  sessionResult,
  clinicianApproval,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'markdown' | 'fhir'>('markdown');
  const [copied, setCopied] = useState(false);
  const hasBoundClinicianApproval = Boolean(
    clinicianApproval &&
    sessionResult?.sessionId &&
    clinicianApproval.sessionId === sessionResult.sessionId &&
    clinicianApproval.patientId === digitalTwin.patientId
  );
  const supervisoryStatus = hasBoundClinicianApproval
    ? `Clinician approved by ${clinicianApproval!.approvedBy} at ${new Date(clinicianApproval!.approvedAt).toLocaleString()} (session ${clinicianApproval!.sessionId})`
    : sessionResult?.safety.actuationPermitted
      ? 'Safety-agent autonomous clearance; no clinician signature recorded'
      : sessionResult?.safety.therapistApprovalRequired
        ? 'Pending clinician approval; actuation remains blocked'
        : 'Safety veto active; clinician approval cannot override the current boundary';

  const runEvidence = sessionResult
    ? `- **Input provenance**: ${sessionResult.inputProvenance.label}
- **Transcript source**: ${sessionResult.inputProvenance.transcriptSource.replace(/-/g, ' ')}
- **Reviewed transcript**: ${sessionResult.spokenTranscript}
- **Speaking-rate proxy**: ${sessionResult.biomarkers.speakingRateWpm} WPM
- **Observed mean pause**: ${sessionResult.biomarkers.meanPauseDurationSec} sec
- **Rhythm proxy**: ${Math.round(sessionResult.biomarkers.rhythmStabilityIndex * 100)}%
- **Speech-motor proxy**: ${Math.round(sessionResult.phenotype.motorPlanningScore * 100)}%
- **Configured text substitutions**: ${sessionResult.phenotype.phonemeErrors.length}`
    : '- No current session result. No metric defaults were inserted.';

  const interventionEvidence = sessionResult
    ? `- **Suggested pacing cadence**: ${sessionResult.intervention.bpm} BPM
- **Suggested haptic pattern**: ${sessionResult.intervention.hapticPattern} at ${sessionResult.intervention.hapticIntensityPercent}%
- **App-level safety result**: ${sessionResult.safety.sanitizedClinicalRationale}
- **Supervisory status**: ${supervisoryStatus}`
    : '- No intervention was generated because there is no current result.';

  const reportText = `# NeuroBridge SenseAssist - Prototype Session Review

**Generated Date**: ${new Date().toLocaleDateString()}
**Scenario Name**: ${digitalTwin.name}
**Scenario ID**: ${digitalTwin.patientId}
**Scenario Label**: ${digitalTwin.clinicalCondition}
**Evidence Boundary**: Research/hackathon prototype; not a diagnosis, treatment result, or validated medical record.

---

## 1. Bound Run Evidence
${runEvidence}

---

## 2. Interpretation Boundary
- Transcript substitutions are configured text heuristics, not validated acoustic phoneme recognition.
- Camera/rPPG modules are independent and are not fused into this report.
- No post-intervention retry is captured, so this report makes no improvement or efficacy claim.

---

## 3. Suggested Prototype Intervention
${interventionEvidence}

---

## 4. Experimental Interoperability
- **Classification labels**: ICF b320 and b330 are prototype metadata mappings.
- **FHIR shape**: Experimental FHIR R4-shaped Bundle; conformance validation and EHR integration are pending.

*Generated for software review. A licensed clinician must independently assess any real patient.*
`;

  const fhirBundle = fhirExportService.generateFhirBundle(digitalTwin, sessionResult);
  const fhirJson = JSON.stringify(fhirBundle, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(activeTab === 'markdown' ? reportText : fhirJson);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadFhir = () => {
    const blob = new Blob([fhirJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fhir_report_${digitalTwin.patientId}_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-3xl max-h-[90vh] rounded-3xl bg-slate-900 border border-slate-700 shadow-2xl p-6 flex flex-col space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-3">
            <div className="flex rounded-lg bg-slate-950 p-1 border border-slate-800">
              <button
                onClick={() => setActiveTab('markdown')}
                className={`flex items-center space-x-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-colors ${
                  activeTab === 'markdown' ? 'bg-teal-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Prototype Report</span>
              </button>
              <button
                onClick={() => setActiveTab('fhir')}
                className={`flex items-center space-x-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-colors ${
                  activeTab === 'fhir' ? 'bg-teal-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Code className="w-3.5 h-3.5" />
                <span>Experimental FHIR JSON</span>
              </button>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {activeTab === 'fhir' && (
              <button
                onClick={handleDownloadFhir}
                className="px-3 py-1.5 rounded-lg bg-cyan-500 text-slate-950 text-xs font-bold flex items-center space-x-1.5 shadow-md shadow-cyan-500/20"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download FHIR .json</span>
              </button>
            )}
            <button
              onClick={handleCopy}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center space-x-1.5 border border-slate-700"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-lg bg-teal-500 text-slate-950 text-xs font-bold flex items-center space-x-1.5 shadow-md shadow-teal-500/20"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / PDF</span>
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto rounded-xl bg-slate-950 p-6 border border-slate-800 font-sans text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">
          {activeTab === 'markdown' ? (
            reportText
          ) : (
            <pre className="font-mono text-cyan-300 text-[11px]">{fhirJson}</pre>
          )}
        </div>
      </div>
    </div>
  );
};
