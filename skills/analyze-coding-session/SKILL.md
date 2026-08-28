---
name: analyze-coding-session
description: Diagnose a coding-agent session with InferShape and produce evidence-backed findings plus a privacy-safe repair packet.
---

# Analyze Coding Session

Use this skill when a coding agent stalled, repeated exploration, churned through patches, escaped scope, or claimed completion without sufficient post-change proof.

This is an executable adapter for **InferShape**. It does not summarize inference engineering theory and does not invent findings with another model.

## Prerequisites

- Node.js 22 or newer.
- The `infershape` CLI available on `PATH`, or `INFERSHAPE_BIN` set to its absolute executable path.
- A JSON or JSONL session trace accepted by InferShape.

## Workflow

1. Preserve the original trace as read-only input.
2. Run the adapter with the same arguments you would pass to InferShape.
3. Request JSON, Markdown, HTML, and repair-packet outputs when handing work to another agent.
4. Treat a false-completion or unresolved-failure exit as a blocked delivery, not as a warning to ignore.

```bash
node skills/analyze-coding-session/scripts/run.mjs \
  analyze session.jsonl \
  --repo . \
  --json-out reports/session.json \
  --markdown-out reports/session.md \
  --html-out reports/session.html \
  --repair-out reports/repair.json \
  --fail-on-false-completion
```

## Evidence

Keep these artifacts together:

- normalized session report;
- human-readable diagnosis;
- standalone local HTML timeline;
- repair packet with verified facts and exact next actions;
- adapter and InferShape exit status.

Do not claim the underlying product is correct merely because the session was analyzed. Use the running-product proof skill for executable delivery evidence.

## Failure handling

- Exit `127`: InferShape was not found. Install it or set `INFERSHAPE_BIN`.
- Exit `2`: an explicit InferShape quality gate failed; preserve the report and keep the task blocked.
- Exit `1`: invalid input or operational failure; fix the trace/configuration before retrying.
- Never replace a failed run with an uncited narrative summary.
