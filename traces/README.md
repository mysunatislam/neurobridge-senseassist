# Development trace evidence

This directory contains the submission-safe development-agent trace for NeuroBridge SenseAssist. It deliberately separates three different kinds of artifact:

| Artifact | What it is | What it proves |
| --- | --- | --- |
| `DEVELOPMENT_TRACE.redacted.jsonl` | A 1,129-event privacy-reviewed derivative of the Antigravity system transcript | Preserved instructions, planning, tool activity, feedback, errors, retries, and checkpoints during the retained development window |
| `../AGENT_TRAJECTORIES.json` | Synthetic application-runtime fixture | The UI/runtime trace structure only; it is not a build trace or patient record |
| `../DEVELOPMENT_TRAJECTORY.json` | Retrospective human-readable summary | Navigation and project narrative only; it is not raw evidence |

`TRACE_MANIFEST.json` records the SHA-256 digest, size, event count, time span, classifications, redaction policy, and known gaps. `TRACE_SCHEMA.json` defines each redacted JSONL event.

## Privacy and authenticity

The untouched Antigravity transcript remains in Antigravity's private application state. It is not copied into this repository because a raw system export may contain local paths, uploaded-media locations, personal information, signed URLs, or credentials. The manifest includes the raw snapshot's digest, and every exported event includes the SHA-256 of its exact pre-redaction content. This preserves a verifiable link without publishing private material.

No missing history was invented. The source itself records that earlier context was truncated; the manifest calls out that gap.

## Verify the committed derivative

From the repository root on Windows:

```powershell
Get-FileHash -Algorithm SHA256 traces/DEVELOPMENT_TRACE.redacted.jsonl
```

Expected digest for the checked-in snapshot:

```text
42f317da057fd55afcc4f21dc9ac5b92ffdbe8a38e44c700fcaef443bb2cfe04
```

The file should contain 1,129 valid JSON objects, one per line, with contiguous `sequence` values from `0` through `1128`.

## Regenerate from the private source

Only a project owner with access to the original Antigravity state can regenerate the derivative:

```powershell
./traces/export-antigravity-trace.ps1 -SourceTranscript '<path-to-private-transcript.jsonl>'
```

After regenerating, review the output, run a secret scanner, recalculate its hash, and update `TRACE_MANIFEST.json`. Do not place unredacted transcripts under `traces/`; `.gitignore` excludes `traces/raw/` and `traces/private/` as an additional guard.

