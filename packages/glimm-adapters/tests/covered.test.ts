import { describe, expect, it, vi } from "vitest";
import {
  ensureCurtainHost,
  playCoveredSweep,
  createCurtain,
  nextPaint,
  viewTransitionSettled,
} from "../src/covered.js";
import type { ShaderController } from "glimm";

function mockController(): ShaderController & { progress: number; alpha: number } {
  const state = { progress: 0, alpha: 0 };
  return {
    canvas: document.createElement("canvas"),
    ...state,
    get progress() {
      return state.progress;
    },
    set progress(v: number) {
      state.progress = v;
    },
    get alpha() {
      return state.alpha;
    },
    set alpha(v: number) {
      state.alpha = v;
    },
    setPalette: () => {},
    setBandTight: () => {},
    setDirection: () => {},
    setWaveAmount: () => {},
    setRippleAmount: () => {},
    setWaveSpeed: () => {},
    setBrightness: () => {},
    setSwellAmount: () => {},
    getProgress: () => state.progress,
    getAlpha: () => state.alpha,
    setProgress: (p: number) => {
      state.progress = p;
    },
    setAlpha: (a: number) => {
      state.alpha = a;
    },
    destroy: () => {},
  } as unknown as ShaderController & { progress: number; alpha: number };
}

describe("ensureCurtainHost", () => {
  it("reuses the same curtain when Astro re-hosts the persisted canvas", () => {
    document.body.innerHTML = `<main><canvas id="persisted"></canvas></main>`;
    const canvas = document.querySelector("canvas") as HTMLCanvasElement;
    const first = ensureCurtainHost(canvas);
    first.curtain.begin("ltr");
    first.curtain.hold();

    // Astro's swap moves the persisted canvas into the new body and detaches
    // the runtime host that held the curtain.
    const nextMain = document.createElement("main");
    nextMain.appendChild(canvas);
    document.body.replaceChildren(nextMain);
    expect(first.curtain.element.isConnected).toBe(false);

    const second = ensureCurtainHost(canvas);
    expect(second.curtain).toBe(first.curtain);
    expect(second.curtain.element.isConnected).toBe(true);
    expect(second.curtain.element.dataset.glimmCurtain).toBe("hold");
    expect(canvas.parentElement?.hasAttribute("data-glimm-host")).toBe(true);
    second.restore();
  });
});

describe("viewTransitionSettled", () => {
  function stubAnimations(animations: Array<{ pseudo: string; finished: Promise<void> }>) {
    const original = document.getAnimations;
    Object.defineProperty(document, "getAnimations", {
      configurable: true,
      writable: true,
      value: () =>
        animations.map((animation) => ({
          effect: { pseudoElement: animation.pseudo },
          finished: animation.finished,
        })),
    });
    return () => {
      Object.defineProperty(document, "getAnimations", {
        configurable: true,
        writable: true,
        value: original,
      });
    };
  }

  it("resolves at once when no view transition is running", async () => {
    const restore = stubAnimations([{ pseudo: "", finished: Promise.resolve() }]);
    await expect(viewTransitionSettled(50)).resolves.toBeUndefined();
    restore();
  });

  it("waits for an in-flight crossfade", async () => {
    let finish!: () => void;
    const restore = stubAnimations([
      {
        pseudo: "::view-transition-new(root)",
        finished: new Promise<void>((resolve) => {
          finish = resolve;
        }),
      },
    ]);

    let settled = false;
    const task = viewTransitionSettled(500).then(() => {
      settled = true;
    });
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(settled).toBe(false);

    finish();
    await task;
    expect(settled).toBe(true);
    restore();
  });

  it("releases after the timeout when the transition never finishes", async () => {
    const restore = stubAnimations([
      { pseudo: "::view-transition-old(root)", finished: new Promise<void>(() => {}) },
    ]);
    await expect(viewTransitionSettled(30)).resolves.toBeUndefined();
    restore();
  });
});

describe("playCoveredSweep", () => {
  it("covers, holds for commit+paint, then reveals over the new page", async () => {
    document.body.innerHTML = `<div id="host" style="position:relative"></div>`;
    const host = document.querySelector("#host") as HTMLElement;
    const curtain = createCurtain(host);
    const ctrl = mockController();
    const order: string[] = [];

    // rAF polyfill: jsdom has no visual frames — tick asynchronously so
    // playSweep's rAF loop advances without recursing the stack.
    const raf = vi
      .spyOn(window, "requestAnimationFrame")
      .mockImplementation((cb: FrameRequestCallback) => {
        order.push("raf");
        setTimeout(() => cb(performance.now()), 0);
        return 1;
      });

    const commit = vi.fn<() => Promise<void>>(async () => {
      order.push("commit");
      // The contract: the screen is opaque and the WebGL layer is hidden
      // while the route commits. Page B must not be revealed from under a
      // transparent sweep.
      expect(curtain.element.dataset.glimmCurtain).toBe("hold");
      expect(ctrl.getAlpha()).toBe(0);
    });

    const handle = playCoveredSweep(ctrl, curtain, commit, {
      sweepMs: 60,
      outroMs: 20,
      midpoint: 0.5,
    });
    // Cover phase must run before the commit.
    await handle.midpoint;
    expect(commit).toHaveBeenCalledTimes(1);
    expect(order[0]).toBe("raf"); // nextPaint ran around the commit
    expect(order).toContain("commit");

    await handle.done;
    // Reveal finished: curtain released, controller reset.
    expect(curtain.element.dataset.glimmCurtain).toBe("idle");
    expect(ctrl.getProgress()).toBe(0);
    raf.mockRestore();
    curtain.destroy();
  });

  it("goes idle once, at the end of the reveal, and resolves done there", async () => {
    document.body.innerHTML = `<div id="host-once" style="position:relative"></div>`;
    const host = document.querySelector("#host-once") as HTMLElement;
    const curtain = createCurtain(host);
    const ctrl = mockController();
    const raf = vi
      .spyOn(window, "requestAnimationFrame")
      .mockImplementation((cb: FrameRequestCallback) => {
        setTimeout(() => cb(performance.now()), 0);
        return 1;
      });
    const states: string[] = [];
    const observer = new MutationObserver(() => {
      const state = curtain.element.dataset.glimmCurtain;
      if (state && states[states.length - 1] !== state) states.push(state);
    });
    observer.observe(curtain.element, {
      attributes: true,
      attributeFilter: ["data-glimm-curtain"],
    });

    const handle = playCoveredSweep(ctrl, curtain, async () => {}, { sweepMs: 60 });
    await handle.done;
    // Without `outroMs: 0` on the reveal, the engine keeps ticking for its
    // default outro and writes "reveal" again after the curtain was hidden.
    await new Promise((resolve) => setTimeout(resolve, 40));
    observer.disconnect();

    expect(states).toEqual(["cover", "hold", "reveal", "idle"]);
    expect(curtain.element.dataset.glimmCurtain).toBe("idle");
    raf.mockRestore();
    curtain.destroy();
  });

  it("nextPaint resolves even when the signal is already aborted", async () => {
    const c = new AbortController();
    c.abort();
    await expect(nextPaint(c.signal)).resolves.toBeUndefined();
  });

  it("interrupt cancels but preserves the curtain for the next sweep", async () => {
    document.body.innerHTML = `<div id="host2" style="position:relative"></div>`;
    const host = document.querySelector("#host2") as HTMLElement;
    const curtain = createCurtain(host);
    const ctrl = mockController();
    const raf = vi
      .spyOn(window, "requestAnimationFrame")
      .mockImplementation((cb: FrameRequestCallback) => {
        setTimeout(() => cb(performance.now()), 0);
        return 1;
      });
    const commit = vi.fn<() => Promise<void>>(async () => {});
    const handle = playCoveredSweep(ctrl, curtain, commit, { sweepMs: 200 });
    handle.interrupt();
    await handle.done;
    // Preserved: curtain not hidden, promises still resolve.
    expect(curtain.element.dataset.glimmCurtain).not.toBe("idle");
    await expect(handle.midpoint).resolves.toBeUndefined();
    raf.mockRestore();
    curtain.destroy();
  });

  it("cancel hides the curtain and resets the controller", async () => {
    document.body.innerHTML = `<div id="host3" style="position:relative"></div>`;
    const host = document.querySelector("#host3") as HTMLElement;
    const curtain = createCurtain(host);
    const ctrl = mockController();
    const raf = vi
      .spyOn(window, "requestAnimationFrame")
      .mockImplementation((cb: FrameRequestCallback) => {
        setTimeout(() => cb(performance.now()), 0);
        return 1;
      });
    const handle = playCoveredSweep(ctrl, curtain, async () => {}, { sweepMs: 200 });
    handle.cancel();
    await handle.done;
    expect(curtain.element.dataset.glimmCurtain).toBe("idle");
    raf.mockRestore();
    curtain.destroy();
  });
});
