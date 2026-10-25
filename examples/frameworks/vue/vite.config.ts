import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

// The docs worker serves the build from /example/vue. Dev stays at the root
// so `pnpm dev:examples` opens on http://localhost:4603/.
export default defineConfig(({ command }) => ({
  base: command === "build" ? "/example/vue/" : "/",
  plugins: [vue()],
  server: { port: 4603, strictPort: true },
  preview: { port: 4603, strictPort: true },
}));
