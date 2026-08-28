import { execFileSync, spawnSync } from "node:child_process";
import { chmodSync, cpSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const temp = mkdtempSync(join(tmpdir(), "inference-skills-package-"));

try {
  const packOutput = execFileSync("npm", ["pack", "--json"], { cwd: root, encoding: "utf8" });
  const [{ filename, files }] = JSON.parse(packOutput);
  const paths = files.map((entry) => entry.path).sort();

  for (const required of [
    "skills/analyze-coding-session/SKILL.md",
    "skills/analyze-coding-session/scripts/run.mjs",
    "skills/prove-running-product/SKILL.md",
    "skills/prove-running-product/scripts/run.mjs",
    "src/runner.mjs"
  ]) {
    if (!paths.includes(required)) throw new Error(`Packed artifact is missing ${required}.`);
  }

  if (paths.some((path) => path.startsWith("test/") || path.startsWith(".github/"))) {
    throw new Error("Packed artifact includes development-only files.");
  }

  const project = join(temp, "consumer");
  mkdirSync(project, { recursive: true });
  writeFileSync(join(project, "package.json"), JSON.stringify({ type: "module", private: true }, null, 2));
  execFileSync("npm", ["install", "--ignore-scripts", join(root, filename)], { cwd: project, stdio: "pipe" });

  const fakeBin = join(project, "fake-infershape.mjs");
  writeFileSync(fakeBin, "#!/usr/bin/env node\nprocess.stdout.write(JSON.stringify(process.argv.slice(2)));\n");
  chmodSync(fakeBin, 0o755);

  const adapter = join(project, "node_modules", "@mturac", "inference-skills", "skills", "analyze-coding-session", "scripts", "run.mjs");
  const run = spawnSync(process.execPath, [adapter, "analyze", "session.jsonl", "--repair-out", "repair.json"], {
    cwd: project,
    env: { ...process.env, INFERSHAPE_BIN: fakeBin },
    encoding: "utf8"
  });

  if (run.status !== 0) throw new Error(run.stderr || `Installed adapter exited ${run.status}.`);
  const forwarded = JSON.parse(run.stdout);
  if (JSON.stringify(forwarded) !== JSON.stringify(["analyze", "session.jsonl", "--repair-out", "repair.json"])) {
    throw new Error(`Installed adapter changed arguments: ${run.stdout}`);
  }

  rmSync(join(root, filename));
  process.stdout.write(`Package smoke passed with ${paths.length} files.\n`);
} finally {
  rmSync(temp, { recursive: true, force: true });
}
