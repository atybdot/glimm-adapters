import { describe, expect, it, vi } from "vitest";
import { setupGlimm } from "../src/svelte.js";

describe("setupGlimm", () => {
  it("falls back to goto without WebGL and cleans up its listener", () => {
    document.body.innerHTML = `<canvas id="glimm"></canvas><a href="/next">Next</a>`;
    const canvas = document.querySelector("canvas") as HTMLCanvasElement;
    const goto = vi.fn<(href: string) => void>();
    const api = setupGlimm({ canvas, goto });

    expect(api.controller).toBeNull();
    expect(api.navigate("/next")).toBeNull();
    expect(goto).toHaveBeenCalledWith("/next");

    api.destroy();
    goto.mockClear();
    document
      .querySelector("a")!
      .dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, button: 0 }));
    expect(goto).not.toHaveBeenCalled();
  });

  it("reuses the live instance and rebuilds after teardown", () => {
    document.body.innerHTML = `<canvas id="glimm"></canvas>`;
    const canvas = document.querySelector("canvas") as HTMLCanvasElement;
    const goto = () => {};
    const first = setupGlimm({ canvas, goto });
    const second = setupGlimm({ canvas, goto });
    // Same canvas, same setup: the second call is a no-op, not a second
    // shader and a second document click listener.
    expect(second).toBe(first);
    first.destroy();

    const third = setupGlimm({ canvas, goto });
    expect(third).not.toBe(first);
    third.destroy();
  });
});
