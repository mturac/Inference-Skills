#!/usr/bin/env node
import { adapterMain } from "../../../src/runner.mjs";

const code = await adapterMain({
  product: "InferShape",
  defaultBinary: "infershape",
  envVar: "INFERSHAPE_BIN"
});

process.exitCode = code;
