const STYLE_DICTIONARY = [
  { label: "Anime", keywords: ["anime", "goku", "shin chan", "dragonball", "dbz"] },
  { label: "Japonés", keywords: ["irezumi", "japanesetattoo", "horimono", "daruma", "neko"] },
  { label: "Blackwork", keywords: ["blackwork", "blackandgreytattoo"] },
  { label: "Terror", keywords: ["terror", "horror", "halloween", "captainspaulding", "saw"] },
  { label: "Lettering", keywords: ["lettering", "letters"] },
  { label: "Color", keywords: ["colortattoo", "color"] },
  { label: "Realismo", keywords: ["realista", "retratos", "portrait"] }
] as const;

export const inferStylesFromCaptions = (captions: readonly string[]): string[] => {
  const normalized = captions.map((caption) => caption.toLowerCase());

  return STYLE_DICTIONARY
    .filter((entry) => normalized.some((caption) => entry.keywords.some((keyword) => caption.includes(keyword))))
    .map((entry) => entry.label);
};
