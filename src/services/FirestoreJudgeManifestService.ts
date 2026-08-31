export interface FirestoreJudgeManifest {
  schemaVersion: string;
  systemName: string;
  cloudService: 'Cloud Firestore';
  evidenceLabel: 'synthetic-software-regression';
  scenarioCount: number;
  assertionCount: number;
  publicReadOnly: true;
  updatedAt: string;
}

interface FirestoreValue {
  stringValue?: string;
  integerValue?: string;
  booleanValue?: boolean;
  timestampValue?: string;
}

interface FirestoreDocument {
  fields?: Record<string, FirestoreValue>;
}

type FetchLike = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

export const FIRESTORE_JUDGE_MANIFEST_URL =
  'https://firestore.googleapis.com/v1/projects/gen-lang-client-0990479314/databases/(default)/documents/public_judge_manifest/neurobridge-senseassist';

function requireString(
  fields: Record<string, FirestoreValue>,
  key: string,
  variant: 'stringValue' | 'timestampValue' = 'stringValue'
): string {
  const value = fields[key]?.[variant];
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`Firestore judge manifest is missing ${key}.`);
  }
  return value;
}

function requireInteger(fields: Record<string, FirestoreValue>, key: string): number {
  const value = Number.parseInt(fields[key]?.integerValue ?? '', 10);
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new Error(`Firestore judge manifest has an invalid ${key}.`);
  }
  return value;
}

export async function loadFirestoreJudgeManifest(
  options: { signal?: AbortSignal; fetchImpl?: FetchLike } = {}
): Promise<FirestoreJudgeManifest> {
  const response = await (options.fetchImpl ?? fetch)(FIRESTORE_JUDGE_MANIFEST_URL, {
    method: 'GET',
    headers: { Accept: 'application/json' },
    signal: options.signal
  });

  if (!response.ok) {
    throw new Error(`Firestore judge manifest request failed with HTTP ${response.status}.`);
  }

  const payload = await response.json() as FirestoreDocument;
  const fields = payload.fields;
  if (!fields) {
    throw new Error('Firestore judge manifest contains no fields.');
  }

  const cloudService = requireString(fields, 'cloudService');
  const evidenceLabel = requireString(fields, 'evidenceLabel');
  const publicReadOnly = fields.publicReadOnly?.booleanValue;

  if (cloudService !== 'Cloud Firestore') {
    throw new Error('Firestore judge manifest has an unexpected cloud service.');
  }
  if (evidenceLabel !== 'synthetic-software-regression') {
    throw new Error('Firestore judge manifest has an unexpected evidence label.');
  }
  if (publicReadOnly !== true) {
    throw new Error('Firestore judge manifest must be read-only.');
  }

  return {
    schemaVersion: requireString(fields, 'schemaVersion'),
    systemName: requireString(fields, 'systemName'),
    cloudService,
    evidenceLabel,
    scenarioCount: requireInteger(fields, 'scenarioCount'),
    assertionCount: requireInteger(fields, 'assertionCount'),
    publicReadOnly,
    updatedAt: requireString(fields, 'updatedAt', 'timestampValue')
  };
}
