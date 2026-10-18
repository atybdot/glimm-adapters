// SvelteKit adapter for glimm.
//
// SvelteKit has no `<GlimmProvider>` — the vanilla core owns the canvas and
// the sweep state machine. This entry provides the thin shell: run every
// same-origin click through one plain sweep by default, commit the route at
// its midpoint, and let `goto` finish before the band leaves. Pass
// `mode: "covered"` when a route can be slow enough to need a curtain.
//
// No static import of `$app/navigation` here so this entry stays importable
// outside SvelteKit (and SSR-safe: all helpers no-op without `window`).

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

/** SvelteKit's `goto` — passed in by the caller, never imported here. */
export type SvelteGoto = (href: string) => void | Promise<void>;

export type SvelteSweepSetup = VanillaBaseSetup & {
  /** SvelteKit `goto` from `$app/navigation`. */
  goto: SvelteGoto;
};

export type SvelteSweepApi = {
  /** Sweep-animated navigation. Null when reduced-motion/WebGL fallback. */
  navigate: (href: string, options?: SweepOptions) => SweepHandle | null;
  /** Remove the delegated click listener. */
  destroy: () => void;
  /** The underlying shader controller (null when WebGL unavailable/SSR). */
  controller: ShaderController | null;
};

const slots = createCanvasSlots<SvelteSweepApi>();

/**
 * Wire glimm into a SvelteKit app. Call once in `onMount` (client-only):
 *
 * ```svelte
 * <script lang="ts">
 *   import { onMount } from 'svelte'
 *   import { goto } from '$app/navigation'
 *   import { setupGlimm } from 'glimm-adapters/svelte'
 *
 *   let canvas: HTMLCanvasElement
 *   let glimm: ReturnType<typeof setupGlimm>
 *   onMount(() => {
 *     glimm = setupGlimm({ canvas, goto, defaults: { palette: 'prism' } })
 *     return () => glimm?.destroy()
 *   })
 * </script>
 *
 * <canvas bind:this={canvas} class="glimm-canvas" />
 * ```
 *
 * Per-link overrides: call `glimm.navigate(href, { palette: 'berry' })`
 * directly. Opt links out with `data-glimm-skip`.
 */
export function setupGlimm({
  canvas,
  goto,
  defaults = {},
  intercept = {},
  reducedMotion = "instant",
  mode = "reveal",
  onController,
}: SvelteSweepSetup): SvelteSweepApi {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return { navigate: () => null, destroy: () => {}, controller: null };
  }

  // A layout mount can run more than once (HMR, a remounted layout). Reuse
  // the live instance instead of creating a second shader and click listener.
  const key = setupKey({ defaults, reducedMotion, navigate: goto, extra: mode });
  const existing = slots.get(canvas);
  if (existing) {
    if (existing.setupKey === key && canvas.isConnected) return existing.api;
    existing.api.destroy();
  }

  const runtime = createVanillaRuntime(canvas, defaults, reducedMotion, mode, onController);
  const navigate = (href: string, options?: SweepOptions) => runtime.run(() => goto(href), options);

  const cleanup = interceptLinks(sweepForIntercept(runtime), (href) => goto(href), intercept);

  const api: SvelteSweepApi = {
    navigate,
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
