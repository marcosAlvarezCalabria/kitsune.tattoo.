import path from "node:path";

// Relative paths keep builds portable between Netlify (Linux), macOS and Windows.
export const HERO_VIDEO_SOURCE_PATH = path.join("data", "hero-variants", "name-treatment.mp4");
export const HERO_VIDEO_OUTPUT_PREFIX = "kitsune.tattoo-hero-name-treatment-video";
export const HERO_VIDEO_POSTER_PATH = "assets/hero-scroll-poster.jpg";
