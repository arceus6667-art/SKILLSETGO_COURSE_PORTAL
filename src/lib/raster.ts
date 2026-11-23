import "server-only";
import { Resvg } from "@resvg/resvg-js";
import path from "node:path";
export function renderCertificatePNG(svg: string) {
  return new Uint8Array(
    new Resvg(svg, {
      fitTo: { mode: "original" },
      font: {
        loadSystemFonts: false,
        fontFiles: [
          path.join(process.cwd(), "public/fonts/noto-serif.ttf"),
          path.join(process.cwd(), "public/fonts/noto-sans-devanagari.ttf"),
        ],
        defaultFontFamily: "Noto Sans Devanagari",
        sansSerifFamily: "Noto Sans Devanagari",
        serifFamily: "Noto Serif",
      },
    })
      .render()
      .asPng(),
  );
}
