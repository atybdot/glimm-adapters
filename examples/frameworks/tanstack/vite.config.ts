import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// The docs worker serves the build from /example/tanstack. Dev stays at the
// root so `pnpm dev:examples` opens on http://localhost:4605/.
export default defineConfig(({ command }) => ({
  base: command === "build" ? "/example/tanstack/" : "/",
  plugins: [react()],
  server: { port: 4605, strictPort: true },
  preview: { port: 4605, strictPort: true },
}));
