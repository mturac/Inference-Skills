---
name: prove-running-product
description: Use VibeProof to establish that a vibe-coded repository installs from a clean clone, starts, serves, completes its browser journey, preserves required state across restart, and emits executable delivery evidence.
---

# Prove Running Product

Use this skill before accepting a coding agent's "done" claim for a user-facing repository.

## Preconditions

- `vibeproof` is installed and available on `PATH`, or `VIBEPROOF_BIN` names a trusted executable.
- The repository contains a reviewed `vibeproof.config.json` or the command supplies an explicit config path.
- Browser verification dependencies required by the project are available.

## Procedure

1. Start from the exact repository revision being evaluated.
2. Run the adapter:

```bash
node skills/prove-running-product/scripts/run.mjs \
  verify . \
  --config vibeproof.config.json \
  --out .vibeproof/latest
```

3. Read the product exit status.
4. Inspect `receipt.json`, screenshots, command logs, browser assertions, and restart/persistence evidence.
5. Accept completion only when the VibeProof verdict and required evidence are green for the exact revision.

## Evidence contract

Preserve:

- exact repository revision;
- product exit status;
- `receipt.json` or configured machine receipt;
- clean-clone install and build logs;
- start/health evidence;
- browser journey screenshots and assertions;
- API/database checks when configured;
- restart and persistence proof when required.

## Failure semantics

- Exit `0`: all required product-proof gates passed.
- Exit `2`: verification ran and the product failed one or more proof gates.
- Exit `127`: the VibeProof CLI was not installed or could not be resolved.
- Other non-zero exits: invalid configuration or operational failure.

A skipped or unconfigured journey is not a pass. A prior CI result for another SHA is not current proof.

## Do not

- Do not replace browser acceptance with unit-test counts.
- Do not accept a preview screenshot as proof that the clean clone starts.
- Do not reuse stale receipts after code or configuration changes.
- Do not hide restart, persistence, or browser failures behind a green build.
- Do not convert failure exit codes to success.
