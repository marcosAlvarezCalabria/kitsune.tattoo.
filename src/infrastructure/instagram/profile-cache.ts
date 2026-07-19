import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { z } from "zod";

import type { ScrapedInstagramProfile } from "./public-instagram-scraper.js";

const cachedProfileSchema = z.object({
  handle: z.string(),
  displayName: z.string(),
  category: z.string(),
  location: z.string(),
  bioLines: z.array(z.string()),
  posts: z.number(),
  followers: z.string(),
  following: z.string(),
  profileImageUrl: z.string().url(),
  highlights: z.array(
    z.object({
      name: z.string(),
      url: z.string().url()
    })
  ),
  postImages: z.array(
    z.object({
      caption: z.string(),
      imageUrl: z.string().url()
    })
  ),
  profileUrl: z.string().url()
});

export class ProfileCache {
  public constructor(private readonly projectRoot: string) {}

  public async load(handle: string): Promise<ScrapedInstagramProfile | null> {
    try {
      const content = await readFile(this.getCachePath(handle), "utf8");
      return cachedProfileSchema.parse(JSON.parse(content));
    } catch {
      return null;
    }
  }

  public async save(profile: ScrapedInstagramProfile): Promise<void> {
    const cachePath = this.getCachePath(profile.handle);
    await mkdir(path.dirname(cachePath), { recursive: true });
    await writeFile(cachePath, JSON.stringify(profile, null, 2), "utf8");
  }

  private getCachePath(handle: string): string {
    return path.join(this.projectRoot, "data", "cache", `${handle}.json`);
  }
}
