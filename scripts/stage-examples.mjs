import { cpSync, mkdirSync, rmSync, existsSync, copyFileSync } from "node:fs";
import { join, resolve } from "node:path";

const root = resolve(process.cwd());
const examplesRoot = join(root, "examples", "frameworks");
const targetRoot = join(root, "apps", "web", "public", "example");

// SPA frameworks need an index.html copy at /about so a hard refresh on
// /example/<fw>/about (a client-side route) still serves the shell.
const spaFrameworks = new Set(["react", "vue", "svelte", "tanstack", "vanilla"]);

const frameworks = ["vanilla", "react", "vue", "svelte", "tanstack", "astro"];

mkdirSync(targetRoot, { recursive: true });

for (const fw of frameworks) {
  const src = join(examplesRoot, fw, "dist");
  const dest = join(targetRoot, fw);
  if (!existsSync(src)) {
    console.error(`[stage-examples] missing build output: ${src} (run pnpm build:examples first)`);
    process.exit(1);
  }
  rmSync(dest, { recursive: true, force: true });
  mkdirSync(dest, { recursive: true });
  cpSync(src, dest, { recursive: true });
  if (spaFrameworks.has(fw)) {
    const aboutDir = join(dest, "about");
    mkdirSync(aboutDir, { recursive: true });
    copyFileSync(join(dest, "index.html"), join(aboutDir, "index.html"));
  }
  console.log(`[stage-examples] staged ${fw} -> ${dest}`);
}

console.log("[stage-examples] done");
