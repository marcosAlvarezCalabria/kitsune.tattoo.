import path from "node:path";

import { CollectArtistAssets } from "./application/collect-artist-assets.js";
import { AssetDownloader } from "./infrastructure/filesystem/asset-downloader.js";
import { PublicInstagramScraper } from "./infrastructure/instagram/public-instagram-scraper.js";

const run = async (): Promise<void> => {
  const profileUrls = process.argv.slice(2);
  if (profileUrls.length === 0) {
    throw new Error("Indica una o más URLs de perfiles. Ejemplo: npm run collect:artists -- https://www.instagram.com/caradecuero/");
  }

  const collector = new CollectArtistAssets(new PublicInstagramScraper(), new AssetDownloader());
  const outputDirectory = path.join(process.cwd(), "dist", "assets", "artists");
  let collectedCount = 0;

  for (const profileUrl of profileUrls) {
    try {
      const profile = await collector.execute(profileUrl, outputDirectory);
      collectedCount += 1;
      console.log(`Imágenes públicas de @${profile.handle} guardadas en ${path.join(outputDirectory, profile.handle)}`);
    } catch (error) {
      const reason = error instanceof Error ? error.message : "error desconocido";
      console.error(`No se pudo recopilar ${profileUrl}: ${reason}`);
    }
  }

  if (collectedCount === 0) {
    throw new Error("Instagram no expuso imágenes públicas. Inicia sesión en Instagram en el navegador y vuelve a ejecutar el comando.");
  }
};

run().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "No se pudo recopilar el portfolio.");
  process.exit(1);
});
