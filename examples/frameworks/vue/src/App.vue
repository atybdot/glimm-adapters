<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { setupGlimmVue, type VueSweepApi } from "glimm-adapters/vue";
import { demos, frameworks, frameworkHref, SWEEP_MS } from "@glimm-examples/shared/demo-data";
import { defaults } from "./glimm";
import { stripBase } from "./router";

const demo = demos.vue;
const logo = `${import.meta.env.BASE_URL}${demo.logo}`;

const canvas = ref<HTMLCanvasElement | null>(null);
const route = useRoute();
const router = useRouter();
const page = computed(() => {
  const path = route.path.replace(/\/+$/, "");
  return path === "/about" ? "wiring" : path === "/prompt" ? "prompt" : "sweep";
});
const wiring = computed(() => page.value === "wiring");
const sweepMs = ref(defaults.sweepMs);

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

function onDuration(event: Event) {
  const input = event.target as HTMLInputElement;
  sweepMs.value = Number(input.value);
  defaults.sweepMs = sweepMs.value;
}

function onFramework(event: Event) {
  const select = event.target as HTMLSelectElement;
  window.location.assign(frameworkHref(import.meta.env.BASE_URL, select.value));
}

let glimm: VueSweepApi | null = null;

onMounted(() => {
  if (canvas.value) {
    glimm = setupGlimmVue({ canvas: canvas.value, router: sweepRouter, mode: "reveal", defaults });
  }
});

onUnmounted(() => glimm?.destroy());
</script>

<template>
  <canvas ref="canvas" id="glimm" aria-hidden="true"></canvas>

  <div class="page" :style="{ '--accent': demo.accent }">
    <a class="skip" href="#main">Skip to content</a>

    <header class="bar">
      <RouterLink class="wordmark" to="/" aria-label="glimm-adapters home"
        >glimm-adapters</RouterLink
      >
      <span class="slash" aria-hidden="true">/</span>
      <label class="picker">
        <span class="sr-only">Framework</span>
        <select name="framework" :value="demo.id" @change="onFramework">
          <option v-for="framework in frameworks" :key="framework.id" :value="framework.id">
            {{ framework.name }}
          </option>
        </select>
        <svg
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
      </label>
    </header>

    <main class="stage" id="main">
      <div class="fw-card">
        <img :src="logo" alt="" width="52" height="52" />
        <h1>{{ demo.name }}</h1>
      </div>

      <nav class="switcher" aria-label="Demo pages">
        <RouterLink v-if="page !== 'sweep'" class="switch" to="/">Sweep</RouterLink>
        <span v-else class="switch" aria-current="page">Sweep</span>

        <span v-if="wiring" class="switch" aria-current="page">Wiring</span>
        <RouterLink v-else class="switch" to="/about">Wiring</RouterLink>

        <span v-if="page === 'prompt'" class="switch" aria-current="page">Prompt</span>
        <RouterLink v-else class="switch" to="/prompt">Prompt</RouterLink>
      </nav>

      <RouterView v-if="page !== 'sweep'" />
      <p v-else class="line">{{ demo.line }}</p>
    </main>

    <footer class="foot">
      <label class="duration">
        <span>duration</span>
        <input
          type="range"
          :min="SWEEP_MS.min"
          :max="SWEEP_MS.max"
          :step="SWEEP_MS.step"
          :value="sweepMs"
          @input="onDuration"
        />
        <output>{{ sweepMs }} ms</output>
      </label>
    </footer>
  </div>
</template>
