/**
 * The page-wide canvas and its controller.
 *
 * The theme switch, the easing preview and the band preview all sweep the whole
 * viewport, so they share one shader on `#app-page` rather than each building
 * their own WebGL context. The controller is created lazily on the first sweep,
 * so a visitor who never triggers one pays nothing.
 */

import { createShader, playSweep } from "glimm-adapters";
import type { ShaderController, SweepHandle, SweepOptions } from "glimm-adapters";
import { activePalette, getSweepState, subscribeSweep } from "./sweep-store";

let controller: ShaderController | null = null;
let canvas: HTMLCanvasElement | null = null;
let wired = false;
let active: SweepHandle | null = null;

/** The shared controller, creating it (and its canvas subscription) on demand. */
export function getPageController(): ShaderController | null {
  const current = document.getElementById("app-page");
  if (controller && canvas === current) return controller;
  // A non-persisted swap replaces the canvas node. Rebuild against the new one.
  if (controller && canvas !== current) {
    controller.destroy();
    controller = null;
  }
  if (!(current instanceof HTMLCanvasElement)) return null;
  canvas = current;
  const { bandTight } = getSweepState();
  controller = createShader({ canvas, palette: activePalette(), bandTight });
  if (controller && !wired) {
    wired = true;
    subscribeSweep(() => {
      controller?.setPalette(activePalette());
      controller?.setBandTight(getSweepState().bandTight);
    });
  }
  return controller;
}

/** Sweeps the whole page with the current store defaults plus any overrides. */
export function playPageSweep(overrides: SweepOptions = {}): SweepHandle | null {
  const pageController = getPageController();
  if (!pageController) return null;
  // glimm does not cancel the previous sweep when a new one starts, so two
  // overlapping sweeps would both write progress every frame. One at a time.
  active?.cancel();
  const { easing, bandTight } = getSweepState();
  const handle = playSweep(pageController, {
    palette: activePalette(),
    easing,
    bandTight,
    ...overrides,
  });
  active = handle;
  void handle.done.then(() => {
    if (active === handle) active = null;
  });
  return handle;
}
