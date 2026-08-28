#!/usr/bin/env node
import { runAdapterCli } from "../../../src/runner.mjs";

await runAdapterCli({
  product: "VibeProof",
  envVar: "VIBEPROOF_BIN",
  defaultCommand: "vibeproof",
  args: process.argv.slice(2)
});
