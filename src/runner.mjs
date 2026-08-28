import { spawn } from "node:child_process";

export function resolveExecutable({ env = process.env, envVar, defaultCommand }) {
  const override = env[envVar]?.trim();
  return override || defaultCommand;
}

export async function runAdapter({
  product,
  envVar,
  defaultCommand,
  args,
  env = process.env,
  stdio = "inherit"
}) {
  const executable = resolveExecutable({ env, envVar, defaultCommand });

  return await new Promise((resolve, reject) => {
    const child = spawn(executable, args, {
      env,
      shell: false,
      stdio
    });

    child.once("error", (error) => {
      if (error?.code === "ENOENT") {
        const missing = new Error(
          `${product} CLI was not found. Put '${defaultCommand}' on PATH or set ${envVar} to its absolute executable path.`
        );
        missing.code = "PRODUCT_CLI_NOT_FOUND";
        reject(missing);
        return;
      }
      reject(error);
    });

    child.once("exit", (code, signal) => {
      resolve({
        code: Number.isInteger(code) ? code : 1,
        signal: signal ?? null
      });
    });
  });
}

export async function runAdapterCli(options) {
  try {
    const result = await runAdapter(options);
    if (result.signal) {
      process.stderr.write(`${options.product} terminated with signal ${result.signal}.\n`);
      process.exitCode = 1;
      return;
    }
    process.exitCode = result.code;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`${message}\n`);
    process.exitCode = error?.code === "PRODUCT_CLI_NOT_FOUND" ? 127 : 1;
  }
}
