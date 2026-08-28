import { chmod, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    encoding: "utf8",
    ...options
  });
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(" ")} failed\n${result.stdout}\n${result.stderr}`);
  }
  return result;
}

const root = resolve(new URL("..", import.meta.url).pathname);
const pack = run("npm", ["pack", "--json", "--ignore-scripts"], { cwd: root });
const [{ filename }] = JSON.parse(pack.stdout);
const archive = join(root, filename);
const listing = run("tar", ["-tzf", archive]).stdout.split("\n").filter(Boolean);
const required = [
  "package/skills/analyze-coding-session/SKILL.md",
  "package/skills/analyze-coding-session/scripts/run.mjs",
  "package/skills/prove-running-product/SKILL.md",
  "package/skills/prove-running-product/scripts/run.mjs",
  "package/src/runner.mjs"
];
for (const path of required) {
  if (!listing.includes(path)) {
    throw new Error(`Packed archive is missing ${path}.`);
  }
}

const consumer = await mkdtemp(join(tmpdir(), "inference-skills-consumer-"));
try {
  run("npm", ["init", "-y"], { cwd: consumer });
  run("npm", ["install", "--ignore-scripts", archive], { cwd: consumer });

  const fake = join(consumer, "fake-infershape.mjs");
  const output = join(consumer, "argv.json");
  await writeFile(
    fake,
    `#!/usr/bin/env node\nimport { writeFileSync } from "node:fs";\nwriteFileSync(process.env.FAKE_OUTPUT, JSON.stringify(process.argv.slice(2)));\n`,
    "utf8"
  );
  await chmod(fake, 0o755);

  const wrapper = join(
    consumer,
    "node_modules",
    "@mturac",
    "inference-skills",
    "skills",
    "analyze-coding-session",
    "scripts",
    "run.mjs"
  );
  run(process.execPath, [wrapper, "analyze", "session.jsonl", "--repo", "."], {
    cwd: consumer,
    env: {
      ...process.env,
      INFERSHAPE_BIN: fake,
      FAKE_OUTPUT: output
    }
  });

  const args = JSON.parse(await readFile(output, "utf8"));
  if (JSON.stringify(args) !== JSON.stringify(["analyze", "session.jsonl", "--repo", "."])) {
    throw new Error(`Installed adapter changed arguments: ${JSON.stringify(args)}`);
  }
} finally {
  await rm(consumer, { recursive: true, force: true });
  await rm(archive, { force: true });
}

process.stdout.write("Package smoke verification passed.\n");
