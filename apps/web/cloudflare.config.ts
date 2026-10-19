import { defineConfig } from "cf/config";

// Worker settings for the Astro build. The adapter supplies the entrypoint and
// the static asset directory, so this file only declares deployment metadata.
export default defineConfig({
  worker: {
    name: "glimm-adapters",
    compatibilityDate: "2025-10-01",
    compatibilityFlags: ["nodejs_compat"],
    observability: {
      enabled: true,
    },
  },
});
