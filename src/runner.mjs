import { spawn } from "node:child_process";

export class ProductCliError extends Error {
  constructor(code, message, details = {}) {
    super(message);
    this.name = "ProductCliError";
    this.code = code;
    this.details = details;
  }
}

function isPathLike(value) {
  return value.includes("/") || value.includes("\\") || value.startsWith(".");
}

export function resolveProductBinary({ defaultBinary, envVar, env = process.env }) {
  const override = env[envVar]?.trim();
  return override || defaultBinary;
}

export function runProductCli({
  product,
  defaultBinary,
  envVar,
  args,
  env = process.env,
  cwd = process.cwd(),
  stdio = "inherit",
  spawnImpl = spawn
}) {
  if (!Array.isArray(args)) {
    throw new ProductCliError("INVALID_ARGUMENTS", "Product CLI arguments must be an array.");
  }

  const command = resolveProductBinary({ defaultBinary, envVar, env });

  return new Promise((resolve, reject) => {
    const child = spawnImpl(command, args, {
      cwd,
      env,
      stdio,
      shell: false,
      windowsHide: true
    });

    child.once("error", (error) => {
      if (error?.code === "ENOENT") {
        reject(new ProductCliError(
          "PRODUCT_CLI_NOT_FOUND",
          `${product} CLI was not found. Install '${defaultBinary}' or set ${envVar} to an executable path.`,
          { product, command, envVar, pathLike: isPathLike(command) }
        ));
        return;
      }

      reject(new ProductCliError(
        "PRODUCT_CLI_SPAWN_FAILED",
        `Failed to start ${product} CLI: ${error?.message ?? "unknown spawn error"}`,
        { product, command, causeCode: error?.code ?? null }
      ));
    });

    child.once("exit", (code, signal) => {
      if (signal) {
        reject(new ProductCliError(
          "PRODUCT_CLI_SIGNALLED",
          `${product} CLI terminated by signal ${signal}.`,
          { product, command, signal }
        ));
        return;
      }

      resolve(Number.isInteger(code) ? code : 1);
    });
  });
}

export async function adapterMain(config, argv = process.argv.slice(2)) {
  try {
    return await runProductCli({ ...config, args: argv });
  } catch (error) {
    if (error instanceof ProductCliError) {
      process.stderr.write(`${JSON.stringify({ error: error.code, message: error.message, details: error.details })}\n`);
      return error.code === "PRODUCT_CLI_NOT_FOUND" ? 127 : 1;
    }
    throw error;
  }
}
