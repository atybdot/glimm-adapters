import "@glimm-examples/shared/demo.css";
import { accentChain } from "glimm-adapters";
import { setupGlimmVanilla } from "glimm-adapters/vanilla";
import { demos, SWEEP_MS } from "@glimm-examples/shared/demo-data";
import { flashCopy } from "@glimm-examples/shared/copy";
import { initPicker } from "@glimm-examples/shared/picker";
import { toAppPath } from "./base";
import { renderPage } from "./render";

const app = document.querySelector<HTMLDivElement>("#app");
const canvas = document.querySelector<HTMLCanvasElement>("#glimm");

if (!app || !canvas) {
  throw new Error("The vanilla demo is missing #app or #glimm");
}

const defaults = {
  sweepMs: SWEEP_MS,
  palette: accentChain(demos.vanilla.palette),
};

const paint = () => {
  app.innerHTML = renderPage(toAppPath(window.location.pathname));
};

paint();
initPicker();

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

app.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof Element)) return;

  const tab = target.closest("[data-tab]");
  if (tab instanceof HTMLButtonElement) {
    const panel = tab.closest(".panel");
    if (!panel) return;
    const id = tab.dataset.tab;
    for (const button of panel.querySelectorAll("[data-tab]")) {
      button.setAttribute("aria-pressed", String(button === tab));
    }
    for (const sheet of panel.querySelectorAll<HTMLElement>("[data-panel]")) {
      sheet.hidden = sheet.dataset.panel !== id;
    }
    return;
  }

  const button = target.closest("[data-copy]");
  if (!(button instanceof HTMLButtonElement)) return;
  const text = button
    .closest(".panel")
    ?.querySelector("[data-panel]:not([hidden]) code")?.textContent;
  if (text) void flashCopy(button, text);
});

window.addEventListener("popstate", paint);

// Vite keeps this module alive across HMR. Restore the canvas before the next
// setup so the playground does not leave two hosted canvases behind.
import.meta.hot?.dispose(() => glimm.destroy());
