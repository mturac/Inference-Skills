---
name: analyze-coding-session
description: Diagnose a coding-agent session with InferShape when work stalled, looped, churned, escaped scope, or claimed completion without proof, and produce a bounded repair handoff.
---

# Analyze Coding Session

Use this skill when a Codex, Claude Code, Cursor, OpenHands, or custom coding-agent session needs evidence-based diagnosis or continuation.

## Preconditions

- `infershape` is installed and available on `PATH`, or `INFERSHAPE_BIN` names a trusted executable.
- The input is a supported JSON or JSONL session trace.
- Repository-relative paths may remain visible in the generated evidence.

## Procedure

1. Preserve the original trace without editing it.
2. Run the adapter with an explicit repository root and all required outputs:

```bash
node skills/analyze-coding-session/scripts/run.mjs \
  analyze session.jsonl \
  --repo . \
  --json-out reports/session.json \
  --markdown-out reports/session.md \
  --html-out reports/session.html \
  --repair-out reports/repair.json \
  --fail-on-false-completion \
  --fail-on-open-failures
```

3. Read the product exit status before interpreting the report.
4. Inspect the human report and repair packet.
5. Resume from the repair packet's verified facts and next actions; do not repeat repository discovery that the packet already proves.

## Evidence contract

Preserve:

- product exit status;
- `session.json` machine report;
- `session.md` human report;
- `session.html` local visual report when requested;
- `repair.json` bounded continuation packet;
- input trace identity and repository revision outside the report when reproducibility matters.

## Failure semantics

- Exit `0`: analysis completed and requested failure gates did not fire.
- Exit `2`: InferShape completed but detected a requested quality-gate failure such as false completion or unresolved failures.
- Exit `127`: the InferShape CLI was not installed or could not be resolved.
- Other non-zero exits: invalid input or operational failure.

A non-zero exit is not permission to discard generated evidence. Inspect artifacts that were written before deciding the next action.

## Do not

- Do not claim the coding task is complete because analysis itself ran successfully.
- Do not treat a high passing-test count as semantic completion.
- Do not expose hidden reasoning, prompt bodies, tool arguments, or tool results.
- Do not ask an LLM to replace InferShape's deterministic findings.
- Do not convert failure exit codes to success.
