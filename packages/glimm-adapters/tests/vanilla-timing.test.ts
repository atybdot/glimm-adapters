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
    let sweepsAtCommit = 0;
    let progressAtCommit = 0;
    const navigate = vi.fn<() => Promise<void>>(async () => {
      curtainAtCommit = curtainState();
      sweepsAtCommit = fakeGlimm.playSweep.mock.calls.length;
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
    expect(sweepsAtCommit).toBe(1);
    expect(progressAtCommit).toBe(1);
    expect(fakeGlimm.playSweep).toHaveBeenCalledTimes(1);
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
    const handle = api.sweep(async () => {
      curtainAtCommit = curtainState();
    });

    await handle!.done;
    expect(curtainAtCommit).toBe("idle");
    expect(fakeGlimm.playSweep).toHaveBeenCalledTimes(1);
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
