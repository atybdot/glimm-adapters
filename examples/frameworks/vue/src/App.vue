<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, ref } from "vue";
import { useRouter } from "vue-router";
import { setupGlimmVue, type VueSweepApi } from "glimm-adapters/vue";
import { demos, frameworks, frameworkHref, siteHref } from "@glimm-examples/shared/demo-data";
import { initPicker } from "@glimm-examples/shared/picker";
import { defaults } from "./glimm";
import { stripBase } from "./router";

const demo = demos.vue;
const base = import.meta.env.BASE_URL;

const canvas = ref<HTMLCanvasElement | null>(null);
const router = useRouter();

// vue-router resolves once the route is confirmed, which can be a tick before
// Vue has patched the DOM. The adapter waits for the next paint after this
// promise resolves, so a tick here is enough.
const sweepRouter = {
  // The interceptor reports the full pathname, base included. vue-router
  // resolves routes against the base, so hand it the path inside the router.
  push: async (href: string) => {
    await router.push(stripBase(href));
    await nextTick();
  },
  replace: async (href: string) => {
    await router.replace(stripBase(href));
    await nextTick();
  },
};

let glimm: VueSweepApi | null = null;
let stopPicker: (() => void) | null = null;

onMounted(() => {
  stopPicker = initPicker();
  if (canvas.value) {
    glimm = setupGlimmVue({ canvas: canvas.value, router: sweepRouter, mode: "reveal", defaults });
  }
});

onUnmounted(() => {
  glimm?.destroy();
  stopPicker?.();
});
</script>

<template>
  <canvas ref="canvas" id="glimm" aria-hidden="true"></canvas>

  <div class="page" :style="{ '--accent': demo.accent }">
    <a class="skip" href="#main">Skip to content</a>

    <header class="bar">
      <a class="wordmark" :href="siteHref(base)" data-glimm-skip>glimm-adapters</a>
      <details class="picker" data-picker>
        <summary>
          <img class="picker-mark" :src="`${base}${demo.logo}`" alt="" width="17" height="17" />
          <span>{{ demo.name }}</span>
          <svg
            class="picker-chevron"
            viewBox="0 0 12 12"
            fill="none"
            stroke="currentColor"
            stroke-width="1.4"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path d="m3 4.5 3 3 3-3" />
          </svg>
        </summary>
        <div class="picker-menu">
          <a
            v-for="framework in frameworks"
            :key="framework.id"
            class="picker-item"
            :href="frameworkHref(base, framework.id)"
            data-glimm-skip
            :aria-current="framework.id === demo.id ? 'page' : undefined"
          >
            <img :src="`${base}${framework.logo}`" alt="" width="17" height="17" />
            {{ framework.name }}
          </a>
        </div>
      </details>
    </header>

    <main class="main" id="main">
      <RouterView />
    </main>
  </div>
</template>
