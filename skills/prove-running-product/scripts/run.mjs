#!/usr/bin/env node
import { adapterMain } from "../../../src/runner.mjs";

const code = await adapterMain({
  product: "VibeProof",
  defaultBinary: "vibeproof",
  envVar: "VIBEPROOF_BIN"
});

process.exitCode = code;
