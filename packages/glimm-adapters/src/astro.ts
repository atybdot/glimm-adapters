// Astro adapter for glimm.
//
// Timing: a fast route only needs the band to cross once, with the commit at
// its midpoint. That is `mode: "reveal"` (the default). A slow route needs the
// screen hidden until the new view paints. A naked `playSweep` cannot do that:
// at progress 1 the band has already exited, so the hold shows the old page and
// the outro fades an exited band. `mode: "covered"` uses `playCoveredSweep`
// instead: cover → opaque curtain hold while Astro swaps → reveal the NEW page.
//
// Requires Astro View Transitions (`<ClientRouter />` in the layout) and
// `navigate` from `astro:transitions/client` so the swap happens without
// destroying the canvas. The canvas must survive swaps: give it
// `transition:persist`. Without `navigate` this covers, starts the location
// change from the hold, and stays covered until the browser unloads.

import type { Palette, PaletteName, ShaderController, SweepHandle, SweepOptions } from "glimm";
import { interceptLinks, defaultShouldIntercept } from "./intercept.js";
import type { InterceptLinksOptions } from "./intercept.js";
import {
  COMMIT_TIMEOUT_MS,
  ensureCurtainHost,
  nextPaint,
  viewTransitionSettled,
} from "./covered.js";
import type { Curtain } from "./covered.js";
import { createCanvasSlots, setupKey } from "./setup-key.js";
import {
  createRunnerState,
  createVanillaController,
  interruptActive,
  runVanillaSweep,
  shouldUseInstant,
  sweepForIntercept,
} from "./vanilla.js";
import type { VanillaBaseSetup } from "./vanilla.js";

export { defaultShouldIntercept, interceptLinks };
export { createShader, playSweep } from "glimm";
export type { Palette, PaletteName, ShaderController, SweepOptions, InterceptLinksOptions };

/** Astro's `navigate` from `astro:transitions/client` — passed in by caller. */
export type AstroNavigate = (href: string) => void | Promise<void>;

export type AstroSweepSetup = VanillaBaseSetup & {
  /** From `astro:transitions/client`. Defaults to a location change (no reveal). */
  navigate?: AstroNavigate;
  /**
   * How a navigation is animated.
   *
   * `"reveal"` (default) plays one plain sweep. The band starts on the old page,
   * commits at the midpoint, and finishes as the new page paints. There is no
   * curtain and no second pass.
   *
   * `"covered"` is the two-pass cover → hold → reveal: the screen is hidden
   * while the route commits, then the band sweeps the new page in. Use it when
   * the route can be slow enough that the old page would otherwise sit under a
   * finished sweep.
   *
   * Multi-page navigation without a `navigate` callback always uses the covered
   * path: there is no new document to reveal in the same sweep.
   */
  mode?: "covered" | "reveal";
};

export type AstroSweepApi = {
  navigate: (href: string, options?: SweepOptions) => SweepHandle | null;
  /**
   * Run a sweep around any commit, not just navigation. In covered mode the
   * commit runs at the hold, so the reveal plays over the changed page — theme
   * swaps, filters, layout changes. In reveal mode the commit runs inside the
   * single sweep. Falls back to running the commit at once when reduced motion
   * is on or WebGL is missing.
   */
  sweep: (
    commit: (signal: AbortSignal) => void | Promise<void>,
    options?: SweepOptions,
  ) => SweepHandle | null;
  destroy: () => void;
  controller: ShaderController | null;
};

/** Resolves after Astro fires `astro:after-swap` (or after `timeoutMs`). */
function afterSwap(timeoutMs = COMMIT_TIMEOUT_MS): Promise<void> {
  if (typeof document === "undefined") return Promise.resolve();
  return new Promise((resolve) => {
    let settled = false;
    const onSwap = () => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      document.removeEventListener("astro:after-swap", onSwap);
      resolve();
    };
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      document.removeEventListener("astro:after-swap", onSwap);
      resolve();
    }, timeoutMs);
    document.addEventListener("astro:after-swap", onSwap, { once: true });
  });
}

/** The public API plus the internal re-host step used after a swap. */
type SlotApi = AstroSweepApi & { rehost: () => void };

const slots = createCanvasSlots<SlotApi>();

// Astro runs one glimm instance per page. Track the last live one so setup on
// a replacement canvas can tear down the previous interceptor and listener.
let activeAstro: { canvas: HTMLCanvasElement; api: AstroSweepApi } | null = null;

/**
 * Wire glimm into an Astro layout (client-only):
 *
 * ```astro
 * ---
 * import { ClientRouter } from 'astro:transitions'
 * ---
 * <head><ClientRouter fallback="swap" /></head>
 * <html transition:animate="none">
 * <canvas id="glimm" transition:persist="glimm-canvas" />
 * <script>
 *   import { navigate } from 'astro:transitions/client'
 *   import { setupGlimmAstro } from 'glimm-adapters/astro'
 *   const canvas = document.querySelector('#glimm')
 *   setupGlimmAstro({ canvas, navigate })
 * </script>
 * ```
 *
 * `transition:animate="none"` (or CSS that cancels `::view-transition-*`)
 * keeps Astro's crossfade from running on top of the reveal. If the author
 * leaves it on, the adapter waits for those animations to finish before it
 * reveals, so the sweep is late rather than invisible.
 *
 * The delegated click interceptor runs in the capture phase, before Astro's
 * own router. Opt links out with `data-glimm-skip`.
 */
export function setupGlimmAstro({
  canvas,
  navigate,
  defaults = {},
  intercept = {},
  reducedMotion = "instant",
  mode = "reveal",
  onController,
}: AstroSweepSetup): AstroSweepApi {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return { navigate: () => null, sweep: () => null, destroy: () => {}, controller: null };
  }

  // A new canvas means the old instance is stale. Tear it down before it can
  // keep intercepting clicks or re-parent a detached canvas on swap.
  if (activeAstro && activeAstro.canvas !== canvas) activeAstro.api.destroy();

  // The persisted canvas (transition:persist) keeps its setup across swaps.
  // Dedupe so we never double-bind the interceptor or double-host the canvas.
  // If setup config changed, tear down the old slot and rebuild.
  const key = setupKey({ defaults, reducedMotion, navigate, extra: mode });
  const existing = slots.get(canvas);
  if (existing) {
    if (existing.setupKey === key && canvas.isConnected) {
      existing.api.rehost();
      return existing.api;
    }
    existing.api.destroy();
  }
  const spa = typeof navigate === "function";
  const go: AstroNavigate = navigate ?? ((href) => void window.location.assign(href));

  const controller = createVanillaController(canvas, defaults, onController);
  const state = createRunnerState();

  // Curtain host: fixed overlay holding the WebGL canvas + opaque curtain
  // together, mirroring glimm/react's provider host. `ensureCurtainHost`
  // reuses the same host and curtain after a swap, so an in-flight covered
  // sweep stays attached to the document. The canvas also needs
  // `transition:persist` to survive the swap itself.
  let curtain: Curtain | null = null;
  let restoreCanvas: (() => void) | null = null;
  const hostCanvas = () => {
    if (!controller || typeof document === "undefined") return;
    if (canvas.parentElement?.hasAttribute("data-glimm-host")) return;
    const hosted = ensureCurtainHost(canvas);
    curtain = hosted.curtain;
    restoreCanvas = hosted.restore;
  };
  hostCanvas();
  // Astro removes the runtime host on swap (only the canvas itself is
  // persisted). Re-host around the surviving canvas.
  const onSwap = () => hostCanvas();
  document.addEventListener("astro:after-swap", onSwap);

  const commitSpa = (href: string) => async (signal: AbortSignal) => {
    if (signal.aborted) return;
    // Listen before navigating: navigate() may resolve after the event.
    const swapped = afterSwap();
    await go(href);
    if (signal.aborted) return;
    await Promise.race([swapped, nextPaint(signal)]);
    // Astro's navigate() resolves at `updateCallbackDone`, not `finished`, so
    // the native crossfade can still be running. Reveal underneath it and the
    // first half of the sweep is invisible.
    if (!signal.aborted) await viewTransitionSettled();
  };

  // MPA has no swap to wait for. Start the location change from the hold and
  // keep the curtain up; the page unloads. If navigation is blocked, the
  // covered sweep's timeout releases the curtain.
  const mpaNavigate = (href: string): void | Promise<void> => {
    const result = go(href);
    if (shouldUseInstant(reducedMotion, controller)) return result;
    return new Promise<void>(() => {});
  };

  const run = (commit: (signal: AbortSignal) => void | Promise<void>, options?: SweepOptions) =>
    runVanillaSweep({
      state,
      controller,
      // Reveal mode is one plain sweep: no curtain, so runVanillaSweep takes
      // its single-sweep branch and commits at the midpoint. A multi-page
      // navigation has no new document to reveal in the same sweep, so it
      // stays covered even when reveal is requested.
      curtain: mode === "reveal" && spa ? null : curtain,
      defaults,
      reducedMotion,
      commit,
      options,
    });

  const navigateSweep = (href: string, options?: SweepOptions) =>
    run(spa ? commitSpa(href) : () => mpaNavigate(href), options);

  const sweep = (
    commit: (signal: AbortSignal) => void | Promise<void>,
    options?: SweepOptions,
  ): SweepHandle | null => run(commit, options);

  const rawNavigate = (href: string): void | Promise<void> => {
    if (spa) return commitSpa(href)(new AbortController().signal);
    return mpaNavigate(href);
  };

  const cleanup = interceptLinks(
    sweepForIntercept({
      state,
      controller,
      curtain: mode === "reveal" && spa ? null : curtain,
      defaults,
      reducedMotion,
    }),
    rawNavigate,
    intercept,
  );

  const api: SlotApi = {
    navigate: navigateSweep,
    sweep,
    destroy: () => {
      cleanup();
      interruptActive(state);
      controller?.setAlpha(0);
      controller?.setProgress(0);
      controller?.destroy();
      document.removeEventListener("astro:after-swap", onSwap);
      restoreCanvas?.();
      slots.delete(canvas, api);
      if (activeAstro?.api === api) activeAstro = null;
    },
    controller,
    rehost: hostCanvas,
  };
  slots.set(canvas, { api, setupKey: key });
  activeAstro = { canvas, api };
  return api;
}
