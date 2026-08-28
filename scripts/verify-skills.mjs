import { access, readFile } from "node:fs/promises";

const definitions = [
  {
    directory: "analyze-coding-session",
    name: "analyze-coding-session",
    product: "InferShape",
    environmentVariable: "INFERSHAPE_BIN"
  },
  {
    directory: "prove-running-product",
    name: "prove-running-product",
    product: "VibeProof",
    environmentVariable: "VIBEPROOF_BIN"
  }
];

for (const definition of definitions) {
  const skillUrl = new URL(`../skills/${definition.directory}/SKILL.md`, import.meta.url);
  const scriptUrl = new URL(`../skills/${definition.directory}/scripts/run.mjs`, import.meta.url);
  const markdown = await readFile(skillUrl, "utf8");
  const script = await readFile(scriptUrl, "utf8");

  if (!markdown.startsWith("---\n")) {
    throw new Error(`${definition.directory}/SKILL.md is missing front matter.`);
  }
  if (!markdown.includes(`name: ${definition.name}`)) {
    throw new Error(`${definition.directory}/SKILL.md has the wrong skill name.`);
  }
  if (!markdown.includes(definition.product)) {
    throw new Error(`${definition.directory}/SKILL.md does not bind ${definition.product}.`);
  }
  if (/\b(?:TODO|TBD)\b/.test(markdown)) {
    throw new Error(`${definition.directory}/SKILL.md contains a placeholder.`);
  }
  if (!script.startsWith("#!/usr/bin/env node")) {
    throw new Error(`${definition.directory}/scripts/run.mjs is missing its Node shebang.`);
  }
  if (!script.includes(definition.environmentVariable)) {
    throw new Error(`${definition.directory}/scripts/run.mjs is missing ${definition.environmentVariable}.`);
  }
  if (/\b(?:fetch|https?:\/\/)/.test(script)) {
    throw new Error(`${definition.directory}/scripts/run.mjs must not make network calls.`);
  }
  await access(scriptUrl);
}

process.stdout.write(`Verified ${definitions.length} executable product skills.\n`);
