import { spawnSync } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const CHANGELOG_PATH = path.resolve(__dirname, "../CHANGELOG.md");

const SKIP_PATTERNS: RegExp[] = [
  /^bump\b/i,
  /^merge pull request\b/i,
  /^merge branch\b/i,
  /^chore[:(]/i,
  /^ci[:(]/i,
  /^build[:(]/i,
  /^test[:(]/i,
  /^style[:(]/i,
];

function git(...args: string[]): string {
  const result = spawnSync("git", args, { encoding: "utf8" });
  if (result.error !== undefined) {
    throw new Error(`git ${args[0]} failed: ${result.error.message}`);
  }
  return result.stdout.trim();
}

function getLastTwoTags(): [string, string] {
  const output = git("tag", "--sort=-version:refname");
  const tags = output.split("\n").filter((t) => t !== "");
  if (tags.length < 2) {
    throw new Error(
      `Need at least 2 tags to generate a changelog, found ${tags.length}.`,
    );
  }
  return [tags[0], tags[1]];
}

function getPrevTagFor(latestTag: string): string {
  const output = git("tag", "--sort=-version:refname");
  const tags = output.split("\n").filter((t) => t !== "");
  const idx = tags.indexOf(latestTag);
  if (idx === -1) {
    throw new Error(`Tag "${latestTag}" not found.`);
  }
  if (idx + 1 >= tags.length) {
    throw new Error(`No tag before "${latestTag}" found.`);
  }
  return tags[idx + 1];
}

function getCommits(prevTag: string, latestTag: string): string[] {
  const output = git(
    "log",
    `${prevTag}..${latestTag}`,
    "--format=%s",
  );
  if (output === "") return [];
  return output.split("\n").filter((line) => line.trim() !== "");
}

function isNoise(subject: string): boolean {
  return SKIP_PATTERNS.some((pattern) => pattern.test(subject));
}

function removeExistingSection(content: string, tag: string): string {
  const lines = content.split("\n");
  const heading = `## ${tag}`;
  const startIdx = lines.findIndex((l) => l === heading);
  if (startIdx === -1) return content;
  let endIdx = lines.findIndex((l, i) => i > startIdx && l.startsWith("## "));
  if (endIdx === -1) endIdx = lines.length;
  const before = lines.slice(0, startIdx).filter((l, i, arr) => {
    if (i === arr.length - 1 && l.trim() === "") return false;
    return true;
  });
  return [...before, ...lines.slice(endIdx)].join("\n");
}

async function main(): Promise<void> {
  const tagArg = process.argv[2];

  let latestTag: string;
  let prevTag: string;

  if (tagArg !== undefined && tagArg !== "") {
    latestTag = tagArg;
    prevTag = getPrevTagFor(latestTag);
  } else {
    [latestTag, prevTag] = getLastTwoTags();
  }

  const commits = getCommits(prevTag, latestTag);
  const customerFacing = commits.filter((c) => !isNoise(c));

  const bullets =
    customerFacing.length > 0
      ? customerFacing.map((c) => `- ${c}`).join("\n")
      : "- (no customer-facing changes)";

  const newSection = `## ${latestTag}\n\n${bullets}`;

  const raw = await readFile(CHANGELOG_PATH, "utf8").catch(() => "");
  const existing = removeExistingSection(raw, latestTag);
  const updated =
    existing.trim() === ""
      ? newSection
      : `${newSection}\n\n${existing.trim()}`;

  await writeFile(CHANGELOG_PATH, `${updated}\n`, "utf8");

  const skipped = commits.length - customerFacing.length;
  console.log(
    `Generated changelog for ${latestTag} (${customerFacing.length} commits from ${prevTag}, ${skipped} skipped)`,
  );
  console.log(`→ ${CHANGELOG_PATH} updated`);
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exitCode = 1;
});
