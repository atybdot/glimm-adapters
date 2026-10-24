import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: { port: 4602, strictPort: true },
  preview: { port: 4602, strictPort: true },
});
