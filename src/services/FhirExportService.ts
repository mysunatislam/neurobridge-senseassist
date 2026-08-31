import { PatientDigitalTwin, SessionRunResult } from '../agents/types';

export class FhirExportService {
  /**
   * Generates an experimental FHIR R4-shaped JSON bundle containing Patient,
   * DiagnosticReport, Observation, and CarePlan resources. The output has not
   * been profile-validated and must not be imported into a production EHR.
   */
  public generateFhirBundle(
    patient: PatientDigitalTwin,
    sessionResult: SessionRunResult | null
  ): any {
    const timestamp = new Date().toISOString();
    const patientRef = `urn:uuid:patient-${patient.patientId.toLowerCase()}`;

    return {
      resourceType: 'Bundle',
      type: 'collection',
      timestamp,
      meta: {
        tag: [{
          system: 'https://neurobridge.example/research-status',
          code: 'validation-pending',
          display: 'Research prototype; FHIR profile validation pending'
        }]
      },
      entry: [
        // 1. FHIR Patient Resource
        {
          fullUrl: patientRef,
          resource: {
            resourceType: 'Patient',
            id: patient.patientId,
            identifier: [
              {
                system: 'urn:ietf:rfc:3986',
                value: `urn:uuid:${patient.patientId}`
              }
            ],
            name: [{ use: 'official', text: patient.name }],
            meta: {
              tag: [{
                system: 'https://neurobridge.example/synthetic-profile',
                code: 'synthetic',
                display: `Synthetic research profile: ${patient.clinicalCondition}`
              }]
            }
          }
        },
        // 2. FHIR DiagnosticReport (Neuro-Rehab Acoustic Biomarker Report)
        {
          fullUrl: `urn:uuid:report-${Date.now()}`,
          resource: {
            resourceType: 'DiagnosticReport',
            status: 'preliminary',
            category: [
              {
                coding: [
                  {
                    system: 'http://loinc.org',
                    code: '72170-4',
                    display: 'Speech and Language assessment panel'
                  }
                ]
              }
            ],
            code: {
              coding: [
                {
                  system: 'http://snomed.info/sct',
                  code: '225656009',
                  display: 'Speech acoustic biomarker assessment (NeuroBridge SenseAssist)'
                }
              ],
              text: 'Seven-Stage Assistive Workflow Prototype Evaluation'
            },
            subject: { reference: patientRef },
            effectiveDateTime: timestamp,
            conclusion: sessionResult?.phenotype.summary || 'Acoustic evaluation completed.',
            conclusionCode: [
              {
                coding: [
                  {
                    system: 'http://who.int/icf',
                    code: 'b320',
                    display: 'Articulation functions'
                  },
                  {
                    system: 'http://who.int/icf',
                    code: 'b330',
                    display: 'Fluency and rhythm of speech functions'
                  }
                ]
              }
            ]
          }
        },
        // 3. FHIR Observation: Speaking Rate (WPM)
        {
          fullUrl: `urn:uuid:obs-wpm-${Date.now()}`,
          resource: {
            resourceType: 'Observation',
            status: 'final',
            code: {
              coding: [
                {
                  system: 'http://loinc.org',
                  code: '96556-6',
                  display: 'Speaking rate (Words Per Minute)'
                }
              ]
            },
            subject: { reference: patientRef },
            valueQuantity: {
              value: sessionResult?.biomarkers.speakingRateWpm || 76,
              unit: 'words/min',
              system: 'http://unitsofmeasure.org',
              code: '{words}/min'
            }
          }
        },
        // 4. FHIR Observation: Rhythm Stability Index
        {
          fullUrl: `urn:uuid:obs-rhythm-${Date.now()}`,
          resource: {
            resourceType: 'Observation',
            status: 'final',
            code: {
              coding: [
                {
                  system: 'http://snomed.info/sct',
                  code: '286541006',
                  display: 'Speech rhythm index'
                }
              ]
            },
            subject: { reference: patientRef },
            valueQuantity: {
              value: sessionResult?.biomarkers.rhythmStabilityIndex || 0.65,
              unit: 'score',
              system: 'http://unitsofmeasure.org',
              code: '1'
            }
          }
        },
        // 5. FHIR CarePlan: Adaptive Sensory-Motor Pacing
        {
          fullUrl: `urn:uuid:careplan-${Date.now()}`,
          resource: {
            resourceType: 'CarePlan',
            status: 'draft',
            intent: 'plan',
            title: 'Adaptive Tri-Modal Sensory-Motor Speech Recovery Protocol',
            subject: { reference: patientRef },
            activity: [
              {
                detail: {
                  kind: 'ServiceRequest',
                  code: {
                    text: `ESP32 Haptic Wearable Pacing @ ${sessionResult?.intervention.bpm || patient.preferredBpm} BPM (Pattern: ${sessionResult?.intervention.hapticPattern || '1-2-3-4'})`
                  },
                  status: 'not-started',
                  description: sessionResult?.intervention.clinicalRationale || 'Rhythmic tactile entrainment'
                }
              }
            ]
          }
        }
      ]
    };
  }
}

export const fhirExportService = new FhirExportService();
