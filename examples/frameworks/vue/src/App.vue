<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { setupGlimmVue, type VueSweepApi } from "glimm-adapters/vue";

const canvas = ref<HTMLCanvasElement | null>(null);
const route = useRoute();
const router = useRouter();
const page = computed(() => (route.path === "/about" ? "about" : "home"));

// vue-router resolves once the route is confirmed, which can be a tick before
// Vue has patched the DOM. The adapter waits for the next paint after this
// promise resolves, so a tick here is enough.
const sweepRouter = {
  push: async (href: string) => {
    await router.push(href);
    await nextTick();
  },
  replace: async (href: string) => {
    await router.replace(href);
    await nextTick();
  },
};

let glimm: VueSweepApi | null = null;

onMounted(() => {
  if (canvas.value) {
    glimm = setupGlimmVue({ canvas: canvas.value, router: sweepRouter, mode: "reveal" });
  }
});

onUnmounted(() => glimm?.destroy());
</script>

<template>
  <div class="backdrop" aria-hidden="true"></div>
  <canvas ref="canvas" id="glimm" aria-hidden="true"></canvas>

  <div class="page" :data-page="page">
    <header class="topbar">
      <RouterLink class="brand" to="/"> <span class="mark" /> glimm <span>/ Vue</span> </RouterLink>
      <nav>
        <RouterLink to="/" :aria-current="page === 'home' ? 'page' : undefined">Home</RouterLink>
        <RouterLink to="/about" :aria-current="page === 'about' ? 'page' : undefined">
          About
        </RouterLink>
      </nav>
    </header>

    <main>
      <section class="hero">
        <RouterView />
      </section>
    </main>

    <footer class="footer">
      <span>glimm-adapters / vue</span>
      <span>setupGlimmVue · reveal sweep</span>
    </footer>
  </div>
</template>
