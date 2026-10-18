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

import { setupGlimmVue } from "../src/vue.js";
import { fakeGlimm } from "./support/fake-glimm.js";
import { curtainState, mountPages, pageMounted, renderPage, stubFrames } from "./support/timing.js";

describe("setupGlimmVue navigation timing", () => {
  let frames: ReturnType<typeof stubFrames>;

  beforeEach(() => {
    fakeGlimm.reset();
    frames = stubFrames();
  });

  afterEach(() => {
    frames.mockRestore();
  });

  it("runs one plain sweep and calls router.push at its midpoint", async () => {
    const { canvas } = mountPages();
    let curtainAtCommit = "";
    let sweepsAtCommit = 0;
    const push = vi.fn<() => Promise<void>>(async () => {
      curtainAtCommit = curtainState();
      sweepsAtCommit = fakeGlimm.playSweep.mock.calls.length;
      expect(pageMounted("b")).toBe(false);
      renderPage("b");
    });

    const api = setupGlimmVue({ canvas, router: { push } });
    const handle = api.push("/b");
    expect(handle).not.toBeNull();

    await handle!.done;

    expect(push).toHaveBeenCalledWith("/b");
    expect(sweepsAtCommit).toBe(1);
    expect(fakeGlimm.playSweep).toHaveBeenCalledTimes(1);
    expect(curtainAtCommit).toBe("idle");
    expect(pageMounted("b")).toBe(true);
    expect(curtainState()).toBe("idle");
    api.destroy();
  });

  it("does not call router.push before the sweep starts", async () => {
    const { canvas } = mountPages();
    const push = vi.fn<() => Promise<void>>(async () => {
      renderPage("b");
    });

    const api = setupGlimmVue({ canvas, router: { push } });
    const handle = api.push("/b")!;

    await Promise.resolve();
    expect(push).not.toHaveBeenCalled();
    expect(pageMounted("b")).toBe(false);

    await handle.done;
    expect(push).toHaveBeenCalledTimes(1);
    api.destroy();
  });

  it("keeps covered mode available for slow routes", async () => {
    const { canvas } = mountPages();
    let curtainAtCommit = "";
    const push = vi.fn<() => Promise<void>>(async () => {
      curtainAtCommit = curtainState();
      expect(pageMounted("b")).toBe(false);
      renderPage("b");
    });

    const api = setupGlimmVue({ canvas, router: { push }, mode: "covered" });
    const handle = api.push("/b")!;

    await handle.done;

    expect(curtainAtCommit).toBe("hold");
    expect(fakeGlimm.playSweep).toHaveBeenCalledTimes(2);
    expect(pageMounted("b")).toBe(true);
    expect(curtainState()).toBe("idle");
    api.destroy();
  });

  it("reuses the instance on repeat setup and rebuilds when the router or mode changes", () => {
    const { canvas } = mountPages();
    const router = { push: async () => {} };

    const first = setupGlimmVue({ canvas, router });
    const second = setupGlimmVue({ canvas, router });
    expect(second).toBe(first);

    const third = setupGlimmVue({ canvas, router: { push: async () => {} } });
    expect(third).not.toBe(first);
    third.destroy();

    const fourth = setupGlimmVue({ canvas, router, mode: "covered" });
    expect(fourth).not.toBe(first);
    fourth.destroy();
  });
});
