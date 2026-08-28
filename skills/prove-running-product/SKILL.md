---
name: prove-running-product
description: Verify a vibe-coded web product with VibeProof using clean-clone, browser, restart, persistence, and evidence gates.
---

# Prove Running Product

Use this skill before accepting a coding agent's claim that a web product is complete. The required outcome is executable proof that a clean checkout installs, starts, responds, completes its browser journey, and preserves state when restart persistence is part of the contract.

This is an executable adapter for **VibeProof**. It does not treat test counts, screenshots, or a developer's local working tree as sufficient proof on their own.

## Prerequisites

- Node.js 22 or newer.
- The `vibeproof` CLI available on `PATH`, or `VIBEPROOF_BIN` set to its absolute executable path.
- A committed repository state and a strict VibeProof configuration.
- A Chromium-compatible browser for browser-journey gates.

## Workflow

1. Ensure the exact source commit is committed and the working tree is clean.
2. Run VibeProof against that source and configuration.
3. Require every declared install, build, start, health, API, browser, restart, and persistence gate to pass.
4. Keep screenshots, bounded logs, and the sealed receipt with the exact commit they prove.

```bash
node skills/prove-running-product/scripts/run.mjs \
  verify . \
  --config vibeproof.config.json
```

## Evidence

A valid handoff includes:

- exact source commit;
- clean-clone result;
- start and health evidence;
- browser journey screenshots;
- API and persistence checks when configured;
- restart result;
- sealed VibeProof receipt and its verification status.

A screenshot without executable gates is presentation evidence, not product proof.

## Failure handling

- Exit `127`: VibeProof was not found. Install it or set `VIBEPROOF_BIN`.
- Any failed declared gate keeps delivery blocked.
- Do not weaken the configuration after seeing a failure merely to obtain green output.
- Re-run the full contract after the source commit changes; stale receipts do not prove a new tree.
