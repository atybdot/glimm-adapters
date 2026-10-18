// Vue / Nuxt adapter for glimm.
//
// Same shape as the Svelte entry: vanilla core owns the canvas, this file is
// the thin shell that runs clicks through one plain sweep by default, calls
// `router.push` at the midpoint, and waits for the new view to paint before
// the band leaves. Pass `mode: "covered"` for a slow route that needs a
// curtain. The router is passed in, never imported, so this entry works with
// vue-router and Nuxt alike.

import type { Palette, PaletteName, ShaderController, SweepHandle, SweepOptions } from "glimm";
import { interceptLinks, defaultShouldIntercept } from "./intercept.js";
import type { InterceptLinksOptions } from "./intercept.js";
import { createCanvasSlots, setupKey } from "./setup-key.js";
import { createVanillaRuntime, sweepForIntercept } from "./vanilla.js";
import type { VanillaBaseSetup } from "./vanilla.js";

export { defaultShouldIntercept, interceptLinks };
export { createShader, playSweep } from "glimm";
export type { Palette, PaletteName, ShaderController, SweepOptions, InterceptLinksOptions };
export type { SweepMode } from "./vanilla.js";

/** Minimal surface of vue-router's router used here. */
export type VueRouterLike = {
  push: (href: string) => void | Promise<void>;
  replace?: (href: string) => void | Promise<void>;
  back?: () => void | Promise<void>;
};

export type VueSweepSetup = VanillaBaseSetup & {
  router: VueRouterLike;
};

export type VueSweepApi = {
  push: (href: string, options?: SweepOptions) => SweepHandle | null;
  replace: (href: string, options?: SweepOptions) => SweepHandle | null;
  destroy: () => void;
  controller: ShaderController | null;
};

const slots = createCanvasSlots<VueSweepApi>();

/**
 * Wire glimm into a Vue app. Call once on mount (client-only):
 *
 * ```ts
 * // App.vue
 * import { useRouter } from 'vue-router'
 * import { setupGlimmVue } from 'glimm-adapters/vue'
 *
 * const router = useRouter()
 * onMounted(() => {
 *   const glimm = setupGlimmVue({ canvas: canvasEl.value!, router })
 *   onUnmounted(() => glimm.destroy())
 * })
 * ```
 */
export function setupGlimmVue({
  canvas,
  router,
  defaults = {},
  intercept = {},
  reducedMotion = "instant",
  mode = "reveal",
  onController,
}: VueSweepSetup): VueSweepApi {
  if (typeof window === "undefined" || typeof document === "undefined") {
    const nil = () => null;
    return { push: nil, replace: nil, destroy: () => {}, controller: null };
  }

  // Nuxt plugins and HMR can run setup twice. Reuse the live instance instead
  // of creating a second shader and click listener.
  const key = setupKey({ defaults, reducedMotion, navigate: router, extra: mode });
  const existing = slots.get(canvas);
  if (existing) {
    if (existing.setupKey === key && canvas.isConnected) return existing.api;
    existing.api.destroy();
  }

  const runtime = createVanillaRuntime(canvas, defaults, reducedMotion, mode, onController);

  const cleanup = interceptLinks(
    sweepForIntercept(runtime),
    (href) => router.push(href),
    intercept,
  );

  const api: VueSweepApi = {
    push: (href, options) => runtime.run(() => router.push(href), options),
    replace: (href, options) =>
      runtime.run(() => (router.replace ? router.replace(href) : router.push(href)), options),
    destroy: () => {
      cleanup();
      runtime.destroy();
      slots.delete(canvas, api);
    },
    controller: runtime.controller,
  };
  slots.set(canvas, { api, setupKey: key });
  return api;
}
