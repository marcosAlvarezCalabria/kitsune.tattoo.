import { mkdir, readdir, readFile, rm } from "node:fs/promises";
import path from "node:path";

import { chromium } from "playwright";

export interface GeneratedFrameSequence {
  readonly framePaths: readonly string[];
  readonly width: number;
  readonly height: number;
}

interface BrowserFramePayload {
  readonly width: number;
  readonly height: number;
}

export class FrameSequenceGenerator {
  public async generate(
    videoPath: string,
    outputDirectory: string,
    filePrefix: string,
    frameCount = 48
  ): Promise<GeneratedFrameSequence> {
    await mkdir(outputDirectory, { recursive: true });
    await this.removeExistingFrames(outputDirectory, filePrefix);

    const browser = await chromium.launch({ headless: true });

    try {
      const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
      const videoBytes = await readFile(videoPath);
      const videoDataUrl = `data:video/mp4;base64,${videoBytes.toString("base64")}`;

      await page.setContent(`
        <!DOCTYPE html>
        <html>
          <body style="margin:0;background:#000;display:grid;place-items:center;min-height:100vh;">
            <video id="video" muted playsinline preload="auto" src="${videoDataUrl}" style="display:block;"></video>
          </body>
        </html>
      `);

      await page.locator("#video").evaluate((videoElement) => {
        if (!(videoElement instanceof HTMLVideoElement)) {
          throw new Error("No pude inicializar el video para extraer frames.");
        }

        videoElement.load();
      });

      await page.waitForFunction(() => {
        const video = document.getElementById("video");
        return video instanceof HTMLVideoElement && video.readyState >= 2 && Number.isFinite(video.duration) && video.duration > 0;
      });

      const metadata = await page.locator("#video").evaluate((videoElement): BrowserFramePayload & { duration: number } => {
        if (!(videoElement instanceof HTMLVideoElement)) {
          throw new Error("No pude leer la duracion del video.");
        }

        return {
          duration: videoElement.duration,
          width: videoElement.videoWidth,
          height: videoElement.videoHeight
        };
      });
      const duration = metadata.duration;
      const scale = Math.min(1, 1280 / metadata.width);
      const width = Math.max(1, Math.round(metadata.width * scale));
      const height = Math.max(1, Math.round(metadata.height * scale));

      await page.locator("#video").evaluate(
        (videoElement, dimensions) => {
          if (!(videoElement instanceof HTMLVideoElement)) {
            throw new Error("No pude dimensionar el video para extraer frames.");
          }

          videoElement.style.width = `${dimensions.width}px`;
          videoElement.style.height = `${dimensions.height}px`;
        },
        { width, height }
      );

      const framePaths: string[] = [];

      for (let index = 0; index < frameCount; index += 1) {
        const progress = frameCount === 1 ? 0 : index / (frameCount - 1);
        const targetTime = Math.max(0, Math.min(duration - 0.05, duration * progress));

        await page.locator("#video").evaluate(
          (videoElement, currentTime) => {
            if (!(videoElement instanceof HTMLVideoElement)) {
              throw new Error("No pude posicionar el video en el frame solicitado.");
            }

            videoElement.currentTime = currentTime;
          },
          targetTime
        );
        await page.waitForTimeout(120);

        const frameName = `${filePrefix}-${String(index + 1).padStart(3, "0")}.jpg`;
        const absoluteFramePath = path.join(outputDirectory, frameName);
        await page.locator("#video").screenshot({
          path: absoluteFramePath,
          type: "jpeg",
          quality: 82
        });
        framePaths.push(absoluteFramePath);
      }

      return { framePaths, width, height };
    } finally {
      await browser.close();
    }
  }

  private async removeExistingFrames(outputDirectory: string, filePrefix: string): Promise<void> {
    const files = await readdir(outputDirectory, { withFileTypes: true });
    const staleFrames = files
      .filter((entry) => entry.isFile() && entry.name.startsWith(`${filePrefix}-`) && entry.name.endsWith(".jpg"))
      .map((entry) => path.join(outputDirectory, entry.name));

    await Promise.all(staleFrames.map(async (framePath) => rm(framePath, { force: true })));
  }
}
