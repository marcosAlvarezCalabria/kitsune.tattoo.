import { copyFile, cp, mkdir, readdir, rm } from "node:fs/promises";
import path from "node:path";

export class LocalAssetCopier {
  public async copyAsset(sourcePath: string, outputDirectory: string, fileName: string): Promise<string> {
    await mkdir(outputDirectory, { recursive: true });
    const extension = path.extname(sourcePath);
    const outputPath = path.join(outputDirectory, `${fileName}${extension}`);
    await copyFile(sourcePath, outputPath);
    return outputPath;
  }

  public async copyFrameSequence(sourceDirectory: string, outputDirectory: string, filePrefix: string): Promise<string[]> {
    await mkdir(outputDirectory, { recursive: true });
    await this.removeExistingFrames(outputDirectory, filePrefix);

    const entries = await readdir(sourceDirectory, { withFileTypes: true });
    const sourceFrames = entries
      .filter((entry) => entry.isFile() && /\.(jpg|jpeg|png)$/i.test(entry.name))
      .map((entry) => entry.name)
      .sort((left, right) => left.localeCompare(right, undefined, { numeric: true }));

    const copiedFrames: string[] = [];

    for (let index = 0; index < sourceFrames.length; index += 1) {
      const sourceName = sourceFrames[index];

      if (!sourceName) {
        continue;
      }

      const extension = path.extname(sourceName);
      const outputName = `${filePrefix}-${String(index + 1).padStart(3, "0")}${extension}`;
      const sourcePath = path.join(sourceDirectory, sourceName);
      const outputPath = path.join(outputDirectory, outputName);
      await copyFile(sourcePath, outputPath);
      copiedFrames.push(outputPath);
    }

    return copiedFrames;
  }

  public async copyDirectory(sourceDirectory: string, outputDirectory: string): Promise<void> {
    try {
      await cp(sourceDirectory, outputDirectory, { recursive: true, force: true });
    } catch (error) {
      if (isMissingDirectory(error)) {
        return;
      }

      throw error;
    }
  }

  private async removeExistingFrames(outputDirectory: string, filePrefix: string): Promise<void> {
    const entries = await readdir(outputDirectory, { withFileTypes: true });
    const staleFrames = entries
      .filter((entry) => entry.isFile() && entry.name.startsWith(`${filePrefix}-`) && /\.(jpg|jpeg|png)$/i.test(entry.name))
      .map((entry) => path.join(outputDirectory, entry.name));

    await Promise.all(staleFrames.map(async (framePath) => rm(framePath, { force: true })));
  }
}

const isMissingDirectory = (error: unknown): boolean =>
  typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT";
