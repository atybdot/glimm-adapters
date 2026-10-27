import "@glimm-examples/shared/demo.css";
import { setupGlimmVanilla } from "glimm-adapters/vanilla";
import { SWEEP_MS } from "@glimm-examples/shared/demo-data";
import { flashCopy } from "@glimm-examples/shared/copy";
import { toAppPath } from "./base";
import { renderPage } from "./render";

const app = document.querySelector<HTMLDivElement>("#app");
const canvas = document.querySelector<HTMLCanvasElement>("#glimm");

if (!app || !canvas) {
  throw new Error("The vanilla demo is missing #app or #glimm");
}

const defaults = { sweepMs: SWEEP_MS.initial };
let sweepMs = defaults.sweepMs;

const paint = () => {
  app.innerHTML = renderPage(toAppPath(window.location.pathname), sweepMs);
};

paint();

const glimm = setupGlimmVanilla({
  canvas,
  mode: "reveal",
  defaults,
  navigate: async (href) => {
    if (href === window.location.pathname + window.location.search) return;
    window.history.pushState({}, "", href);
    paint();
  },
});

// The page is re-rendered on every navigation, so read the live slider value
// off the event and keep the defaults object in sync for the next sweep.
app.addEventListener("input", (event) => {
  const input = event.target;
  if (!(input instanceof HTMLInputElement) || input.type !== "range") return;

  sweepMs = Number(input.value);
  defaults.sweepMs = sweepMs;

  const output = input.closest(".duration")?.querySelector("output");
  if (output) output.textContent = `${sweepMs} ms`;
});

app.addEventListener("change", (event) => {
  const select = event.target;
  if (select instanceof HTMLSelectElement && select.matches("[data-framework]")) {
    window.location.assign(select.value);
  }
});

app.addEventListener("click", (event) => {
  const target = event.target;
  const button = target instanceof Element ? target.closest("[data-copy]") : null;
  if (!(button instanceof HTMLButtonElement)) return;
  const text = button.closest(".code")?.querySelector("code")?.textContent;
  if (text) void flashCopy(button, text);
});

window.addEventListener("popstate", paint);

// Vite keeps this module alive across HMR. Restore the canvas before the next
// setup so the playground does not leave two hosted canvases behind.
import.meta.hot?.dispose(() => glimm.destroy());
