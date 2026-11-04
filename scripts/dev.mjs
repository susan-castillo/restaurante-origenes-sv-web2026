import { spawn, spawnSync } from "node:child_process";
import { constants, existsSync, copyFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const phpCommand = process.env.PHP_BIN || "php";
const npmCli = process.env.npm_execpath ||
  resolve(dirname(process.execPath), "node_modules/npm/bin/npm-cli.js");
const services = [];
let stopping = false;

function commandExists(command) {
  const result = spawnSync(command, ["--version"], {
    stdio: "ignore",
    windowsHide: true,
  });
  return !result.error && result.status === 0;
}

function ensureEnv(directory) {
  const envPath = resolve(root, directory, ".env");
  const examplePath = `${envPath}.example`;
  if (!existsSync(envPath)) {
    if (!existsSync(examplePath)) {
      throw new Error(`Missing environment template: ${examplePath}`);
    }
    copyFileSync(examplePath, envPath, constants.COPYFILE_EXCL);
    console.log(`Created ${directory}/.env`);
  }
}

function installDependencies(directory) {
  const appPath = resolve(root, directory);
  if (existsSync(resolve(appPath, "node_modules"))) return;

  console.log(`Installing dependencies in ${directory}...`);
  const result = spawnSync(process.execPath, [npmCli, "ci"], {
    cwd: appPath,
    stdio: "inherit",
    windowsHide: true,
  });
  if (result.error || result.status !== 0) {
    throw new Error(`npm ci failed in ${directory}`);
  }
}

function startService(label, command, args, cwd, env = process.env) {
  const child = spawn(command, args, {
    cwd,
    env,
    stdio: "inherit",
    windowsHide: true,
  });
  child.on("error", (error) => {
    console.error(`${label} failed to start: ${error.message}`);
    stopAll(1);
  });
  child.on("exit", (code, signal) => {
    if (!stopping) {
      console.error(`${label} exited (${signal || code}); stopping development services.`);
      stopAll(code || 1);
    }
  });
  services.push(child);
}

function stopAll(exitCode = 0) {
  if (stopping) return;
  stopping = true;
  for (const service of services) {
    if (service.exitCode === null && !service.killed) service.kill();
  }
  process.exitCode = exitCode;
}

try {
  if (!process.versions.node) {
    throw new Error("Node.js is required.");
  }
  if (!existsSync(npmCli)) {
    throw new Error("npm was not found. Install npm or set npm_execpath.");
  }

  ensureEnv("apps/backend");
  ensureEnv("apps/frontend");
  ensureEnv("apps/gateway");
  installDependencies("apps/backend");
  installDependencies("apps/frontend");

  const hasPhp = commandExists(phpCommand);
  if (!hasPhp) {
    console.warn("PHP is not installed; Vite will proxy directly to Express.");
  }

  const frontendEnv = {
    ...process.env,
    VITE_BACKEND_URL: hasPhp ? "http://127.0.0.1:8080" : "http://127.0.0.1:3000",
  };

  startService(
    "backend",
    process.execPath,
    ["--watch", "src/index.js"],
    resolve(root, "apps/backend"),
  );
  if (hasPhp) {
    startService(
      "PHP gateway",
      phpCommand,
      ["-S", "127.0.0.1:8080", "index.php"],
      resolve(root, "apps/gateway"),
    );
  }
  startService(
    "frontend",
    process.execPath,
    ["node_modules/vite/bin/vite.js", "--host", "127.0.0.1"],
    resolve(root, "apps/frontend"),
    frontendEnv,
  );
  console.log("Development services started. Press Ctrl+C to stop.");
} catch (error) {
  console.error(error.message);
  stopAll(1);
}

process.on("SIGINT", () => stopAll(0));
process.on("SIGTERM", () => stopAll(0));
