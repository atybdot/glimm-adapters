import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";

export default defineConfig({
  plugins: [svelte()],
  server: { port: 4604, strictPort: true },
  preview: { port: 4604, strictPort: true },
});
