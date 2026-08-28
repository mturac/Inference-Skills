#!/usr/bin/env node
import { runAdapterCli } from "../../../src/runner.mjs";

await runAdapterCli({
  product: "InferShape",
  envVar: "INFERSHAPE_BIN",
  defaultCommand: "infershape",
  args: process.argv.slice(2)
});
