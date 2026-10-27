// Reveal-mode sweep: one plain band with a real pause at the midpoint.
//
// `glimm`'s `playSweep` fires `onMidpoint` but keeps advancing; it only waits
// for the callback before the outro fade. A route commit that resolves after
// the band has left therefore shows the old page for the whole sweep and swaps
// it in at the end. That is the sequence the docs site used to have.
//
// This runner owns the clock instead: it freezes progress at `midpoint`, runs
// the commit, waits for the new view to paint, and only then lets the band
// continue. Fast routes resume on the next frame, so the pause is invisible;
// slow routes hold a band that is visibly waiting instead of a finished sweep
// over stale content.

import { resolveEasing, resolvePalette } from "glimm";
import type { Easing, ShaderController, SweepHandle, SweepOptions } from "glimm";
import { nextPaint } from "./covered.js";

function finite(value: number | undefined, fallback: number, min: number, max: number): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  return Math.max(min, Math.min(max, value));
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function easeInOutCubic(p: number): number {
  return p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
}

function applyOptions(ctrl: ShaderController, opts: SweepOptions): void {
  if (opts.palette) ctrl.setPalette(resolvePalette(opts.palette));
  if (opts.bandTight !== undefined) ctrl.setBandTight(opts.bandTight);
  if (opts.direction) ctrl.setDirection(opts.direction);
  if (opts.waveAmount !== undefined) ctrl.setWaveAmount(opts.waveAmount);
  if (opts.rippleAmount !== undefined) ctrl.setRippleAmount(opts.rippleAmount);
  if (opts.waveSpeed !== undefined) ctrl.setWaveSpeed(opts.waveSpeed);
  if (opts.brightness !== undefined) ctrl.setBrightness(opts.brightness);
  if (opts.swellAmount !== undefined) ctrl.setSwellAmount(opts.swellAmount);
}

export type RevealCommit = (signal: AbortSignal) => void | Promise<void>;

/**
 * Sweep 0 → `midpoint`, await `commit` plus one paint, then `midpoint` → 1.
 *
 * `opts.onMidpoint` runs before the commit and `opts.onComplete` after the
 * outro, matching `playSweep`'s contract.
 */
export function playRevealSweep(
  ctrl: ShaderController,
  commit: RevealCommit,
  opts: SweepOptions = {},
): SweepHandle {
  const sweepMs = finite(opts.sweepMs, 1100, 0, 60_000);
  const outroMs = finite(opts.outroMs, 220, 0, 60_000);
  const midpoint = finite(opts.midpoint, 0.56, 0, 1);
  const peakAlpha = finite(opts.peakAlpha, 1, 0, 1.5);
  const easing = (resolveEasing(opts.easing ?? "ease") ?? ((p: number) => p)) as Easing;

  applyOptions(ctrl, opts);

  const abort = new AbortController();
  let cancelled = false;
  let raf = 0;
  let elapsed = 0;
  let last = performance.now();
  let paused = false;
  let midpointFired = false;

  let resolveMidpoint!: () => void;
  let resolveDone!: () => void;
  const midpointP = new Promise<void>((resolve) => {
    resolveMidpoint = resolve;
  });
  const doneP = new Promise<void>((resolve) => {
    resolveDone = resolve;
  });

  const current = ctrl.getProgress();
  const start = current >= 0.999 ? 0 : clamp(current, 0, 1);
  const remaining = 1 - start;
  // Keep a floor so a very short duration still gets a frame to commit from.
  const duration = Math.max(80, sweepMs * remaining);

  const complete = () => {
    if (cancelled) return;
    ctrl.setProgress(0);
    try {
      opts.onComplete?.();
    } catch (error) {
      console.error("[glimm-adapters] onComplete callback failed:", error);
    }
    resolveDone();
  };

  const outro = () => {
    if (cancelled) return;
    const started = performance.now();
    const fade = (now: number) => {
      if (cancelled) return;
      const raw = outroMs === 0 ? 1 : Math.min(1, (now - started) / outroMs);
      ctrl.setAlpha(peakAlpha * (1 - easeInOutCubic(raw)));
      if (raw >= 1) complete();
      else raf = requestAnimationFrame(fade);
    };
    raf = requestAnimationFrame(fade);
  };

  const resume = () => {
    if (cancelled) return;
    paused = false;
    last = performance.now();
    raf = requestAnimationFrame(step);
  };

  const runCommit = async () => {
    try {
      await opts.onMidpoint?.();
      if (cancelled) return;
      await commit(abort.signal);
      if (cancelled) return;
      // The commit resolves after the router has updated its tree, not after
      // the browser has painted it. Wait for the paint so the band resumes
      // over the new view.
      await nextPaint(abort.signal);
    } catch (error) {
      console.error("[glimm-adapters] reveal commit failed:", error);
    } finally {
      resolveMidpoint();
      if (!cancelled) resume();
    }
  };

  function step(now: number): void {
    if (cancelled) return;
    if (!paused) elapsed += now - last;
    last = now;

    const raw = duration === 0 ? 1 : Math.min(1, elapsed / duration);
    const eased = clamp(easing(raw), 0, 1);
    const progress = start + remaining * eased;

    if (!midpointFired && progress >= midpoint) {
      midpointFired = true;
      paused = true;
      // Freeze exactly at the midpoint instead of a frame past it.
      ctrl.setProgress(midpoint);
      void runCommit();
      return;
    }

    ctrl.setProgress(progress);

    if (raw >= 1) {
      outro();
      return;
    }
    raf = requestAnimationFrame(step);
  }

  ctrl.setAlpha(peakAlpha);
  ctrl.setProgress(start);
  raf = requestAnimationFrame(step);

  return {
    midpoint: midpointP,
    done: doneP,
    cancel: () => {
      cancelled = true;
      abort.abort();
      cancelAnimationFrame(raf);
      resolveMidpoint();
      resolveDone();
    },
  };
}
