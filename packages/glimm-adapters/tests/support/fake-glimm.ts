import { vi } from "vitest";
import type { ShaderController, SweepHandle, SweepOptions } from "glimm";
import { createMockController } from "./timing.js";

type FakeController = ShaderController;

/**
 * A deterministic stand-in for glimm's engine.
 *
 * `playSweep` lands on progress 1, fires `onMidpoint`, and only then resolves
 * `done`, which is the contract `playCoveredSweep` relies on. The real engine
 * also waits for `onMidpoint` before the outro; a fake that resolves early
 * would let the reveal start before the commit and the tests would pass
 * against a broken adapter.
 */
function createPlaySweep() {
  return vi.fn<(ctrl: FakeController, opts?: SweepOptions) => SweepHandle>(
    (ctrl: FakeController, opts: SweepOptions = {}): SweepHandle => {
      let cancelled = false;
      const task = (async () => {
        ctrl.setProgress(1);
        await Promise.resolve();
        if (cancelled) return;
        await opts.onMidpoint?.();
        if (cancelled) return;
        opts.onComplete?.();
      })();
      return {
        midpoint: task.then(() => undefined),
        done: task,
        cancel: () => {
          cancelled = true;
        },
      };
    },
  );
}

export const fakeGlimm = {
  controller: createMockController() as FakeController,
  playSweep: createPlaySweep(),
  reset() {
    this.controller = createMockController();
    this.playSweep = createPlaySweep();
  },
};
