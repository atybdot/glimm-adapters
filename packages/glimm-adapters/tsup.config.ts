import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    react: "src/react.tsx",
    tanstack: "src/tanstack.tsx",
    svelte: "src/svelte.ts",
    vue: "src/vue.ts",
    astro: "src/astro.ts",
    vanilla: "src/vanilla.ts",
  },
  format: ["esm"],
  dts: true,
  clean: true,
  sourcemap: false,
  // One self-contained bundle per entry. Code splitting put the vanilla runner
  // and the curtain/reveal helpers in one shared chunk, so `index`, `svelte`,
  // `vue` and `astro` all loaded code they never called.
  splitting: false,
  minify: true,
  external: [
    "glimm",
    "react",
    "react-dom",
    "react/jsx-runtime",
    "@tanstack/react-router",
    "svelte",
    "svelte/store",
    "$app/navigation",
    "vue",
    "vue-router",
    "astro:transitions/client",
  ],
});
