import { defineConfig } from "astro/config";

// The docs worker serves the build from /example/astro. Dev keeps the root so
// `pnpm dev:examples` opens on http://localhost:4606/.
const isBuild = process.argv.includes("build");

export default defineConfig({
  publicDir: "../shared/public",
  base: isBuild ? "/example/astro" : "/",
  server: { port: 4606 },
  vite: { server: { strictPort: true } },
});
