import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { AssetDownloader } from "../infrastructure/filesystem/asset-downloader.js";
import { PublicInstagramScraper, type ScrapedInstagramProfile } from "../infrastructure/instagram/public-instagram-scraper.js";

export class CollectArtistAssets {
  public constructor(
    private readonly scraper: PublicInstagramScraper,
    private readonly assetDownloader: AssetDownloader
  ) {}

  public async execute(profileUrl: string, outputDirectory: string): Promise<ScrapedInstagramProfile> {
    const handle = this.getHandle(profileUrl);
    const profile = await this.scraper.scrape(handle);
    const artistDirectory = path.join(outputDirectory, handle);
    await mkdir(artistDirectory, { recursive: true });

    await this.assetDownloader.downloadImage(profile.profileImageUrl, artistDirectory, "profile");
    await Promise.all(
      profile.postImages.map((post, index) =>
        this.assetDownloader.downloadImage(post.imageUrl, artistDirectory, `portfolio-${String(index + 1).padStart(2, "0")}`)
      )
    );
    await writeFile(path.join(artistDirectory, "profile.json"), JSON.stringify(profile, null, 2), "utf8");
    return profile;
  }

  private getHandle(profileUrl: string): string {
    const url = new URL(profileUrl);
    if (url.hostname !== "www.instagram.com" && url.hostname !== "instagram.com") {
      throw new Error("La URL debe ser un perfil de instagram.com.");
    }

    const handle = url.pathname.split("/").filter(Boolean)[0];
    if (!handle) {
      throw new Error("La URL no contiene un handle de Instagram.");
    }

    return handle.replace(/^@/, "");
  }
}
