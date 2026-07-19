import { mkdir } from "node:fs/promises";
import path from "node:path";

import type { CreatorProfile, PortfolioPost } from "../domain/profile.js";
import {
  HERO_VIDEO_OUTPUT_PREFIX,
  HERO_VIDEO_POSTER_PATH,
  HERO_VIDEO_SOURCE_PATH
} from "../infrastructure/config/site-branding.js";
import { inferStylesFromCaptions } from "../domain/style-insights.js";
import { AssetDownloader } from "../infrastructure/filesystem/asset-downloader.js";
import { LocalAssetCopier } from "../infrastructure/filesystem/local-asset-copier.js";
import { StaticSiteWriter } from "../infrastructure/generation/static-site-writer.js";
import { ProfileCache } from "../infrastructure/instagram/profile-cache.js";
import type { ScrapedInstagramProfile } from "../infrastructure/instagram/public-instagram-scraper.js";
import { PublicInstagramScraper } from "../infrastructure/instagram/public-instagram-scraper.js";

export class BuildBrandSite {
  public constructor(
    private readonly scraper: PublicInstagramScraper,
    private readonly assetDownloader: AssetDownloader,
    private readonly localAssetCopier: LocalAssetCopier,
    private readonly siteWriter: StaticSiteWriter,
    private readonly profileCache: ProfileCache
  ) {}

  public async execute(handle: string, projectRoot: string): Promise<{ outputPath: string; profile: CreatorProfile }> {
    const scraped = await this.loadProfile(handle);
    const generatedAssetsDirectory = path.join(projectRoot, "dist", "assets", "generated");

    await mkdir(generatedAssetsDirectory, { recursive: true });
    await this.localAssetCopier.copyDirectory(
      path.join(projectRoot, "assets"),
      path.join(projectRoot, "dist", "assets")
    );

    const profileImagePath = await this.assetDownloader.downloadImage(
      scraped.profileImageUrl,
      generatedAssetsDirectory,
      `${handle}-profile`
    );
    const heroVideoPath = await this.tryCopyHeroVideo(generatedAssetsDirectory, projectRoot);
    if (!heroVideoPath) {
      throw new Error(`No hero video available. Provide an MP4 at "${HERO_VIDEO_SOURCE_PATH}".`);
    }

    const portfolioPosts = await Promise.all(
      scraped.postImages.slice(0, 9).map(async (post, index): Promise<PortfolioPost> => {
        const localPath = await this.assetDownloader.downloadImage(
          post.imageUrl,
          generatedAssetsDirectory,
          `${handle}-portfolio-${index + 1}`
        );

        return {
          caption: post.caption,
          remoteUrl: post.imageUrl,
          localPath: toRelativeAssetPath(projectRoot, localPath)
        };
      })
    );

    const profile: CreatorProfile = {
      handle: scraped.handle,
      displayName: scraped.displayName,
      category: scraped.category,
      location: scraped.location,
      bioLines: scraped.bioLines,
      metrics: [
        { label: "Posts", value: String(scraped.posts) },
        { label: "Seguidores", value: scraped.followers },
        { label: "Siguiendo", value: scraped.following }
      ],
      highlights: scraped.highlights,
      styles: inferStylesFromCaptions(scraped.postImages.map((post) => post.caption)),
      profileImage: {
        alt: `${scraped.displayName} profile image`,
        remoteUrl: scraped.profileImageUrl,
        localPath: toRelativeAssetPath(projectRoot, profileImagePath)
      },
      heroVideo: {
        localPath: toRelativeAssetPath(projectRoot, heroVideoPath),
        posterPath: HERO_VIDEO_POSTER_PATH
      },
      portfolioPosts,
      profileUrl: scraped.profileUrl,
      generatedAt: new Intl.DateTimeFormat("es-ES", {
        dateStyle: "long",
        timeStyle: "short",
        timeZone: "Europe/Dublin"
      }).format(new Date())
    };

    const outputPath = await this.siteWriter.write(profile, path.join(projectRoot, "dist"));

    return { outputPath, profile };
  }

  private async loadProfile(handle: string): Promise<ScrapedInstagramProfile> {
    try {
      const scraped = await this.scraper.scrape(handle);
      await this.profileCache.save(scraped);
      return scraped;
    } catch (error) {
      const cached = await this.profileCache.load(handle);

      if (cached) {
        return cached;
      }

      throw error;
    }
  }

  private async tryCopyHeroVideo(
    generatedAssetsDirectory: string,
    projectRoot: string
  ): Promise<string | null> {
    try {
      return await this.localAssetCopier.copyAsset(
        path.join(projectRoot, HERO_VIDEO_SOURCE_PATH),
        generatedAssetsDirectory,
        HERO_VIDEO_OUTPUT_PREFIX
      );
    } catch {
      return null;
    }
  }

}

const toRelativeAssetPath = (projectRoot: string, absolutePath: string): string =>
  path.relative(path.join(projectRoot, "dist"), absolutePath).split(path.sep).join("/");
