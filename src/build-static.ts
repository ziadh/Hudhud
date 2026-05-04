import { copyFile, mkdir } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const sourceDir = path.join(root, "src");
const outputDir = path.join(root, "build");
const htmlFiles = ["main.html", "pet.html"] as const;

async function copyStaticFiles(): Promise<void> {
  await mkdir(outputDir, { recursive: true });

  await Promise.all(
    htmlFiles.map((fileName) =>
      copyFile(path.join(sourceDir, fileName), path.join(outputDir, fileName)),
    ),
  );
}

copyStaticFiles().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
