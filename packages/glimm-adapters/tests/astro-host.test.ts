import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("glimm", async (importOriginal) => {
  const actual = await importOriginal<typeof import("glimm")>();
  return {
    ...actual,
    createShader: () => ({
      setAlpha: () => {},
      setProgress: () => {},
      getProgress: () => 0,
      destroy: () => {},
    }),
  };
});

import { setupGlimmAstro } from "../src/astro.js";

describe("setupGlimmAstro host lifecycle", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("tears down the previous canvas when setup runs on a new one", () => {
    document.body.innerHTML = `<main><canvas id="a"></canvas><canvas id="b"></canvas></main>`;
    const a = document.getElementById("a") as HTMLCanvasElement;
    const b = document.getElementById("b") as HTMLCanvasElement;

    const first = setupGlimmAstro({ canvas: a });
    expect(a.parentElement?.hasAttribute("data-glimm-host")).toBe(true);

    const second = setupGlimmAstro({ canvas: b });
    expect(second).not.toBe(first);
    expect(a.parentElement?.hasAttribute("data-glimm-host")).toBe(false);
    expect(b.parentElement?.hasAttribute("data-glimm-host")).toBe(true);

    second.destroy();
  });

  it("removes its after-swap listener on destroy", () => {
    document.body.innerHTML = `<canvas id="a"></canvas>`;
    const canvas = document.getElementById("a") as HTMLCanvasElement;
    const remove = vi.spyOn(document, "removeEventListener");
    const api = setupGlimmAstro({ canvas });
    api.destroy();
    expect(remove).toHaveBeenCalledWith("astro:after-swap", expect.any(Function));
    remove.mockRestore();
  });
});
