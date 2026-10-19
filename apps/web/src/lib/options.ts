/**
 * The options table, and the source the markdown mirror and the API docs share.
 *
 * `[prop, type, default, description]`. Kept out of the page so `/index.md`
 * can render the same list the table shows, with no second copy to drift.
 */
export const sweepOptions: [string, string, string, string][] = [
  [
    "palette",
    "PaletteName | Palette",
    "'prism'",
    "Preset name, or a custom {a, b, c, d} cosine fit.",
  ],
  [
    "direction",
    "'ltr' | 'rtl' | 'ttb' | 'btt'",
    "'ltr'",
    "Axis the band travels. Match the direction of the move.",
  ],
  ["easing", "EasingName | (p) => number", "'ease'", "Built-in curve, or your own function."],
  ["sweepMs", "number", "1100", "Time for the band to cross the screen."],
  ["outroMs", "number", "220", "Fade after the band has crossed."],
  ["midpoint", "number", "0.56", "Progress point where the router commits."],
  ["peakAlpha", "number", "1", "Ceiling for the band opacity, 0 to 1.5."],
  ["bandTight", "number", "14", "Focus of the band. Lower reads wider and softer."],
  ["brightness", "number", "1", "RGB multiplier. Try 0.85 on dark pages."],
  ["waveAmount", "number", "0", "Edge wobble, 0 to 2. Off by default."],
  ["rippleAmount", "number", "1", "Ripple texture, 0 to 2."],
  ["waveSpeed", "number", "1", "Shader motion speed, 0 to 3."],
];
