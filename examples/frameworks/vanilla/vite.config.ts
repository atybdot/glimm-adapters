import { defineConfig } from "vite";

// The docs worker serves the build from /example/vanilla. Dev stays at the root
// so `pnpm dev:examples` opens on http://localhost:4601/.
export default defineConfig(({ command }) => ({
  base: command === "build" ? "/example/vanilla/" : "/",
  server: { port: 4601, strictPort: true },
  preview: { port: 4601, strictPort: true },
}));
