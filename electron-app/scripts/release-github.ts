import { spawnSync } from "node:child_process";
import type { Dirent } from "node:fs";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { createInterface, type Interface } from "node:readline/promises";

type PackageJson = {
  name?: string;
  version?: string;
  repository?: string | { url?: string };
  build?: {
    publish?: Array<{
      provider?: string;
      owner?: string;
      repo?: string;
    }>;
  };
};

type DistFile = {
  name: string;
  relativePath: string;
  selected: boolean;
};

const projectRoot = path.resolve(__dirname, "..");
const releaseDir = path.join(projectRoot, "release");
const packageJsonPath = path.join(projectRoot, "package.json");
const dryRun = process.argv.slice(2).includes("--dry-run");

let rl: Interface | null = null;
let pipedAnswers: string[] | null = null;
let pipedAnswerIndex = 0;

async function main(): Promise<number> {
  try {
    pipedAnswers = await readPipedAnswers();
    if (pipedAnswers === null) {
      rl = createInterface({
        input: process.stdin,
        output: process.stdout,
      });
    }

    const pkg = await readPackageJson();
    if (typeof pkg.version !== "string" || pkg.version.trim() === "") {
      throw new Error("package.json is missing a valid version.");
    }

    const defaultTag = `v${pkg.version}`;
    const defaultTitle = `${toTitleCase(pkg.name ?? "Hudhud")} ${defaultTag}`;
    const repo = await resolveRepo(pkg);
    const files = await readReleaseFiles();
    const action = await promptReleaseAction();
    const selectedFiles = await selectDistFiles(files);

    const args =
      action === "create"
        ? await buildCreateArgs(defaultTag, defaultTitle, repo, selectedFiles)
        : await buildUploadArgs(defaultTag, repo, selectedFiles);

    console.log(`Running: gh ${formatCommandArgs(args)}`);

    if (dryRun) {
      console.log("Dry run only. Command not executed.");
      return 0;
    }

    const result = spawnSync("gh", args, {
      cwd: projectRoot,
      stdio: "inherit",
    });

    if (result.error !== undefined) {
      console.error(result.error.message);
      return 1;
    }

    return typeof result.status === "number" ? result.status : 1;
  } finally {
    rl?.close();
  }
}

async function readPipedAnswers(): Promise<string[] | null> {
  if (process.stdin.isTTY) {
    return null;
  }

  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk)));
  }

  return Buffer.concat(chunks).toString("utf8").split(/\r?\n/);
}

async function readPackageJson(): Promise<PackageJson> {
  const raw = await readFile(packageJsonPath, "utf8");
  return JSON.parse(raw) as PackageJson;
}

async function resolveRepo(pkg: PackageJson): Promise<string> {
  const publishRepo = resolvePublishRepo(pkg);
  if (publishRepo !== null) {
    return publishRepo;
  }

  const repositoryRepo = resolveRepositoryUrl(pkg.repository);
  if (repositoryRepo !== null) {
    return repositoryRepo;
  }

  const answer = await ask("GitHub repository (owner/name): ");
  if (answer === "") {
    throw new Error("GitHub repository is required.");
  }

  return answer;
}

function resolvePublishRepo(pkg: PackageJson): string | null {
  const firstPublisher = pkg.build?.publish?.[0];
  if (
    firstPublisher?.provider === "github" &&
    isNonEmpty(firstPublisher.owner) &&
    isNonEmpty(firstPublisher.repo)
  ) {
    return `${firstPublisher.owner}/${firstPublisher.repo}`;
  }

  return null;
}

function resolveRepositoryUrl(
  repository: PackageJson["repository"],
): string | null {
  const url = typeof repository === "string" ? repository : repository?.url;
  if (typeof url !== "string") {
    return null;
  }

  const normalizedUrl = url
    .trim()
    .replace(/\.git$/i, "")
    .replace(/\/$/, "");
  const match = normalizedUrl.match(
    /github\.com[:/](?<owner>[^/\s]+)\/(?<repo>[^/\s]+)$/i,
  );
  if (match?.groups?.owner === undefined || match.groups.repo === undefined) {
    return null;
  }

  return `${match.groups.owner}/${match.groups.repo}`;
}

async function readReleaseFiles(): Promise<DistFile[]> {
  let entries: Dirent[];
  try {
    entries = await readdir(releaseDir, { withFileTypes: true });
  } catch (err) {
    console.error("readdir failed:", err);
    throw new Error(
      "Missing release directory. Build release artifacts first.",
    );
  }

  const files = entries
    .filter((entry) => entry.isFile())
    .map((entry) => ({
      name: entry.name,
      relativePath: toPosixPath(path.join("release", entry.name)),
      selected: shouldPreselectAsset(entry.name),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  if (files.length === 0) {
    throw new Error("No top-level files found in release.");
  }

  return files;
}

async function selectDistFiles(files: DistFile[]): Promise<string[]> {
  while (true) {
    printReleaseFiles(files);

    const answer = await ask(
      "Select files to upload. Enter numbers to toggle, comma-separated, or press Enter to continue: ",
    );

    if (answer === "") {
      const selected = files
        .filter((file) => file.selected)
        .map((file) => file.relativePath);

      if (selected.length > 0) {
        return selected;
      }

      console.error("Select at least one file before continuing.");
      continue;
    }

    const indexes = parseIndexes(answer, files.length);
    if (indexes === null) {
      console.error(
        "Invalid selection. Enter numbers from the list, separated by commas.",
      );
      continue;
    }

    for (const index of indexes) {
      files[index].selected = !files[index].selected;
    }
  }
}

function printReleaseFiles(files: DistFile[]): void {
  console.log("");
  console.log("Files in release:");
  files.forEach((file, index) => {
    const marker = file.selected ? "[x]" : "[ ]";
    console.log(`${index + 1}. ${marker} ${file.name}`);
  });
  console.log("");
}

function parseIndexes(value: string, max: number): number[] | null {
  const parts = value
    .split(",")
    .map((part) => part.trim())
    .filter((part) => part !== "");

  if (parts.length === 0) {
    return null;
  }

  const indexes: number[] = [];
  for (const part of parts) {
    if (!/^\d+$/.test(part)) {
      return null;
    }

    const index = Number(part) - 1;
    if (index < 0 || index >= max) {
      return null;
    }

    indexes.push(index);
  }

  return indexes;
}

async function promptReleaseAction(): Promise<"create" | "upload"> {
  while (true) {
    console.log("");
    console.log("Release action:");
    console.log("1. Create a new GitHub release");
    console.log("2. Upload files to an existing GitHub release");

    const answer = await ask("Choose [1]: ");
    const choice = answer === "" ? "1" : answer;

    if (choice === "1") {
      return "create";
    }

    if (choice === "2") {
      return "upload";
    }

    console.error("Invalid choice. Enter 1 or 2.");
  }
}

async function buildCreateArgs(
  defaultTag: string,
  defaultTitle: string,
  repo: string,
  selectedFiles: string[],
): Promise<string[]> {
  const tag = (await ask(`Tag [${defaultTag}]: `)) || defaultTag;
  const title =
    (await ask(`Release title [${defaultTitle}]: `)) || defaultTitle;
  const notes = await askReleaseNotes();
  const draft = await askYesNo("Mark as draft? [y/N]: ", false);
  const prerelease = await askYesNo("Mark as prerelease? [y/N]: ", false);

  return [
    "release",
    "create",
    tag,
    ...selectedFiles,
    "--repo",
    repo,
    "--title",
    title,
    ...(notes === "" ? [] : ["--notes", notes]),
    ...(draft ? ["--draft"] : []),
    ...(prerelease ? ["--prerelease"] : []),
  ];
}

async function buildUploadArgs(
  defaultTag: string,
  repo: string,
  selectedFiles: string[],
): Promise<string[]> {
  const tag = (await ask(`Release tag [${defaultTag}]: `)) || defaultTag;
  const clobber = await askYesNo(
    "Replace existing assets with the same name [Y/n]: ",
    true,
  );

  return [
    "release",
    "upload",
    tag,
    ...selectedFiles,
    "--repo",
    repo,
    ...(clobber ? ["--clobber"] : []),
  ];
}

async function askYesNo(
  prompt: string,
  defaultValue: boolean,
): Promise<boolean> {
  while (true) {
    const answer = (await ask(prompt)).toLowerCase();
    if (answer === "") {
      return defaultValue;
    }

    if (answer === "y" || answer === "yes") {
      return true;
    }

    if (answer === "n" || answer === "no") {
      return false;
    }

    console.error("Enter y or n.");
  }
}

async function askReleaseNotes(): Promise<string> {
  console.log(
    "Release notes (optional). Type a single . on its own line to finish:",
  );

  const lines: string[] = [];
  while (true) {
    const line = await askRaw("> ");
    if (line.trim() === ".") {
      return lines.join("\n").trim();
    }

    lines.push(line);
  }
}

async function ask(prompt: string): Promise<string> {
  return (await askRaw(prompt)).trim();
}

async function askRaw(prompt: string): Promise<string> {
  if (pipedAnswers !== null) {
    const answer = pipedAnswers[pipedAnswerIndex];
    if (answer === undefined) {
      throw new Error("Input ended before all prompts were answered.");
    }

    pipedAnswerIndex += 1;
    process.stdout.write(prompt);
    console.log(answer);
    return answer;
  }

  if (rl === null) {
    throw new Error("Prompt interface is not available.");
  }

  return rl.question(prompt);
}

function shouldPreselectAsset(fileName: string): boolean {
  const lower = fileName.toLowerCase();

  if (lower === "latest.yml" || lower === "latest-mac.yml") {
    return true;
  }

  if (lower.endsWith(".blockmap")) {
    return true;
  }

  if (
    lower.endsWith(".dmg") ||
    lower.endsWith(".zip") ||
    lower.endsWith(".appimage") ||
    lower.endsWith(".deb") ||
    lower.endsWith(".rpm")
  ) {
    return true;
  }

  if (lower.endsWith(".exe")) {
    return lower.includes("setup") || lower.includes("installer");
  }

  return lower.endsWith(".yml") && lower.includes("latest");
}

function formatCommandArgs(args: string[]): string {
  return args.map(quoteArg).join(" ");
}

function quoteArg(arg: string): string {
  if (!/[\s"`]/.test(arg)) {
    return arg;
  }

  return `"${arg.replace(/(["`\\])/g, "\\$1")}"`;
}

function toPosixPath(value: string): string {
  return value.replace(/\\/g, "/");
}

function toTitleCase(value: string): string {
  return value
    .split(/[-_\s]+/)
    .filter((part) => part !== "")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function isNonEmpty(value: unknown): value is string {
  return typeof value === "string" && value.trim() !== "";
}

main()
  .then((status) => {
    process.exitCode = status;
  })
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
