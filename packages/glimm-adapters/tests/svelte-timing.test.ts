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

import { setupGlimm } from "../src/svelte.js";
import { fakeGlimm } from "./support/fake-glimm.js";
import { curtainState, mountPages, pageMounted, renderPage, stubFrames } from "./support/timing.js";

describe("setupGlimm navigation timing", () => {
  let frames: ReturnType<typeof stubFrames>;

  beforeEach(() => {
    fakeGlimm.reset();
    frames = stubFrames();
  });

  afterEach(() => {
    frames.mockRestore();
  });

  it("runs one plain sweep and calls goto at its midpoint", async () => {
    const { canvas } = mountPages();
    let curtainAtCommit = "";
    let sweepsAtCommit = 0;
    const goto = vi.fn<() => Promise<void>>(async () => {
      curtainAtCommit = curtainState();
      sweepsAtCommit = fakeGlimm.playSweep.mock.calls.length;
      expect(pageMounted("b")).toBe(false);
      renderPage("b");
    });

    const api = setupGlimm({ canvas, goto });
    const handle = api.navigate("/b");
    expect(handle).not.toBeNull();

    await handle!.done;

    expect(goto).toHaveBeenCalledWith("/b");
    expect(sweepsAtCommit).toBe(1);
    expect(fakeGlimm.playSweep).toHaveBeenCalledTimes(1);
    expect(curtainAtCommit).toBe("idle");
    expect(pageMounted("b")).toBe(true);
    expect(curtainState()).toBe("idle");
    api.destroy();
  });

  it("does not call goto before the sweep starts", async () => {
    const { canvas } = mountPages();
    const goto = vi.fn<() => Promise<void>>(async () => {
      renderPage("b");
    });

    const api = setupGlimm({ canvas, goto });
    const handle = api.navigate("/b")!;

    await Promise.resolve();
    expect(goto).not.toHaveBeenCalled();
    expect(pageMounted("b")).toBe(false);

    await handle.done;
    expect(goto).toHaveBeenCalledTimes(1);
    api.destroy();
  });

  it("keeps covered mode available for slow routes", async () => {
    const { canvas } = mountPages();
    let curtainAtCommit = "";
    const goto = vi.fn<() => Promise<void>>(async () => {
      curtainAtCommit = curtainState();
      expect(pageMounted("b")).toBe(false);
      renderPage("b");
    });

    const api = setupGlimm({ canvas, goto, mode: "covered" });
    const handle = api.navigate("/b")!;

    await handle.done;

    expect(curtainAtCommit).toBe("hold");
    expect(fakeGlimm.playSweep).toHaveBeenCalledTimes(2);
    expect(pageMounted("b")).toBe(true);
    expect(curtainState()).toBe("idle");
    api.destroy();
  });

  it("reuses the instance on repeat setup and rebuilds when goto or mode changes", () => {
    const { canvas } = mountPages();
    const goto = async () => {};

    const first = setupGlimm({ canvas, goto });
    const second = setupGlimm({ canvas, goto });
    expect(second).toBe(first);

    const third = setupGlimm({ canvas, goto: async () => {} });
    expect(third).not.toBe(first);
    third.destroy();

    const fourth = setupGlimm({ canvas, goto, mode: "covered" });
    expect(fourth).not.toBe(first);
    fourth.destroy();
  });
});
