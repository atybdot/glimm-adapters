/**
 * A palette drawn as CSS.
 *
 * The engine's colour is a cosine fit, `color(t) = a + b·cos(2π·(c·t + d))`.
 * Sampling that fit into five stops gives a gradient a chip or a strip can
 * show, so a rolled palette is visible before it is swept.
 */

import type { Palette } from "glimm-adapters";

export function paletteCss(palette: Palette): string {
  const sample = (t: number) =>
    palette.a
      .map((a, i) =>
        Math.round(
          Math.min(
            1,
            Math.max(
              0,
              a + palette.b[i]! * Math.cos(2 * Math.PI * (palette.c[i]! * t + palette.d[i]!)),
            ),
          ) * 255,
        ),
      )
      .join(", ");
  return `linear-gradient(90deg, ${[0, 0.25, 0.5, 0.75, 1]
    .map((t) => `rgb(${sample(t)})`)
    .join(", ")})`;
}
