import path from "node:path";

import { BuildBrandSite } from "./application/build-brand-site.js";
import { AssetDownloader } from "./infrastructure/filesystem/asset-downloader.js";
import { LocalAssetCopier } from "./infrastructure/filesystem/local-asset-copier.js";
import { StaticSiteWriter } from "./infrastructure/generation/static-site-writer.js";
import { ProfileCache } from "./infrastructure/instagram/profile-cache.js";
import { PublicInstagramScraper } from "./infrastructure/instagram/public-instagram-scraper.js";

const run = async (): Promise<void> => {
  const handle = process.argv[2]?.replace(/^@/, "").replace(/\.$/, "");

  if (!handle) {
    throw new Error("Debes indicar el handle de Instagram. Ejemplo: npm run generate -- @kitsune.tattoo");
  }

  const useCase = new BuildBrandSite(
    new PublicInstagramScraper(),
    new AssetDownloader(),
    new LocalAssetCopier(),
    new StaticSiteWriter(),
    new ProfileCache(process.cwd())
  );

  const projectRoot = process.cwd();
  const { outputPath, profile } = await useCase.execute(handle, projectRoot);

  console.log(`Web generada para @${profile.handle}`);
  console.log(`Archivo: ${path.resolve(outputPath)}`);
  console.log(`Instagram: ${profile.profileUrl}`);
};

run().catch((error: unknown) => {
  if (error instanceof Error) {
    console.error(error.message);
    process.exit(1);
  }

  console.error("Se produjo un error no controlado.");
  process.exit(1);
});
