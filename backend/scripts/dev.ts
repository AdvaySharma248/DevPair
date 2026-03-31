import { execFileSync, spawn, type ChildProcess } from "node:child_process";
import { existsSync, readdirSync, watch, type FSWatcher } from "node:fs";
import { join, relative, resolve } from "node:path";

const backendRoot = process.cwd();
const serverEntry = resolve(backendRoot, "src/server.ts");
const sourceDirectory = resolve(backendRoot, "src");
const envFilePath = resolve(backendRoot, ".env");
const restartDebounceMs = 200;
const forcedKillDelayMs = 2000;
const port = Number(process.env.PORT || "4000");

let serverProcess: ChildProcess | null = null;
let watchers: FSWatcher[] = [];
let restartTimer: NodeJS.Timeout | null = null;
let isRestarting = false;
let isShuttingDown = false;

function log(message: string) {
  console.log(`[dev] ${message}`);
}

function isRelevantChange(filename: string) {
  return /\.(ts|d\.ts|json)$/.test(filename) || filename === ".env";
}

function stopServer(reason: string) {
  return new Promise<void>((resolveStop) => {
    if (!serverProcess || serverProcess.killed) {
      serverProcess = null;
      resolveStop();
      return;
    }

    const processToStop = serverProcess;
    let resolved = false;

    const finish = () => {
      if (resolved) {
        return;
      }

      resolved = true;
      if (serverProcess === processToStop) {
        serverProcess = null;
      }
      resolveStop();
    };

    const forcedKillTimer = setTimeout(() => {
      if (!processToStop.killed) {
        log(`Force killing backend after ${reason}...`);
        processToStop.kill("SIGKILL");
      }
    }, forcedKillDelayMs);

    processToStop.once("exit", () => {
      clearTimeout(forcedKillTimer);
      finish();
    });

    log(`Stopping backend (${reason})...`);
    processToStop.kill("SIGTERM");
  });
}

function startServer() {
  if (isShuttingDown) {
    return;
  }

  log("Starting backend server...");
  serverProcess = spawn(
    process.execPath,
    ["--env-file=.env", "--experimental-strip-types", serverEntry],
    {
      cwd: backendRoot,
      stdio: "inherit",
      windowsHide: true,
    },
  );

  serverProcess.once("exit", (code, signal) => {
    if (serverProcess?.exitCode === code && serverProcess.signalCode === signal) {
      serverProcess = null;
    }

    if (!isRestarting && !isShuttingDown && code !== 0) {
      log(`Backend exited with code ${code ?? "null"}${signal ? ` (signal ${signal})` : ""}. Waiting for file changes...`);
    }
  });
}

async function restartServer(reason: string) {
  if (isShuttingDown) {
    return;
  }

  isRestarting = true;
  await stopServer(reason);
  startServer();
  isRestarting = false;
}

function scheduleRestart(reason: string) {
  if (isShuttingDown) {
    return;
  }

  if (restartTimer) {
    clearTimeout(restartTimer);
  }

  restartTimer = setTimeout(() => {
    void restartServer(reason);
  }, restartDebounceMs);
}

function watchDirectoryRecursive(directory: string) {
  const watcher = watch(directory, (eventType, filename) => {
    const changedFile = filename?.toString();

    if (!changedFile || !isRelevantChange(changedFile)) {
      return;
    }

    const changedPath = join(directory, changedFile);
    log(`Detected ${eventType} in ${relative(backendRoot, changedPath)}. Restarting...`);
    scheduleRestart(`change in ${relative(backendRoot, changedPath)}`);
  });

  watchers.push(watcher);

  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      watchDirectoryRecursive(join(directory, entry.name));
    }
  }
}

function watchEnvironmentFile() {
  if (!existsSync(envFilePath)) {
    return;
  }

  const watcher = watch(envFilePath, () => {
    log("Detected change in .env. Restarting...");
    scheduleRestart("change in .env");
  });

  watchers.push(watcher);
}

function closeWatchers() {
  for (const watcher of watchers) {
    watcher.close();
  }

  watchers = [];
}

function killStaleBackendOnPort() {
  if (process.platform !== "win32") {
    return;
  }

  const command = `
    $listener = Get-NetTCPConnection -LocalPort ${port} -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1;
    if (-not $listener) { exit 0 }
    $process = Get-CimInstance Win32_Process -Filter "ProcessId = $($listener.OwningProcess)";
    if ($process -and $process.CommandLine -like '*src/server.ts*') {
      Stop-Process -Id $listener.OwningProcess -Force;
      Write-Output "stopped:$($listener.OwningProcess)";
    }
    exit 0
  `;

  let output = "";

  try {
    output = execFileSync(
      "powershell",
      ["-NoProfile", "-Command", command],
      {
        cwd: backendRoot,
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"],
        windowsHide: true,
      },
    ).trim();
  } catch (error) {
    log("Could not inspect port 4000 for stale processes. Continuing startup.");
    return;
  }

  if (output.startsWith("stopped:")) {
    log(`Cleared stale backend process on port ${port} (${output.replace("stopped:", "")}).`);
  }
}

async function shutdown(reason: string) {
  if (isShuttingDown) {
    return;
  }

  isShuttingDown = true;
  if (restartTimer) {
    clearTimeout(restartTimer);
    restartTimer = null;
  }

  closeWatchers();
  await stopServer(reason);
  process.exit(0);
}

process.on("SIGINT", () => {
  void shutdown("received SIGINT");
});

process.on("SIGTERM", () => {
  void shutdown("received SIGTERM");
});

process.on("SIGBREAK", () => {
  void shutdown("received SIGBREAK");
});

killStaleBackendOnPort();
watchDirectoryRecursive(sourceDirectory);
watchEnvironmentFile();
startServer();
