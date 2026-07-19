import path from "node:path";

// Relative to the project root so the build resolves on any platform (Linux CI, macOS, Windows).
// The hero video is optional: when the file is present it is copied, otherwise the build falls
// back to the pre-rendered frame sequence below.
export const HERO_VIDEO_SOURCE_PATH = path.join("data", "hero-variants", "name-treatment.mp4");
export const HERO_FRAMES_SOURCE_DIR = path.join("data", "hero-variants", "name-treatment");
export const HERO_VIDEO_OUTPUT_PREFIX = "kitsune.tattoo-hero-name-treatment-video";
export const HERO_FRAME_OUTPUT_PREFIX = "kitsune.tattoo-hero-name-treatment-frame";
export const HERO_FRAMES_SIZE = {
  width: 1280,
  height: 720
} as const;
