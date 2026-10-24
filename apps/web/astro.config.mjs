import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import cloudflare from "@astrojs/cloudflare";

// `site` feeds canonical URLs (astro-seo default), the sitemap, and robots.txt.
export default defineConfig({
  site: "https://glimm-adapters.atyb.dev",
  integrations: [
    // `compiler: true` runs React Compiler through Oxc, which replaced the
    // old `babel.plugins` option in @astrojs/react 7.
    react({ compiler: true }),
    sitemap(),
  ],
  // Prerender in Node. Under workerd, dev double-loads React and every island
  // fails with "Invalid hook call"; the deployed output is static either way.
  adapter: cloudflare({ imageService: "compile", prerenderEnvironment: "node" }),
  // Nothing on this site uses Astro sessions; keep the adapter from wiring up KV.
  session: false,
  vite: {
    plugins: [tailwindcss()],
  },
});
