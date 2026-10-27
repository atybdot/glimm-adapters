import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";

// The docs worker serves the build from /example/svelte. Dev stays at the root
// so `pnpm dev:examples` opens on http://localhost:4604/.
export default defineConfig(({ command }) => ({
  base: command === "build" ? "/example/svelte/" : "/",
  publicDir: "../shared/public",
  plugins: [svelte()],
  server: { port: 4604, strictPort: true },
  preview: { port: 4604, strictPort: true },
}));
