import { describe, expect, it, vi } from "vitest";
import { setupGlimmVue } from "../src/vue.js";

describe("setupGlimmVue", () => {
  it("falls back to router.push without WebGL and cleans up its listener", () => {
    document.body.innerHTML = `<canvas id="glimm"></canvas><a href="/next">Next</a>`;
    const canvas = document.querySelector("canvas") as HTMLCanvasElement;
    const push = vi.fn<(href: string) => void>();
    const api = setupGlimmVue({ canvas, router: { push } });

    expect(api.controller).toBeNull();
    expect(api.push("/next")).toBeNull();
    expect(push).toHaveBeenCalledWith("/next");

    api.destroy();
    push.mockClear();
    document
      .querySelector("a")!
      .dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, button: 0 }));
    expect(push).not.toHaveBeenCalled();
  });

  it("uses replace when the router provides it", () => {
    document.body.innerHTML = `<canvas id="glimm"></canvas>`;
    const canvas = document.querySelector("canvas") as HTMLCanvasElement;
    const push = vi.fn<(href: string) => void>();
    const replace = vi.fn<(href: string) => void>();
    const api = setupGlimmVue({ canvas, router: { push, replace } });

    expect(api.replace("/next")).toBeNull();
    expect(replace).toHaveBeenCalledWith("/next");
    expect(push).not.toHaveBeenCalled();
    api.destroy();
  });
});
