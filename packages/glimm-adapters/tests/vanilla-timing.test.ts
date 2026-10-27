import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("glimm", async (importOriginal) => {
  const actual = await importOriginal<typeof import("glimm")>();
  const { fakeGlimm } = await import("./support/fake-glimm.js");
  return {
    ...actual,
    createShader: () => fakeGlimm.controller,
    playSweep: ((ctrl, options) => fakeGlimm.playSweep(ctrl, options)) as typeof actual.playSweep,
  };
});

import { setupGlimmVanilla } from "../src/vanilla.js";
import { fakeGlimm } from "./support/fake-glimm.js";
import { curtainState, mountPages, pageMounted, renderPage, stubFrames } from "./support/timing.js";

describe("setupGlimmVanilla navigation timing", () => {
  let frames: ReturnType<typeof stubFrames>;

  beforeEach(() => {
    fakeGlimm.reset();
    frames = stubFrames();
  });

  afterEach(() => {
    frames.mockRestore();
  });

  it("runs one plain sweep and commits page B at its midpoint", async () => {
    const { canvas } = mountPages();
    let curtainAtCommit = "";
    let progressAtCommit = 0;
    const progressValues: number[] = [];
    const setProgress = fakeGlimm.controller.setProgress;
    vi.spyOn(fakeGlimm.controller, "setProgress").mockImplementation((value: number) => {
      progressValues.push(value);
      setProgress(value);
    });
    let framesAtCommit = 0;
    const navigate = vi.fn<() => Promise<void>>(async () => {
      curtainAtCommit = curtainState();
      framesAtCommit = progressValues.length;
      progressAtCommit = fakeGlimm.controller.getProgress();
      // Page B must not be on screen before the glimm effect has started.
      expect(pageMounted("b")).toBe(false);
      renderPage("b");
    });

    const api = setupGlimmVanilla({ canvas, navigate });
    const handle = api.navigate("/b");
    expect(handle).not.toBeNull();

    await handle!.done;

    expect(navigate).toHaveBeenCalledWith("/b");
    expect(progressAtCommit).toBeCloseTo(0.56, 5);
    // The band keeps moving after the commit, so it finishes over page B.
    const afterCommit = progressValues
      .slice(framesAtCommit)
      .filter((value) => value > 0.56 && value < 1);
    expect(afterCommit.length).toBeGreaterThan(0);
    // Reveal mode is a single band, not glimm's double-play sweep.
    expect(fakeGlimm.playSweep).not.toHaveBeenCalled();
    expect(curtainAtCommit).toBe("idle");
    expect(pageMounted("b")).toBe(true);
    expect(curtainState()).toBe("idle");
    api.destroy();
  });

  it("does not render page B before the sweep starts", async () => {
    const { canvas } = mountPages();
    const order: string[] = [];
    const navigate = vi.fn<() => Promise<void>>(async () => {
      order.push("commit");
      renderPage("b");
    });

    const api = setupGlimmVanilla({ canvas, navigate });
    const handle = api.navigate("/b")!;

    // The commit runs from the sweep midpoint, not from the click.
    await Promise.resolve();
    expect(navigate).not.toHaveBeenCalled();
    expect(pageMounted("b")).toBe(false);

    await handle.done;
    expect(order).toEqual(["commit"]);
    api.destroy();
  });

  it("keeps covered mode available for slow routes", async () => {
    const { canvas } = mountPages();
    let curtainAtCommit = "";
    const navigate = vi.fn<() => Promise<void>>(async () => {
      curtainAtCommit = curtainState();
      expect(pageMounted("b")).toBe(false);
      renderPage("b");
    });

    const api = setupGlimmVanilla({ canvas, navigate, mode: "covered" });
    const handle = api.navigate("/b")!;

    await handle.done;

    expect(curtainAtCommit).toBe("hold");
    expect(fakeGlimm.playSweep).toHaveBeenCalledTimes(2);
    expect(pageMounted("b")).toBe(true);
    expect(curtainState()).toBe("idle");
    api.destroy();
  });

  it("reuses the instance for the same canvas and setup, and rebuilds on a new router or mode", () => {
    const { canvas } = mountPages();
    const navigate = async () => {};

    const first = setupGlimmVanilla({ canvas, navigate });
    const second = setupGlimmVanilla({ canvas, navigate });
    expect(second).toBe(first);

    const third = setupGlimmVanilla({ canvas, navigate: async () => {} });
    expect(third).not.toBe(first);
    third.destroy();

    const fourth = setupGlimmVanilla({ canvas, navigate, mode: "covered" });
    expect(fourth).not.toBe(first);
    fourth.destroy();
  });

  it("wraps a non-navigation commit in one sweep when a router is present", async () => {
    const { canvas } = mountPages();
    const api = setupGlimmVanilla({ canvas, navigate: async () => {} });
    let curtainAtCommit = "";
    let progressAtCommit = 0;
    const handle = api.sweep(async () => {
      curtainAtCommit = curtainState();
      progressAtCommit = fakeGlimm.controller.getProgress();
    });

    await handle!.done;
    expect(curtainAtCommit).toBe("idle");
    expect(progressAtCommit).toBeCloseTo(0.56, 5);
    expect(fakeGlimm.playSweep).not.toHaveBeenCalled();
    api.destroy();
  });

  it("falls back to a covered sweep for multi-page navigation", async () => {
    const { canvas } = mountPages();
    const api = setupGlimmVanilla({ canvas });
    let curtainAtCommit = "";
    const handle = api.sweep(async () => {
      curtainAtCommit = curtainState();
    });

    await handle!.done;
    expect(curtainAtCommit).toBe("hold");
    expect(fakeGlimm.playSweep).toHaveBeenCalledTimes(2);
    expect(curtainState()).toBe("idle");
    api.destroy();
  });
});
