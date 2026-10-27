import { cpSync, mkdirSync, rmSync, existsSync, copyFileSync } from "node:fs";
import { join, resolve } from "node:path";

const root = resolve(process.cwd());
const examplesRoot = join(root, "examples", "frameworks");
const targetRoot = join(root, "apps", "web", "public", "example");

// SPA frameworks need an index.html copy per client-side route so a hard
// refresh on /example/<fw>/about still serves the shell.
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
    for (const route of ["about"]) {
      const dir = join(dest, route);
      mkdirSync(dir, { recursive: true });
      copyFileSync(join(dest, "index.html"), join(dir, "index.html"));
    }
  }
  console.log(`[stage-examples] staged ${fw} -> ${dest}`);
}

console.log("[stage-examples] done");
