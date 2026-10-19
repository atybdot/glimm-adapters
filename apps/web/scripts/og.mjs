/**
 * Renders the share cards with Takumi.
 *
 * Both images are static files in `public`, written once at build time. Requests
 * never touch the renderer, and the only thing that changes between releases is
 * the version in the top-right corner. The changelog card swaps the headline and
 * description; everything else is shared.
 *
 * Run it with `pnpm --filter web og` after bumping the package version.
 */

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Renderer } from "@takumi-rs/core";
import { render } from "takumi-js";

const require = createRequire(import.meta.url);
const here = dirname(fileURLToPath(import.meta.url));
const webRoot = join(here, "..");
const repoRoot = join(webRoot, "..", "..");
const publicDir = join(webRoot, "public");

const WIDTH = 1200;
const HEIGHT = 630;

const INK = "#fafafa";
const BODY = "#ededed";
const MUTED = "#a3a3a3";

const fontFiles = [
  ["Manrope Variable", "@fontsource-variable/manrope/files/manrope-latin-wght-normal.woff2"],
  [
    "Azeret Mono Variable",
    "@fontsource-variable/azeret-mono/files/azeret-mono-latin-wght-normal.woff2",
  ],
  ["Yellowtail", "@fontsource/yellowtail/files/yellowtail-latin-400-normal.woff2"],
];

/** The framework marks, in adapter order. Dark-ground variants for the card. */
const logos = [
  "tanstack-dark.svg",
  "react-dark.svg",
  "svelte.svg",
  "vue.svg",
  "astro-dark.svg",
  "javascript.svg",
];

async function dataUri(name) {
  const svg = await readFile(join(publicDir, "logos", name));
  return `data:image/svg+xml;base64,${svg.toString("base64")}`;
}

function card({ version, headline, description, marks }) {
  const logoRow = marks
    .map((src) => `<img src="${src}" style="height:30px;width:auto;display:block;flex:none;" />`)
    .join("");

  return `
    <div style="position:relative;width:${WIDTH}px;height:${HEIGHT}px;overflow:hidden;background:#101010;font-family:'Manrope Variable',sans-serif;color:${INK};">
      <div style="position:absolute;left:0;top:0;right:0;bottom:0;background-image:radial-gradient(circle,#2a2a2a 1px,transparent 1.2px);background-size:26px 26px;background-position:center;opacity:0.7;"></div>

      <div style="position:absolute;left:-220px;top:-140px;width:1640px;height:360px;transform:rotate(-13deg);background:linear-gradient(90deg,transparent 4%,#ffbc01 26%,#ff8c1b 50%,#ff3d4c 74%,transparent 96%);filter:blur(72px);opacity:0.5;"></div>

      <div style="position:relative;display:flex;flex-direction:column;justify-content:space-between;height:100%;box-sizing:border-box;padding:68px;">
        <div style="display:flex;align-items:center;justify-content:space-between;">
          <span style="font-family:'Yellowtail';font-size:46px;line-height:1.15;white-space:nowrap;color:${INK};">glimm-adapters</span>
          <span style="font-family:'Azeret Mono Variable';font-size:20px;color:${MUTED};">${version}</span>
        </div>

        <div>
          <h1 style="margin:0;max-width:760px;font-size:62px;font-weight:600;line-height:1.08;letter-spacing:-1.86px;color:${INK};">${headline}</h1>
          <p style="margin:24px 0 0;max-width:760px;font-size:23px;line-height:1.5;color:${BODY};">${description}</p>
        </div>

        <div style="display:flex;align-items:flex-end;justify-content:space-between;gap:32px;">
          <span style="font-family:'Azeret Mono Variable';font-size:18px;color:${INK};white-space:nowrap;">glimm-adapters.atyb.dev</span>
          <div style="display:flex;align-items:center;gap:20px;opacity:0.9;">${logoRow}</div>
        </div>
      </div>
    </div>
  `;
}

async function main() {
  const pkg = JSON.parse(
    await readFile(join(repoRoot, "packages", "glimm-adapters", "package.json"), "utf8"),
  );
  const version = `v${pkg.version}`;

  const renderer = new Renderer();

  for (const [name, file] of fontFiles) {
    const data = await readFile(require.resolve(file));
    await renderer.registerFont({ name, data });
  }

  const marks = await Promise.all(logos.map(dataUri));

  const cards = [
    {
      file: "og.png",
      headline: "Page transitions that sweep.",
      description:
        "One WebGL band covers the view you are leaving, your router commits the navigation, then the band reveals the next one.",
    },
    {
      file: "og-changelog.png",
      headline: "Changelog",
      description:
        "Every release of glimm-adapters, newest first. What shipped, what changed, and what got fixed.",
    },
  ];

  await mkdir(publicDir, { recursive: true });

  for (const item of cards) {
    const png = await render(card({ version, marks, ...item }), {
      renderer,
      width: WIDTH,
      height: HEIGHT,
      format: "png",
    });
    await writeFile(join(publicDir, item.file), png);
    console.log(`${item.file}: ${WIDTH}x${HEIGHT}, ${version}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
