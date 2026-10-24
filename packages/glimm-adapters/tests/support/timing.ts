import { vi } from "vitest";
import type { ShaderController } from "glimm";

/** Minimal controller shaped for the covered sweep. */
export function createMockController(): ShaderController {
  let progress = 0;
  let alpha = 0;
  return {
    setPalette: () => {},
    setBandTight: () => {},
    setDirection: () => {},
    setWaveAmount: () => {},
    setRippleAmount: () => {},
    setWaveSpeed: () => {},
    setBrightness: () => {},
    setSwellAmount: () => {},
    getProgress: () => progress,
    getAlpha: () => alpha,
    setProgress: (value: number) => {
      progress = value;
    },
    setAlpha: (value: number) => {
      alpha = value;
    },
    destroy: () => {},
  } as unknown as ShaderController;
}

/** jsdom has no visual frames, so tick them through the timer queue. */
export function stubFrames() {
  return vi.spyOn(window, "requestAnimationFrame").mockImplementation((callback) => {
    return window.setTimeout(() => callback(performance.now()), 0) as unknown as number;
  });
}

/** The curtain phase currently painted over the page. */
export function curtainState(): string {
  const curtain = document.querySelector<HTMLElement>("[data-glimm-curtain]");
  return curtain?.dataset.glimmCurtain ?? "none";
}

/**
 * A page root and a canvas root. Routers replace the app content, not the
 * whole body, so the canvas host survives a simulated navigation.
 */
export function mountPages(): { app: HTMLElement; canvas: HTMLCanvasElement } {
  document.body.innerHTML = `
    <div id="app"><main id="page-a">Page A</main></div>
    <div id="canvas-root"><canvas id="glimm"></canvas></div>
  `;
  return {
    app: document.getElementById("app") as HTMLElement,
    canvas: document.getElementById("glimm") as HTMLCanvasElement,
  };
}

/** Replaces page A with page B, the way a router commit does. */
export function renderPage(name: string): void {
  const app = document.getElementById("app");
  if (app) app.innerHTML = `<main id="page-${name}">Page ${name}</main>`;
}

export function pageMounted(name: string): boolean {
  return document.getElementById(`page-${name}`) !== null;
}
