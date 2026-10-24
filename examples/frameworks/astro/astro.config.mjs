import { defineConfig } from "astro/config";

export default defineConfig({
  server: { port: 4606 },
  vite: { server: { strictPort: true } },
});
