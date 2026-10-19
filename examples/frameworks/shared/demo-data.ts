/**
 * The copy and setup snippet every framework demo shares.
 *
 * Each app renders the same two small pages: the setup page, and a second page
 * that exists only so the sweep has somewhere to go. Only the framework name,
 * accent, snippet and file name change.
 */

export type FrameworkDemo = {
  id: string;
  /** Product name, e.g. `React Router`. */
  name: string;
  /** File named in the code block header. */
  file: string;
  /** Brand mark under `/logos`, served from the app's own base. */
  logo: string;
  /** The framework's one accent colour. */
  accent: string;
  /** One short line under the tabs, so the sweep page has a subject. */
  line: string;
  /** The setup excerpt, verbatim. Rendered as plain text. */
  code: string;
};

export const demos = {
  react: {
    id: "react",
    name: "React Router",
    file: "src/App.tsx",
    logo: "logos/react-dark.svg",
    accent: "#58c4dc",
    line: "React Router keeps the routes. One sweep runs between them.",
    code: `import { GlimmProvider, useInterceptLinks } from 'glimm-adapters/react';

function Sweeps() {
  const navigate = useNavigate();
  useInterceptLinks((href) => navigate(href));
  return null;
}

// Wrap the router once.
<GlimmProvider>
  <Sweeps />
  <RouterProvider router={router} />
</GlimmProvider>`,
  },
  tanstack: {
    id: "tanstack",
    name: "TanStack Router",
    file: "src/routes/__root.tsx",
    logo: "logos/tanstack-dark.svg",
    accent: "#ff7a5c",
    line: "TanStack Router still owns navigation. glimm only paints.",
    code: `import { GlimmProvider, InterceptLinks } from 'glimm-adapters/tanstack';

export function Root() {
  return (
    <GlimmProvider>
      <InterceptLinks />
      <Outlet />
    </GlimmProvider>
  );
}`,
  },
  svelte: {
    id: "svelte",
    name: "SvelteKit",
    file: "src/routes/+layout.svelte",
    logo: "logos/svelte.svg",
    accent: "#ff5c33",
    line: "SvelteKit routes as usual. The canvas survives the swap.",
    code: `<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { setupGlimm } from 'glimm-adapters/svelte';

  let canvas: HTMLCanvasElement;

  onMount(() => {
    const glimm = setupGlimm({ canvas, goto });
    return () => glimm.destroy();
  });
</script>

<canvas bind:this={canvas} />
<slot />`,
  },
  vue: {
    id: "vue",
    name: "Vue Router",
    file: "src/App.vue",
    logo: "logos/vue.svg",
    accent: "#42b883",
    line: "vue-router resolves. The sweep covers the frame.",
    code: `<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
import { setupGlimmVue } from 'glimm-adapters/vue';
import { router } from './router';

const canvas = ref<HTMLCanvasElement>();
let glimm: ReturnType<typeof setupGlimmVue>;

onMounted(() => {
  glimm = setupGlimmVue({ canvas: canvas.value!, router });
});
onUnmounted(() => glimm?.destroy());
</script>

<template>
  <canvas ref="canvas" />
  <RouterView />
</template>`,
  },
  astro: {
    id: "astro",
    name: "Astro",
    file: "src/layouts/Layout.astro",
    logo: "logos/astro-dark.svg",
    accent: "#b98cff",
    line: "ClientRouter swaps the page. The canvas stays put.",
    code: `---
import { ClientRouter } from 'astro:transitions';
---
<html transition:animate="none">
  <head><ClientRouter /></head>
  <body>
    <canvas id="glimm" transition:persist="glimm"></canvas>
    <slot />

    <script>
      import { navigate } from 'astro:transitions/client';
      import { setupGlimmAstro } from 'glimm-adapters/astro';

      setupGlimmAstro({ canvas: document.querySelector('#glimm'), navigate });
    </script>
  </body>
</html>`,
  },
  vanilla: {
    id: "vanilla",
    name: "Vanilla JS",
    file: "src/main.ts",
    logo: "logos/javascript.svg",
    accent: "#f7df1e",
    line: "No framework. History, one canvas, and a paint.",
    code: `import { setupGlimmVanilla } from 'glimm-adapters/vanilla';
import { router } from './router';

setupGlimmVanilla({
  canvas: document.querySelector('#glimm'),
  navigate: (href) => router.push(href),
});`,
  },
} satisfies Record<string, FrameworkDemo>;

export type DemoId = keyof typeof demos;

/**
 * A paste-ready brief for an AI agent: install, wire, verify.
 *
 * Built from the same `file` and `code` the wiring page shows, so the two
 * cannot drift apart. The last line is what makes the result reviewable.
 */
export function agentPrompt(demo: FrameworkDemo): string {
  return `Wire glimm-adapters into this ${demo.name} app.

1. Install it: pnpm add glimm-adapters
2. Edit ${demo.file} so it matches this exactly:

${demo.code}

Keep ${demo.name}'s router in charge of navigation; glimm only paints the sweep between routes. The canvas stays fixed and full viewport with pointer-events: none. Do not change any other route.

Then run the dev server and check three things: in-app links sweep, the back button still works, and the console is clean. Report what you changed.`;
}

/** Every demo, in dropdown order. */
export const frameworks = Object.values(demos).map(({ id, name }) => ({ id, name }));

/**
 * Where another framework's demo lives, given this app's base.
 *
 * The demos are separate builds mounted side by side (`/example/react/`,
 * `/example/vue/`, ...), so this drops the current app's segment and swaps in
 * the next one. During `pnpm dev` the base is `/`, which maps to `/react/`.
 */
export function frameworkHref(base: string, id: string): string {
  const root = base.replace(/[^/]+\/?$/, "");
  return `${root}${id}/`;
}

/** The slider's range, shared by every demo. */
export const SWEEP_MS = { min: 300, max: 2400, step: 50, initial: 1100 };
