import { describe, expect, it } from "vitest";

import { inferStylesFromCaptions } from "./style-insights.js";

describe("inferStylesFromCaptions", () => {
  it("deduce estilos a partir de hashtags y texto del portfolio", () => {
    const styles = inferStylesFromCaptions([
      "Daruma san #japanesetattoo #horimono #Irezumi",
      "Vamos con goku black #animetattoo #dbz #dragonball",
      "Saw es de mis peliculas favoritas #blackwork #horror",
      "Hacía ya mucho que no subía unas letras #lettering",
      "Retratos de terror a un precio especial"
    ]);

    expect(styles).toEqual(["Anime", "Japonés", "Blackwork", "Terror", "Lettering", "Realismo"]);
  });
});
