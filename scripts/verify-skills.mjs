import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";

const root = new URL("../skills/", import.meta.url);
const directories = (await readdir(root, { withFileTypes: true }))
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();

if (directories.length !== 2) {
  throw new Error(`Expected exactly 2 active product adapters, found ${directories.length}.`);
}

for (const name of directories) {
  const skill = await readFile(new URL(`${name}/SKILL.md`, root), "utf8");
  const script = await readFile(new URL(`${name}/scripts/run.mjs`, root), "utf8");

  if (!skill.startsWith("---\nname:")) throw new Error(`${name}: missing YAML frontmatter.`);
  if (!skill.includes(`name: ${name}`)) throw new Error(`${name}: frontmatter name mismatch.`);
  if (!skill.includes("## Evidence contract")) throw new Error(`${name}: missing evidence contract.`);
  if (!skill.includes("## Failure semantics")) throw new Error(`${name}: missing failure semantics.`);
  if (!skill.includes("## Do not")) throw new Error(`${name}: missing explicit prohibitions.`);
  if (!script.includes("adapterMain")) throw new Error(`${name}: wrapper does not use shared runner.`);
}

process.stdout.write(`Verified ${directories.length} executable product skills.\n`);
