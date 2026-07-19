export const DRAWING_PROCESS_MEDIA = {
  videoPath: "assets/process/drawing-process.mp4",
  posterPath: "assets/process/drawing-process-poster.jpg"
} as const;

export const STYLE_SHOWCASE_FRAMES = Array.from(
  { length: 240 },
  (_, index) => `assets/style-showcase/frames/frame-${String(index + 1).padStart(5, "0")}.jpg`
);
