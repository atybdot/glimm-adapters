import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// The docs worker serves the build from /example/tanstack. Dev stays at the
// root so `pnpm dev:examples` opens on http://localhost:4605/.
export default defineConfig(({ command }) => ({
  base: command === "build" ? "/example/tanstack/" : "/",
  publicDir: "../shared/public",
  plugins: [react()],
  // The workspace adapter carries its own React/TanStack dev links, which
  // otherwise bundle a second router and leave `useRouter()` outside the
  // provider's context. One copy of each, or the sweep cannot navigate.
  resolve: { dedupe: ["react", "react-dom", "@tanstack/react-router"] },
  server: { port: 4605, strictPort: true },
  preview: { port: 4605, strictPort: true },
}));
