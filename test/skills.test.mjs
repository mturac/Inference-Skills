import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import { test } from "node:test";

const root = new URL("../", import.meta.url);

for (const [name, product, envVar] of [
  ["analyze-coding-session", "InferShape", "INFERSHAPE_BIN"],
  ["prove-running-product", "VibeProof", "VIBEPROOF_BIN"]
]) {
  test(`${name} has executable metadata and a real product wrapper`, async () => {
    const skill = await readFile(new URL(`skills/${name}/SKILL.md`, root), "utf8");
    const wrapperUrl = new URL(`skills/${name}/scripts/run.mjs`, root);
    const wrapper = await readFile(wrapperUrl, "utf8");
    const metadata = await stat(wrapperUrl);

    assert.match(skill, new RegExp(`name: ${name}`));
    assert.match(skill, /## Evidence contract/);
    assert.match(skill, /## Failure semantics/);
    assert.match(skill, /## Do not/);
    assert.match(skill, new RegExp(product));
    assert.match(wrapper, /adapterMain/);
    assert.match(wrapper, new RegExp(envVar));
    assert.ok(metadata.isFile());
  });
}
