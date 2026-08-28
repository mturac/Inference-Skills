import assert from "node:assert/strict";
import { chmod, mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { delimiter, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import test from "node:test";

import { resolveExecutable } from "../src/runner.mjs";

async function makeFakeBinary(directory, name) {
  const path = join(directory, name);
  await writeFile(
    path,
    `#!/usr/bin/env node\nimport { writeFileSync } from "node:fs";\nwriteFileSync(process.env.FAKE_OUTPUT, JSON.stringify(process.argv.slice(2)));\nprocess.exit(Number(process.env.FAKE_EXIT ?? 0));\n`,
    "utf8"
  );
  await chmod(path, 0o755);
  return path;
}

test("resolveExecutable prefers a non-empty explicit override", () => {
  assert.equal(
    resolveExecutable({ env: { INFERSHAPE_BIN: "/opt/tools/infershape" }, envVar: "INFERSHAPE_BIN", defaultCommand: "infershape" }),
    "/opt/tools/infershape"
  );
  assert.equal(
    resolveExecutable({ env: { INFERSHAPE_BIN: "   " }, envVar: "INFERSHAPE_BIN", defaultCommand: "infershape" }),
    "infershape"
  );
});

test("analyze-coding-session passes arguments unchanged and propagates exit status", async () => {
  const directory = await mkdtemp(join(tmpdir(), "inference-skills-"));
  const fake = await makeFakeBinary(directory, "fake-infershape");
  const output = join(directory, "argv.json");
  const wrapper = fileURLToPath(new URL("../skills/analyze-coding-session/scripts/run.mjs", import.meta.url));
  const args = ["analyze", "session file.jsonl", "--repo", "/tmp/repo", "--fail-on-false-completion"];

  const result = spawnSync(process.execPath, [wrapper, ...args], {
    encoding: "utf8",
    env: {
      ...process.env,
      INFERSHAPE_BIN: fake,
      FAKE_OUTPUT: output,
      FAKE_EXIT: "7"
    }
  });

  assert.equal(result.status, 7);
  assert.deepEqual(JSON.parse(await readFile(output, "utf8")), args);
});

test("prove-running-product can resolve the product CLI through PATH", async () => {
  const directory = await mkdtemp(join(tmpdir(), "inference-skills-"));
  await makeFakeBinary(directory, "vibeproof");
  const output = join(directory, "argv.json");
  const wrapper = fileURLToPath(new URL("../skills/prove-running-product/scripts/run.mjs", import.meta.url));
  const args = ["verify", ".", "--config", "vibeproof.config.json"];

  const result = spawnSync(process.execPath, [wrapper, ...args], {
    encoding: "utf8",
    env: {
      ...process.env,
      VIBEPROOF_BIN: "",
      PATH: `${directory}${delimiter}${process.env.PATH ?? ""}`,
      FAKE_OUTPUT: output
    }
  });

  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(JSON.parse(await readFile(output, "utf8")), args);
});

test("missing product CLI fails with an actionable message and exit 127", () => {
  const wrapper = fileURLToPath(new URL("../skills/analyze-coding-session/scripts/run.mjs", import.meta.url));
  const result = spawnSync(process.execPath, [wrapper, "analyze", "session.jsonl"], {
    encoding: "utf8",
    env: {
      ...process.env,
      INFERSHAPE_BIN: "definitely-not-installed-infershape",
      PATH: ""
    }
  });

  assert.equal(result.status, 127);
  assert.match(result.stderr, /InferShape CLI was not found/);
  assert.match(result.stderr, /INFERSHAPE_BIN/);
  assert.doesNotMatch(result.stderr, /at runAdapter/);
});
