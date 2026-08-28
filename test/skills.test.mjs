import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const skills = [
  {
    directory: "analyze-coding-session",
    name: "analyze-coding-session",
    product: "InferShape"
  },
  {
    directory: "prove-running-product",
    name: "prove-running-product",
    product: "VibeProof"
  }
];

function parseFrontMatter(markdown) {
  const match = markdown.match(/^---\n([\s\S]*?)\n---\n/);
  assert.ok(match, "SKILL.md must start with YAML front matter");
  return Object.fromEntries(
    match[1].split("\n").map((line) => {
      const index = line.indexOf(":");
      assert.ok(index > 0, `invalid front matter line: ${line}`);
      return [line.slice(0, index).trim(), line.slice(index + 1).trim().replace(/^"|"$/g, "")];
    })
  );
}

for (const skill of skills) {
  test(`${skill.name} is an executable product adapter`, async () => {
    const skillUrl = new URL(`../skills/${skill.directory}/SKILL.md`, import.meta.url);
    const scriptUrl = new URL(`../skills/${skill.directory}/scripts/run.mjs`, import.meta.url);
    const markdown = await readFile(skillUrl, "utf8");
    const frontMatter = parseFrontMatter(markdown);

    assert.equal(frontMatter.name, skill.name);
    assert.ok(frontMatter.description.length >= 40);
    assert.match(markdown, new RegExp(skill.product));
    assert.match(markdown, /## Workflow/);
    assert.match(markdown, /## Evidence/);
    assert.match(markdown, /## Failure handling/);
    assert.doesNotMatch(markdown, /\b(?:TODO|TBD)\b/);
    await access(scriptUrl);
  });
}
