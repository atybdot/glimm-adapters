/**
 * The page as markdown.
 *
 * `View as Markdown` and the copy action both point here, and so does the
 * `/index.md` route, so a coding agent reading the page gets the same facts the
 * page renders.
 */

import { frameworks } from "./frameworks";
import { sweepOptions } from "./options";
import { api, faqs, fits, triggers } from "./content";
import { demos } from "./demos";

const SITE = import.meta.env.SITE ?? "https://glimm-adapters.atyb.dev";

export const pageUrl = SITE;

/** A prompt an agent can act on when the page is opened in ChatGPT or Claude. */
export const agentPrompt = `Add glimm-adapters page transitions to my project. Read the docs at ${pageUrl} and use the adapter for my router.`;

export function pageMarkdown(): string {
  const adapterLines = frameworks.map((f) => `- ${f.name} (\`${f.pkg}\`): ${f.exports}`);

  const triggerLines = triggers.flatMap((t) => [
    `### ${t.name}`,
    "",
    t.note,
    "",
    `\`${t.label}\``,
    "",
    "```" + (t.lang === "tsx" ? "tsx" : t.lang),
    t.code,
    "```",
    "",
  ]);

  const apiLines = api.map(([name, description]) => `- \`${name}\` — ${description}`);
  const optionLines = sweepOptions.map(
    ([prop, type, def, description]) =>
      `- \`${prop}\`: \`${type}\`, default \`${def}\` — ${description}`,
  );
  const fitLines = fits.map(([moment, yes]) => `- ${yes ? "Sweep" : "Skip"}: ${moment}`);
  const demoLines = demos.map((demo) => `- ${demo.label}`);
  const faqLines = faqs.flatMap((item) => [`### ${item.q}`, "", item.a, ""]);

  return [
    "# glimm-adapters",
    "",
    "Sweep between pages while the next one loads.",
    "",
    "A WebGL band crosses the screen while your router loads the next view, then lifts away.",
    "`glimm-adapters` wires that sweep into the router you already have, so navigation is one",
    "continuous move instead of a white flash.",
    "",
    "The engine is [glimm](https://glimm.dev) by [Noman Ijaz](https://x.com/nomandsign), MIT",
    "licensed. This package adds the thin shell each router needs: one persisted canvas and one call.",
    "",
    "## Demos",
    "",
    "Two small apps on this page run the real engine:",
    "",
    ...demoLines,
    "",
    "## How it works",
    "",
    "A sweep is four moments: cover, commit, paint, reveal. The band waits for your app rather",
    "than a timer, so the swap never lands on a half-drawn page.",
    "",
    "## Install",
    "",
    "```bash",
    "npm install glimm-adapters",
    "```",
    "",
    "## Triggers",
    "",
    "There are three ways to trigger a transition, and you can use any combination across your app.",
    "`TransitionLink` replaces standard links when the destination is known upfront.",
    "`useTransitionRouter()` handles programmatic navigation, like redirects after form submissions.",
    "Or drop in `<InterceptLinks />` at the root level to automatically apply transitions to all",
    "internal links without touching existing code.",
    "",
    ...triggerLines,
    "## Adapters",
    "",
    ...adapterLines,
    "",
    "## API",
    "",
    ...apiLines,
    "",
    "## Options",
    "",
    ...optionLines,
    "",
    "## Easing",
    "",
    "The curve decides how the move feels. Pass a built-in name, or a `(p) => number` function.",
    "Built-ins: ease, easeOutExpo, easeOutQuart, easeInOutCubic, easeInOutQuint, snap, back, linear.",
    "",
    "## Band width",
    "",
    "`bandTight` sets how concentrated the band is. Lower values read wider and softer, higher values",
    "read tighter. Drag across the band to tune its width, then preview it on the page.",
    "",
    "## Custom palette",
    "",
    "A palette is a cosine fit: `color(t) = a + b·cos(2π·(c·t + d))`, each of `a`, `b`, `c`, `d` an",
    "RGB triplet. Roll one with Shuffle, then copy the values.",
    "",
    "## Skip and modifiers",
    "",
    "The interceptor follows the browser's rules: cmd-clicks, middle-clicks, downloads,",
    '`target="_blank"` and cross-origin URLs never sweep, and neither do `#hash` links.',
    "Add `data-glimm-skip` to leave any link alone.",
    "",
    "```html",
    '<a href="/pricing" data-glimm-skip>Pricing</a>',
    "```",
    "",
    "## Where it fits",
    "",
    ...fitLines,
    "",
    "## FAQ",
    "",
    ...faqLines,
    "## Acknowledgments",
    "",
    "glimm-adapters is built on top of [glimm](https://glimm.dev), the WebGL sweep engine by",
    "[Noman Ijaz](https://x.com/nomandsign). The engine is MIT licensed and is not forked; this",
    "package adds the thin adapter layer each router needs.",
    "",
    "MIT licensed. The sweep is the glimm engine by Noman Ijaz; the adapters are original.",
    "",
  ].join("\n");
}
