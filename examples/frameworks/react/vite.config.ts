import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// The docs worker serves the build from /example/react. Dev stays at the root
// so `pnpm dev:examples` opens on http://localhost:4602/.
export default defineConfig(({ command }) => ({
  base: command === "build" ? "/example/react/" : "/",
  plugins: [react()],
  server: { port: 4602, strictPort: true },
  preview: { port: 4602, strictPort: true },
}));
