import { access, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const sanitizeSegment = (value: string): string => value.replace(/[^a-z0-9_-]+/gi, "-").replace(/^-+|-+$/g, "").toLowerCase();

export class AssetDownloader {
  public async downloadImage(remoteUrl: string, outputDirectory: string, fileName: string): Promise<string> {
    const url = new URL(remoteUrl);
    const extension = path.extname(url.pathname) || ".jpg";
    const safeName = `${sanitizeSegment(fileName)}${extension}`;
    const outputPath = path.join(outputDirectory, safeName);

    await mkdir(outputDirectory, { recursive: true });

    try {
      const response = await fetch(remoteUrl);

      if (!response.ok) {
        throw new Error(`No pude descargar ${remoteUrl}. Estado HTTP ${response.status}.`);
      }

      const bytes = Buffer.from(await response.arrayBuffer());
      await writeFile(outputPath, bytes);
      return outputPath;
    } catch (error) {
      try {
        await access(outputPath);
        return outputPath;
      } catch {
        if (error instanceof Error) {
          throw error;
        }

        throw new Error(`No pude descargar ${remoteUrl}.`);
      }
    }
  }
}
