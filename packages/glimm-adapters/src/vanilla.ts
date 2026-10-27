// Shared vanilla runner for the Svelte, Vue and vanilla adapters.
//
// Navigation defaults to one plain sweep with the route commit at its
// midpoint. `mode: "covered"` keeps the older cover → hold → reveal path for
// routes that may take longer than the band.

import { createShader, resolvePalette } from "glimm";
import type { ShaderController, SweepHandle, SweepOptions } from "glimm";
import {
  COMMIT_TIMEOUT_MS,
  ensureCurtainHost,
  playCoveredSweep,
  viewTransitionSettled,
  withTimeout,
} from "./covered.js";
import type { Curtain } from "./covered.js";
import { interceptLinks } from "./intercept.js";
import type { InterceptLinksOptions } from "./intercept.js";
import { playRevealSweep } from "./reveal.js";
import { createCanvasSlots, setupKey } from "./setup-key.js";

export type ReducedMotionMode = "instant" | "sweep";

export type SweepMode = "covered" | "reveal";

export type VanillaBaseSetup = {
  canvas: HTMLCanvasElement;
  defaults?: SweepOptions;
  intercept?: Omit<InterceptLinksOptions, "sweep">;
  reducedMotion?: ReducedMotionMode;
  /**
   * Navigation timing.
   *
   * `"reveal"` (default) plays one plain sweep. The route commits at the
   * midpoint and the new page paints as the band leaves. No curtain, no
   * second pass.
   *
   * `"covered"` plays cover → hold → reveal. The screen stays hidden while
   * the route commits, then the band sweeps the new page in. Use it when a
   * route can be slow enough that the old page would otherwise sit under a
   * finished sweep.
   *
   * A vanilla multi-page navigation without a `navigate` callback always
   * covers, since there is no new document to reveal in the same sweep.
   */
  mode?: SweepMode;
  onController?: (ctrl: ShaderController) => void;
};

export type ActiveHandle = SweepHandle & { interrupt?: () => void };

export type RunnerState = {
  active: ActiveHandle | null;
};

export function createRunnerState(): RunnerState {
  return { active: null };
}

export function trackHandle(state: RunnerState, handle: ActiveHandle | null): void {
  state.active = handle;
  if (handle) {
    void handle.done.finally(() => {
      if (state.active === handle) state.active = null;
    });
  }
}

/** Interrupt the in-flight sweep, preserving the curtain when possible. */
export function interruptActive(state: RunnerState): void {
  const current = state.active;
  state.active = null;
  if (!current) return;
  if (typeof current.interrupt === "function") current.interrupt();
  else current.cancel();
}

/** Cancel the in-flight sweep and drop the curtain. */
export function cancelActive(state: RunnerState): void {
  const current = state.active;
  state.active = null;
  current?.cancel();
}

export function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/**
 * Re-checked on every sweep, not cached at setup: a user can change the OS
 * setting without reloading the page. `sweep` opts out deliberately.
 */
export function shouldUseInstant(
  reducedMotion: ReducedMotionMode,
  controller: ShaderController | null,
): boolean {
  return !controller || (reducedMotion !== "sweep" && prefersReducedMotion());
}

export function createVanillaController(
  canvas: HTMLCanvasElement,
  defaults: SweepOptions,
  onController?: (ctrl: ShaderController) => void,
): ShaderController | null {
  const controller = createShader({
    canvas,
    palette: defaults.palette ? resolvePalette(defaults.palette) : undefined,
    bandTight: defaults.bandTight,
    direction: defaults.direction,
  });
  if (controller && onController) onController(controller);
  return controller;
}

/** No-op handle for instant fallbacks where interceptLinks expects a SweepHandle. */
export function noopSweepHandle(): SweepHandle {
  return {
    midpoint: Promise.resolve(),
    done: Promise.resolve(),
    cancel: () => {},
  };
}

function runComplete(options: SweepOptions): void {
  try {
    options.onComplete?.();
  } catch (error) {
    console.error("[glimm-adapters] onComplete callback failed:", error);
  }
}

export type RunSweepArgs = {
  state: RunnerState;
  controller: ShaderController | null;
  curtain: Curtain | null;
  defaults: SweepOptions;
  reducedMotion: ReducedMotionMode;
  commit: (signal: AbortSignal) => void | Promise<void>;
  options?: SweepOptions;
};

/** Everything a sweep needs except the commit itself. */
export type SweepBase = Omit<RunSweepArgs, "commit" | "options">;

/**
 * Single place for merged options, instant fallback, interruption,
 * and covered vs plain sweep selection.
 */
export function runVanillaSweep(args: RunSweepArgs): SweepHandle | null {
  const { state, controller, curtain, defaults, reducedMotion, commit, options } = args;
  const merged: SweepOptions = { ...defaults, ...options };
  if (shouldUseInstant(reducedMotion, controller) || !controller) {
    // The instant path must still honour caller callbacks, and a rejected
    // navigation must not become an unhandled rejection. Keep the commit
    // synchronous when onMidpoint is synchronous: a click handler should
    // start navigating before `sweep()` returns null.
    cancelActive(state);
    const navigate = () => {
      try {
        const result = commit(new AbortController().signal);
        if (result && typeof (result as Promise<void>).then === "function") {
          void (result as Promise<void>).then(
            () => runComplete(merged),
            (error: unknown) => {
              console.error("[glimm-adapters] instant navigation failed:", error);
              runComplete(merged);
            },
          );
        } else {
          runComplete(merged);
        }
      } catch (error) {
        console.error("[glimm-adapters] instant navigation failed:", error);
        runComplete(merged);
      }
    };
    try {
      const midpoint = merged.onMidpoint?.();
      if (midpoint && typeof (midpoint as Promise<void>).then === "function") {
        void (midpoint as Promise<void>).then(navigate, (error: unknown) => {
          console.error("[glimm-adapters] midpoint callback failed:", error);
          navigate();
        });
      } else {
        navigate();
      }
    } catch (error) {
      console.error("[glimm-adapters] midpoint callback failed:", error);
      navigate();
    }
    return null;
  }
  interruptActive(state);
  if (!curtain) {
    // A previous plain sweep may have been cancelled mid-band. Start fresh.
    controller.setAlpha(0);
    controller.setProgress(0);
    // Reveal mode owns the clock: the band freezes at the midpoint until the
    // commit has painted, so the new page never appears after the sweep.
    const handle = playRevealSweep(
      controller,
      (signal) =>
        withTimeout(
          Promise.resolve().then(() => commit(signal)),
          COMMIT_TIMEOUT_MS,
          "content commit",
        ),
      merged,
    ) as ActiveHandle;
    trackHandle(state, handle);
    return handle;
  }
  const handle = playCoveredSweep(
    controller,
    curtain,
    async (signal) => {
      await merged.onMidpoint?.();
      await commit(signal);
    },
    merged,
  ) as ActiveHandle;
  trackHandle(state, handle);
  return handle;
}

/**
 * Sweep callback for interceptLinks. Runs the navigation through the shared
 * runner and always returns a SweepHandle (no-op on instant fallback).
 */
export function sweepForIntercept(base: SweepBase) {
  return (nav: () => void | Promise<void>, options?: SweepOptions): SweepHandle => {
    const handle = runVanillaSweep({ ...base, commit: () => nav(), options });
    return handle ?? noopSweepHandle();
  };
}

export type CurtainHost = {
  host: HTMLDivElement;
  curtain: Curtain;
  restore: () => void;
};

export function ensureHost(
  canvas: HTMLCanvasElement,
  controller: ShaderController | null,
): CurtainHost | null {
  if (!controller) return null;
  return ensureCurtainHost(canvas);
}

export type VanillaRuntime = {
  controller: ShaderController | null;
  state: RunnerState;
  curtain: Curtain | null;
  defaults: SweepOptions;
  reducedMotion: ReducedMotionMode;
  run: (commit: RunSweepArgs["commit"], options?: SweepOptions) => SweepHandle | null;
  destroy: () => void;
};

/**
 * Common setup shared by the Svelte and Vue shells. Astro keeps its own
 * runtime because it has to re-host the canvas after every swap.
 */
export function createVanillaRuntime(
  canvas: HTMLCanvasElement,
  defaults: SweepOptions,
  reducedMotion: ReducedMotionMode,
  mode: SweepMode = "reveal",
  onController?: (ctrl: ShaderController) => void,
): VanillaRuntime {
  const controller = createVanillaController(canvas, defaults, onController);
  const hosted = ensureHost(canvas, controller);
  const state = createRunnerState();
  // Reveal mode still needs the host for canvas positioning, but passes no
  // curtain to the runner so it takes the single-sweep branch.
  const curtain = mode === "reveal" ? null : (hosted?.curtain ?? null);
  return {
    controller,
    state,
    curtain,
    defaults,
    reducedMotion,
    run: (commit, options) =>
      runVanillaSweep({ state, controller, curtain, defaults, reducedMotion, commit, options }),
    destroy: () => {
      cancelActive(state);
      controller?.setAlpha(0);
      controller?.setProgress(0);
      controller?.destroy();
      hosted?.restore();
    },
  };
}

/** Your router's navigation function. Omit it for a full document navigation. */
export type VanillaNavigate = (href: string) => void | Promise<void>;

export type VanillaSweepSetup = VanillaBaseSetup & {
  /**
   * Router navigation. Return a promise that resolves after the route has
   * committed; the adapter waits for the next paint before the band leaves.
   * Omit it and glimm covers the screen and lets the browser unload.
   */
  navigate?: VanillaNavigate;
};

export type VanillaSweepApi = {
  navigate: (href: string, options?: SweepOptions) => SweepHandle | null;
  /**
   * Run a sweep around any commit, not just navigation. In reveal mode the
   * commit runs inside the single sweep. In covered mode it runs at the hold,
   * so the reveal plays over the changed page.
   */
  sweep: (
    commit: (signal: AbortSignal) => void | Promise<void>,
    options?: SweepOptions,
  ) => SweepHandle | null;
  destroy: () => void;
  controller: ShaderController | null;
};

const vanillaSlots = createCanvasSlots<VanillaSweepApi>();

/**
 * Framework-free setup. Works with any router that exposes a navigate
 * callback, and with plain multi-page navigation when none is passed.
 *
 * ```ts
 * import { setupGlimmVanilla } from 'glimm-adapters/vanilla'
 * import { router } from './router'
 *
 * const glimm = setupGlimmVanilla({
 *   canvas: document.querySelector('#glimm'),
 *   navigate: (href) => router.push(href),
 * })
 * ```
 *
 * The click interceptor runs in the capture phase, so it starts the sweep
 * before the router's own click handler. Opt links out with `data-glimm-skip`.
 */
export function setupGlimmVanilla({
  canvas,
  navigate,
  defaults = {},
  intercept = {},
  reducedMotion = "instant",
  mode = "reveal",
  onController,
}: VanillaSweepSetup): VanillaSweepApi {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return { navigate: () => null, sweep: () => null, destroy: () => {}, controller: null };
  }

  const key = setupKey({ defaults, reducedMotion, navigate, extra: mode });
  const existing = vanillaSlots.get(canvas);
  if (existing) {
    if (existing.setupKey === key && canvas.isConnected) return existing.api;
    existing.api.destroy();
  }

  const controller = createVanillaController(canvas, defaults, onController);
  const state = createRunnerState();
  const hosted = ensureHost(canvas, controller);
  const spa = typeof navigate === "function";
  // A full document navigation has no new page to reveal in the same sweep.
  const curtain = mode === "reveal" && spa ? null : (hosted?.curtain ?? null);
  const go: VanillaNavigate = navigate ?? ((href) => void window.location.assign(href));

  /**
   * Wait for the router's commit, then for any native View Transition to
   * finish. Without the second wait the reveal plays under the crossfade.
   */
  const commitSpa = (href: string) => async (signal: AbortSignal) => {
    await go(href);
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
      curtain,
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
    sweepForIntercept({ state, controller, curtain, defaults, reducedMotion }),
    rawNavigate,
    intercept,
  );

  const api: VanillaSweepApi = {
    navigate: navigateSweep,
    sweep,
    destroy: () => {
      cleanup();
      cancelActive(state);
      controller?.setAlpha(0);
      controller?.setProgress(0);
      controller?.destroy();
      hosted?.restore();
      vanillaSlots.delete(canvas, api);
    },
    controller,
  };
  vanillaSlots.set(canvas, { api, setupKey: key });
  return api;
}
