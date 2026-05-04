import { watch } from "node:fs";
import path from "node:path";
import { type Subprocess, spawn } from "bun";

const root = process.cwd();
const sourceDir = path.join(root, "src");
const bunBin = process.execPath;
const electronmonBin = path.join(
  root,
  "node_modules",
  ".bin",
  process.platform === "win32" ? "electronmon.exe" : "electronmon",
);

const childProcesses = new Set<Subprocess<"ignore", "inherit", "inherit">>();

async function runCommand(command: string[]): Promise<boolean> {
  const child = spawn(command, {
    cwd: root,
    stdin: "ignore",
    stdout: "inherit",
    stderr: "inherit",
  });

  const exitCode = await child.exited;
  return exitCode === 0;
}

function startProcess(command: string[]): void {
  const child = spawn(command, {
    cwd: root,
    stdin: "ignore",
    stdout: "inherit",
    stderr: "inherit",
  });

  childProcesses.add(child);

  void child.exited.then(() => {
    childProcesses.delete(child);
  });
}

function stopAll(): void {
  for (const child of childProcesses) {
    child.kill();
  }
}

let staticCopyTimer: Timer | undefined;

function queueStaticCopy(): void {
  if (staticCopyTimer !== undefined) {
    clearTimeout(staticCopyTimer);
  }

  staticCopyTimer = setTimeout(() => {
    void runCommand([bunBin, "src/build-static.ts"]);
  }, 100);
}

watch(sourceDir, { recursive: true }, (_event, fileName) => {
  if (fileName?.endsWith(".html")) {
    queueStaticCopy();
  }
});

process.on("SIGINT", () => {
  stopAll();
  process.exit(0);
});

process.on("SIGTERM", () => {
  stopAll();
  process.exit(0);
});

async function startDev(): Promise<void> {
  const built = await runCommand([bunBin, "run", "build"]);

  if (!built) {
    process.exitCode = 1;
    return;
  }

  startProcess([bunBin, "x", "tsc", "--watch", "--preserveWatchOutput"]);
  startProcess([electronmonBin, "."]);
}

void startDev();
