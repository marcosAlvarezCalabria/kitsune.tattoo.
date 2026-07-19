import { chromium } from "playwright";
import { z } from "zod";

const scrapeResultSchema = z.object({
  title: z.string(),
  description: z.string(),
  image: z.string().url(),
  lines: z.array(z.string()),
  anchors: z.array(z.string()),
  images: z.array(
    z.object({
      alt: z.string(),
      src: z.string().url()
    })
  )
});

const titleMatchSchema = z.object({
  displayName: z.string().min(1),
  handle: z.string().min(1)
});

export interface ScrapedInstagramProfile {
  readonly handle: string;
  readonly displayName: string;
  readonly category: string;
  readonly location: string;
  readonly bioLines: readonly string[];
  readonly posts: number;
  readonly followers: string;
  readonly following: string;
  readonly profileImageUrl: string;
  readonly highlights: readonly { name: string; url: string }[];
  readonly postImages: readonly { caption: string; imageUrl: string }[];
  readonly profileUrl: string;
}

const parseMetric = (value: string): number => {
  const numeric = value.replace(/[^\d]/g, "");
  return Number.parseInt(numeric, 10);
};

const cleanBioLines = (lines: readonly string[]): string[] => {
  const ignored = new Set([
    "Log In",
    "Sign Up",
    "...",
    "more"
  ]);

  return lines.filter((line) => !ignored.has(line));
};

const parseTitle = (title: string): { displayName: string; handle: string } => {
  const match = title.match(/^(?<displayName>.+?) \(@(?<handle>[^)]+)\) /u);

  if (!match?.groups) {
    throw new Error("No pude interpretar el encabezado público del perfil de Instagram.");
  }

  return titleMatchSchema.parse(match.groups);
};

export class PublicInstagramScraper {
  public async scrape(handle: string): Promise<ScrapedInstagramProfile> {
    const browser = await chromium.launch({ headless: true });

    try {
      const page = await browser.newPage();
      const profileUrl = `https://www.instagram.com/${handle}/`;
      await page.goto(profileUrl, { waitUntil: "domcontentloaded", timeout: 60000 });
      await page.waitForTimeout(5000);

      const rawResult = await page.evaluate(() => {
        const title = document.title;
        const description = document.querySelector('meta[property="og:description"]')?.getAttribute("content") ?? "";
        const image = document.querySelector('meta[property="og:image"]')?.getAttribute("content") ?? "";
        const lines = (document.body?.innerText ?? "")
          .split("\n")
          .map((line) => line.trim())
          .filter(Boolean);
        const anchors = Array.from(document.querySelectorAll('a[href^="/"]'))
          .map((anchor) => anchor.getAttribute("href"))
          .filter((href): href is string => Boolean(href));
        const images = Array.from(document.querySelectorAll("img"))
          .map((imageElement) => ({
            alt: imageElement.getAttribute("alt") ?? "",
            src: imageElement.getAttribute("src") ?? ""
          }))
          .filter((entry) => entry.src.includes("cdninstagram.com"));

        return { title, description, image, lines, anchors, images };
      });

      const result = scrapeResultSchema.parse(rawResult);
      const lines = cleanBioLines(result.lines);
      const titleData = parseTitle(result.title);
      const descriptionMatch = result.description.match(
        /(?<followers>[\d,]+) Followers,\s*(?<following>[\d,]+) Following,\s*(?<posts>[\d,]+) Posts/i
      );

      if (!descriptionMatch?.groups) {
        throw new Error(`No pude interpretar las métricas públicas de ${handle}.`);
      }

      const postsIndex = lines.findIndex((line) => /^\d[\d,]* posts$/i.test(line));

      if (postsIndex < 2) {
        throw new Error(`No pude localizar el bloque principal del perfil público de ${handle}.`);
      }

      const handleLine = lines[postsIndex - 2] ?? titleData.handle;
      const displayName = lines[postsIndex - 1] ?? titleData.displayName;
      const postsLine = lines[postsIndex] ?? `${descriptionMatch.groups.posts} posts`;
      const followersLine = lines[postsIndex + 1] ?? `${descriptionMatch.groups.followers} followers`;
      const followingLine = lines[postsIndex + 2] ?? `${descriptionMatch.groups.following} following`;
      const category = lines[postsIndex + 3] ?? "Tattoo Artist";
      const location = lines[postsIndex + 4] ?? "";
      const bioLines = lines
        .slice(postsIndex + 5, postsIndex + 8)
        .filter((line) => !line.startsWith("Diseños") && !line.startsWith("¢") && !line.startsWith("ƒ"));

      const highlightAnchors = result.anchors.filter((anchor) => anchor.startsWith("/stories/highlights/"));
      const highlightNames = lines
        .slice(postsIndex + 5)
        .filter((line) => !line.startsWith("Meta"))
        .slice(0, highlightAnchors.length);

      const profileImages = result.images.filter((image) => image.alt.includes("profile picture"));
      const profileImage = profileImages.find((image) => image.alt.includes(`${handle}'s profile picture`))?.src ?? result.image;
      const postImages = result.images.filter((image) => !image.alt.includes("profile picture")).slice(0, 9);

      return {
        handle,
        displayName,
        category,
        location,
        bioLines,
        posts: parseMetric(postsLine),
        followers: followersLine.replace("followers", "").trim(),
        following: followingLine.replace("following", "").trim(),
        profileImageUrl: profileImage,
        highlights: highlightNames.map((name, index) => ({
          name,
          url: `https://www.instagram.com${highlightAnchors[index]}`
        })),
        postImages: postImages.map((image) => ({
          caption: image.alt,
          imageUrl: image.src
        })),
        profileUrl
      };
    } finally {
      await browser.close();
    }
  }
}
