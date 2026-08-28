# Inference Skills

[![CI](https://github.com/mturac/Inference-Skills/actions/workflows/ci.yml/badge.svg)](https://github.com/mturac/Inference-Skills/actions/workflows/ci.yml)
[![License](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D22-339933.svg)](package.json)

**Executable skills for vibe-coding products. No chapter summaries, no hidden model calls, no fake integrations.**

Inference Skills is the thin agent-facing layer for the Vibe Coding Tool Suite. Each skill calls a real product CLI, passes arguments without shell interpolation, preserves the product exit status, and emits the product's own evidence artifacts.

## Active skills

| Skill | Product | User outcome |
|---|---|---|
| [`analyze-coding-session`](skills/analyze-coding-session/SKILL.md) | [InferShape](https://github.com/mturac/InferShape) | Diagnose why a coding-agent session stalled or falsely completed and produce a repair packet |
| [`prove-running-product`](skills/prove-running-product/SKILL.md) | [VibeProof](https://github.com/mturac/VibeProof) | Prove clean clone, start, browser journey, restart, persistence, and executable delivery evidence |

Adapters are added only after their backing product exists on GitHub and has a verified main branch. The repository intentionally does not ship placeholder adapters for RepoPack, PatchLens, or ModelFit.

## Quick start

Clone this repository and install each backing product CLI separately:

```bash
git clone https://github.com/mturac/Inference-Skills.git
cd Inference-Skills
npm ci --ignore-scripts
npm run verify
```

Run InferShape through the skill adapter:

```bash
node skills/analyze-coding-session/scripts/run.mjs \
  analyze session.jsonl \
  --repo . \
  --repair-out reports/repair.json \
  --fail-on-false-completion
```

Run VibeProof through the skill adapter:

```bash
node skills/prove-running-product/scripts/run.mjs \
  verify . \
  --config vibeproof.config.json
```

## CLI resolution

By default, adapters resolve `infershape` and `vibeproof` through `PATH`. Explicit absolute paths are supported:

```bash
INFERSHAPE_BIN=/opt/vibe-tools/infershape \
  node skills/analyze-coding-session/scripts/run.mjs analyze session.jsonl

VIBEPROOF_BIN=/opt/vibe-tools/vibeproof \
  node skills/prove-running-product/scripts/run.mjs verify . --config vibeproof.config.json
```

The adapter never invokes a shell, downloads a product, rewrites arguments, or sends telemetry.

## Exit behavior

- The backing product's numeric exit status is propagated unchanged.
- Missing product CLIs exit `127` with an actionable message.
- Spawn or signal failures exit `1`.
- Product quality-gate failures remain failures; the adapter does not turn them green.

## Agent installation

Copy or symlink an individual directory under `skills/` into the skill directory supported by your coding-agent tool. Keep the sibling `src/runner.mjs` available at the repository-relative path used by the scripts, or install the complete npm package.

The `SKILL.md` file explains when the skill applies, which evidence must be preserved, and how failure states constrain completion claims.

## Development

```bash
npm run verify
```

Verification covers:

1. syntax checks for the shared runner and both adapters;
2. exact argument passthrough;
3. PATH and environment-variable CLI resolution;
4. exit-code propagation and missing-CLI behavior;
5. skill metadata and required evidence/failure sections;
6. real npm tarball contents, installation, and installed-adapter execution.

## Security

Adapters execute a selected local binary without `shell: true`. Treat environment overrides as executable trust boundaries and point them only to binaries you control. See [SECURITY.md](SECURITY.md).

## License

Apache License 2.0. See [LICENSE](LICENSE) and [NOTICE](NOTICE).
