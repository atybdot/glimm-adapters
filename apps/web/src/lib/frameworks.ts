/**
 * Setup snippets for every adapter, one entry per router.
 *
 * This lives outside the page on purpose. Astro's compiler splits an
 * `.astro` file on `<script>` tags, and a Svelte or Vue snippet that shows a
 * `<script>` block would be lifted into the page's own module graph. In a
 * plain TS file the same strings are inert.
 *
 * Each snippet mirrors the adapter's own type signature, so keep them in
 * step with `packages/glimm-adapters/dist/*.d.ts`.
 */

export type FrameworkLogo = {
  /** Served from /public/logos. A few marks ship a dark-ground variant. */
  light: string;
  dark: string;
};

export type FrameworkSetup = {
  /** Stable slug, used for the aria-controls / aria-labelledby pair. */
  id: string;
  name: string;
  pkg: string;
  exports: string;
  /** The file the snippet belongs in. */
  label: string;
  lang: "ts" | "tsx" | "html" | "astro" | "text";
  badge: "ts" | "html" | "text";
  /** Brand mark for the adapter tab, from svgl. */
  logo: FrameworkLogo;
  code: string;
};

export const frameworks: FrameworkSetup[] = [
  {
    id: "tanstack",
    name: "TanStack Router",
    pkg: "glimm-adapters/tanstack",
    exports: "GlimmProvider · InterceptLinks · TransitionLink · useTransitionRouter",
    label: "src/routes/__root.tsx",
    lang: "tsx",
    badge: "ts",
    logo: { light: "/logos/tanstack-light.svg", dark: "/logos/tanstack-dark.svg" },
    code: `import { InterceptLinks, GlimmProvider } from 'glimm-adapters/tanstack';

export function Root() {
  return (
    <GlimmProvider palette="prism">
      <InterceptLinks />
      <Outlet />
    </GlimmProvider>
  );
}`,
  },
  {
    id: "react",
    name: "React Router",
    pkg: "glimm-adapters/react",
    exports: "GlimmProvider · useInterceptLinks",
    label: "App.tsx",
    lang: "tsx",
    badge: "ts",
    logo: { light: "/logos/react-light.svg", dark: "/logos/react-dark.svg" },
    code: `import { useNavigate } from 'react-router';
import { GlimmProvider, useInterceptLinks } from 'glimm-adapters/react';

function Sweeps() {
  const navigate = useNavigate();
  useInterceptLinks((href) => navigate(href));
  return null;
}

export function App() {
  return (
    <GlimmProvider palette="prism">
      <Sweeps />
      <RouterProvider router={router} />
    </GlimmProvider>
  );
}`,
  },
  {
    id: "svelte",
    name: "SvelteKit",
    pkg: "glimm-adapters/svelte",
    exports: "setupGlimm",
    label: "src/routes/+layout.svelte",
    lang: "html",
    badge: "html",
    logo: { light: "/logos/svelte.svg", dark: "/logos/svelte.svg" },
    code: `<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { setupGlimm } from 'glimm-adapters/svelte';

  let canvas: HTMLCanvasElement;

  onMount(() => {
    const glimm = setupGlimm({
      canvas,
      goto,
      mode: 'reveal',
      defaults: { palette: 'prism' },
    });
    return () => glimm.destroy();
  });
</script>

<canvas bind:this={canvas} class="glimm"></canvas>
<slot />`,
  },
  {
    id: "vue",
    name: "Vue and Nuxt",
    pkg: "glimm-adapters/vue",
    exports: "setupGlimmVue",
    label: "src/App.vue",
    lang: "html",
    badge: "html",
    logo: { light: "/logos/vue.svg", dark: "/logos/vue.svg" },
    code: `<script setup lang="ts">
  import { onMounted, onUnmounted, ref } from 'vue';
  import { useRouter } from 'vue-router';
  import { setupGlimmVue } from 'glimm-adapters/vue';

  const canvas = ref<HTMLCanvasElement>();
  const router = useRouter();
  let glimm: ReturnType<typeof setupGlimmVue>;

  onMounted(() => {
    glimm = setupGlimmVue({
      canvas: canvas.value!,
      router,
      mode: 'reveal',
      defaults: { palette: 'prism' },
    });
  });
  onUnmounted(() => glimm?.destroy());
</script>

<template>
  <canvas ref="canvas" class="glimm" />
  <RouterView />
</template>`,
  },
  {
    id: "astro",
    name: "Astro",
    pkg: "glimm-adapters/astro",
    exports: "setupGlimmAstro",
    label: "src/layouts/Layout.astro",
    lang: "astro",
    badge: "html",
    logo: { light: "/logos/astro-light.svg", dark: "/logos/astro-dark.svg" },
    code: `---
import { ClientRouter } from 'astro:transitions';
---
<html transition:animate="none">
  <head>
    <ClientRouter fallback="swap" />
  </head>
  <body>
    <canvas id="glimm" transition:persist="glimm-canvas"></canvas>
    <slot />

    <script>
      import { navigate } from 'astro:transitions/client';
      import { setupGlimmAstro } from 'glimm-adapters/astro';

      const canvas = document.querySelector('#glimm');
      setupGlimmAstro({ canvas, navigate, mode: 'reveal', defaults: { palette: 'prism' } });
    </script>
  </body>
</html>`,
  },
  {
    id: "vanilla",
    name: "Vanilla JS",
    pkg: "glimm-adapters/vanilla",
    exports: "setupGlimmVanilla",
    label: "glimm.ts",
    lang: "ts",
    badge: "ts",
    logo: { light: "/logos/javascript.svg", dark: "/logos/javascript.svg" },
    code: `import { setupGlimmVanilla } from 'glimm-adapters/vanilla';
import { router } from './router';

const glimm = setupGlimmVanilla({
  canvas: document.querySelector('#glimm')!,
  // Commit the route. The adapter waits for paint before the band leaves.
  navigate: (href) => router.push(href),
  mode: 'reveal',
  defaults: { palette: 'prism' },
});

// Any non-navigation commit can ride the same sweep:
await glimm.sweep(() => applyTheme('dark')).done;`,
  },
];
