import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import { test } from "node:test";
import { adapterMain, ProductCliError, resolveProductBinary, runProductCli } from "../src/runner.mjs";

function fakeChild({ code = 0, signal = null, error = null } = {}) {
  const child = new EventEmitter();
  queueMicrotask(() => {
    if (error) child.emit("error", error);
    else child.emit("exit", code, signal);
  });
  return child;
}

test("environment override selects the exact product binary", () => {
  assert.equal(resolveProductBinary({
    defaultBinary: "infershape",
    envVar: "INFERSHAPE_BIN",
    env: { INFERSHAPE_BIN: "/opt/tools/infershape" }
  }), "/opt/tools/infershape");
});

test("blank override falls back to PATH binary", () => {
  assert.equal(resolveProductBinary({
    defaultBinary: "vibeproof",
    envVar: "VIBEPROOF_BIN",
    env: { VIBEPROOF_BIN: "  " }
  }), "vibeproof");
});

test("runner forwards arguments without a shell and preserves exit status", async () => {
  let observed;
  const code = await runProductCli({
    product: "InferShape",
    defaultBinary: "infershape",
    envVar: "INFERSHAPE_BIN",
    args: ["analyze", "trace with spaces.jsonl", "--repair-out", "repair.json"],
    env: {},
    cwd: "/workspace",
    spawnImpl(command, args, options) {
      observed = { command, args, options };
      return fakeChild({ code: 2 });
    }
  });

  assert.equal(code, 2);
  assert.deepEqual(observed.command, "infershape");
  assert.deepEqual(observed.args, ["analyze", "trace with spaces.jsonl", "--repair-out", "repair.json"]);
  assert.equal(observed.options.shell, false);
  assert.equal(observed.options.cwd, "/workspace");
});

test("missing CLI becomes a typed actionable error", async () => {
  await assert.rejects(
    runProductCli({
      product: "VibeProof",
      defaultBinary: "vibeproof",
      envVar: "VIBEPROOF_BIN",
      args: ["verify", "."],
      spawnImpl() {
        const error = Object.assign(new Error("spawn vibeproof ENOENT"), { code: "ENOENT" });
        return fakeChild({ error });
      }
    }),
    (error) => {
      assert.ok(error instanceof ProductCliError);
      assert.equal(error.code, "PRODUCT_CLI_NOT_FOUND");
      assert.match(error.message, /VIBEPROOF_BIN/);
      return true;
    }
  );
});

test("adapter main maps missing CLI to exit 127", async () => {
  const original = process.stderr.write;
  let stderr = "";
  process.stderr.write = (chunk) => { stderr += String(chunk); return true; };
  try {
    const code = await adapterMain({
      product: "InferShape",
      defaultBinary: "definitely-not-installed-infershape",
      envVar: "INFERSHAPE_BIN",
      env: { PATH: "" }
    }, ["analyze", "trace.jsonl"]);
    assert.equal(code, 127);
    assert.match(stderr, /PRODUCT_CLI_NOT_FOUND/);
  } finally {
    process.stderr.write = original;
  }
});
