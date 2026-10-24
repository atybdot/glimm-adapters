import "@glimm-examples/shared/demo.css";
import { setupGlimmVanilla } from "glimm-adapters/vanilla";
import { renderPage } from "./render";

const app = document.querySelector<HTMLDivElement>("#app");
const canvas = document.querySelector<HTMLCanvasElement>("#glimm");

if (!app || !canvas) {
  throw new Error("The vanilla demo is missing #app or #glimm");
}

const paint = () => {
  app.innerHTML = renderPage(window.location.pathname);
};

paint();

const glimm = setupGlimmVanilla({
  canvas,
  mode: "reveal",
  navigate: async (href) => {
    if (href === window.location.pathname + window.location.search) return;
    window.history.pushState({}, "", href);
    paint();
  },
});

window.addEventListener("popstate", paint);

// Vite keeps this module alive across HMR. Restore the canvas before the next
// setup so the playground does not leave two hosted canvases behind.
import.meta.hot?.dispose(() => glimm.destroy());
