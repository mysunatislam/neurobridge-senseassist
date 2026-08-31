import { describe, expect, it, vi } from 'vitest';
import {
  FIRESTORE_JUDGE_MANIFEST_URL,
  loadFirestoreJudgeManifest
} from '../src/services/FirestoreJudgeManifestService';

describe('Firestore judge manifest', () => {
  it('loads and validates the public read-only manifest', async () => {
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify({
      fields: {
        schemaVersion: { stringValue: '1.0.0' },
        systemName: { stringValue: 'NeuroBridge SenseAssist' },
        cloudService: { stringValue: 'Cloud Firestore' },
        evidenceLabel: { stringValue: 'synthetic-software-regression' },
        scenarioCount: { integerValue: '10' },
        assertionCount: { integerValue: '80' },
        publicReadOnly: { booleanValue: true },
        updatedAt: { timestampValue: '2026-08-31T19:17:06Z' }
      }
    }), { status: 200 }));

    const manifest = await loadFirestoreJudgeManifest({ fetchImpl });

    expect(fetchImpl).toHaveBeenCalledWith(
      FIRESTORE_JUDGE_MANIFEST_URL,
      expect.objectContaining({ method: 'GET' })
    );
    expect(manifest).toMatchObject({
      cloudService: 'Cloud Firestore',
      scenarioCount: 10,
      assertionCount: 80,
      publicReadOnly: true
    });
  });

  it('rejects a manifest that is not marked read-only', async () => {
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify({
      fields: {
        schemaVersion: { stringValue: '1.0.0' },
        systemName: { stringValue: 'NeuroBridge SenseAssist' },
        cloudService: { stringValue: 'Cloud Firestore' },
        evidenceLabel: { stringValue: 'synthetic-software-regression' },
        scenarioCount: { integerValue: '10' },
        assertionCount: { integerValue: '80' },
        publicReadOnly: { booleanValue: false },
        updatedAt: { timestampValue: '2026-08-31T19:17:06Z' }
      }
    }), { status: 200 }));

    await expect(loadFirestoreJudgeManifest({ fetchImpl })).rejects.toThrow(
      'Firestore judge manifest must be read-only.'
    );
  });
});
