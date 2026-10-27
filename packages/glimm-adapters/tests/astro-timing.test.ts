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

import { setupGlimmAstro } from "../src/astro.js";
import { fakeGlimm } from "./support/fake-glimm.js";
import { curtainState, mountPages, pageMounted, renderPage, stubFrames } from "./support/timing.js";

describe("setupGlimmAstro navigation timing", () => {
  let frames: ReturnType<typeof stubFrames>;

  beforeEach(() => {
    fakeGlimm.reset();
    frames = stubFrames();
  });

  afterEach(() => {
    frames.mockRestore();
  });

  it("holds the cover through astro:after-swap and reveals page B", async () => {
    const { canvas } = mountPages();
    let curtainAtCommit = "";
    let curtainAfterSwap = "";
    const navigate = vi.fn<() => Promise<void>>(async () => {
      curtainAtCommit = curtainState();
      expect(pageMounted("b")).toBe(false);
      renderPage("b");
      document.dispatchEvent(new Event("astro:after-swap"));
      curtainAfterSwap = curtainState();
    });

    const api = setupGlimmAstro({ canvas, navigate, mode: "covered" });
    const handle = api.navigate("/b");
    expect(handle).not.toBeNull();

    await handle!.done;

    expect(navigate).toHaveBeenCalledWith("/b");
    expect(curtainAtCommit).toBe("hold");
    expect(curtainAfterSwap).toBe("hold");
    expect(pageMounted("b")).toBe(true);
    expect(curtainState()).toBe("idle");
    api.destroy();
  });

  it("runs one plain sweep by default and commits at its midpoint", async () => {
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
      expect(pageMounted("b")).toBe(false);
      renderPage("b");
      document.dispatchEvent(new Event("astro:after-swap"));
    });

    const api = setupGlimmAstro({ canvas, navigate });
    const handle = api.navigate("/b");
    expect(handle).not.toBeNull();

    await handle!.done;

    expect(navigate).toHaveBeenCalledWith("/b");
    expect(progressAtCommit).toBeCloseTo(0.56, 5);
    // The commit happens inside the same single sweep, not between two.
    const afterCommit = progressValues
      .slice(framesAtCommit)
      .filter((value) => value > 0.56 && value < 1);
    expect(afterCommit.length).toBeGreaterThan(0);
    expect(fakeGlimm.playSweep).not.toHaveBeenCalled();
    // Reveal mode never paints the curtain, so there is no blank hold.
    expect(curtainAtCommit).toBe("idle");
    expect(pageMounted("b")).toBe(true);
    expect(curtainState()).toBe("idle");
    api.destroy();
  });

  it("does not start the reveal until a running view transition finishes", async () => {
    const { canvas } = mountPages();
    let finishTransition!: () => void;
    const animation = {
      effect: { pseudoElement: "::view-transition-new(root)" },
      finished: new Promise<void>((resolve) => {
        finishTransition = resolve;
      }),
    };
    const original = document.getAnimations;
    Object.defineProperty(document, "getAnimations", {
      configurable: true,
      writable: true,
      value: () => [animation],
    });

    const navigate = vi.fn<() => Promise<void>>(async () => {
      renderPage("b");
      document.dispatchEvent(new Event("astro:after-swap"));
    });

    const api = setupGlimmAstro({ canvas, navigate });
    const handle = api.navigate("/b")!;
    let done = false;
    void handle.done.then(() => {
      done = true;
    });

    // The band has to reach the midpoint before the commit runs.
    await vi.waitFor(() => expect(pageMounted("b")).toBe(true));
    expect(done).toBe(false);

    finishTransition();
    await handle.done;
    expect(done).toBe(true);

    Object.defineProperty(document, "getAnimations", {
      configurable: true,
      writable: true,
      value: original,
    });
    api.destroy();
  });

  it("reuses the slot for a persisted canvas and rebuilds on a new navigate", () => {
    const { canvas } = mountPages();
    const navigate = async () => {};

    const first = setupGlimmAstro({ canvas, navigate });
    const second = setupGlimmAstro({ canvas, navigate });
    expect(second).toBe(first);

    const third = setupGlimmAstro({ canvas, navigate: async () => {} });
    expect(third).not.toBe(first);

    const fourth = setupGlimmAstro({ canvas, navigate, mode: "covered" });
    expect(fourth).not.toBe(first);
    fourth.destroy();
    third.destroy();
  });
});
