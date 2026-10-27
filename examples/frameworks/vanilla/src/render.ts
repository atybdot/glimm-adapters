import {
  agentPrompt,
  demos,
  frameworks,
  frameworkHref,
  siteHref,
} from "@glimm-examples/shared/demo-data";
import { highlight } from "@glimm-examples/shared/highlight";
import { appHref } from "./base";

const demo = demos.vanilla;
const logo = appHref(`/${demo.logo}`);
const base = import.meta.env.BASE_URL;

/** The snippet is injected as HTML, so escape it before it reaches the page. */
const escape = (text: string) =>
  text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const copyIcon = `
  <svg class="copy__copy" viewBox="0 0 16 16" width="15" height="15" fill="none"
    stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <rect x="6" y="6" width="8" height="8" rx="1.5" />
    <path d="M10 6V3.5A1.5 1.5 0 0 0 8.5 2h-5A1.5 1.5 0 0 0 2 3.5v5A1.5 1.5 0 0 0 3.5 10H6" />
  </svg>
  <svg class="copy__check" viewBox="0 0 16 16" width="15" height="15" fill="none"
    stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="m3 8.5 3.2 3L13 4.5" />
  </svg>
`;

const chevron = `
  <svg class="picker-chevron" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.4"
    stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="m3 4.5 3 3 3-3" />
  </svg>
`;

const arrowLeft = `
  <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.4"
    stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M9 1.5 3.5 6 9 10.5" />
  </svg>
`;

const arrowRight = `
  <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.4"
    stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="m6 1.5 4.5 4.5L6 10.5M1.5 6h9" />
  </svg>
`;

const options = frameworks
  .map(
    (framework) => `
      <a class="picker-item" href="${frameworkHref(base, framework.id)}" data-glimm-skip${
        framework.id === demo.id ? ' aria-current="page"' : ""
      }>
        <img src="${appHref(`/${framework.logo}`)}" alt="" width="17" height="17" />
        ${framework.name}
      </a>`,
  )
  .join("");

const bar = `
  <header class="bar">
    <a class="wordmark" href="${siteHref(base)}" data-glimm-skip>glimm-adapters</a>
    <details class="picker" data-picker>
      <summary>
        <img class="picker-mark" src="${logo}" alt="" width="17" height="17" />
        <span>${demo.name}</span>
        ${chevron}
      </summary>
      <div class="picker-menu">${options}</div>
    </details>
  </header>
`;

const sheet = (id: "wiring" | "prompt", file: string, html: string, hidden: boolean) => `
  <div class="sheet${id === "prompt" ? " sheet--prose" : ""}" data-panel="${id}" ${hidden ? "hidden" : ""}>
    <p class="sheet-file">${file}</p>
    <pre><code>${html}</code></pre>
  </div>
`;

const panel = `
  <section class="panel" aria-label="Setup">
    <div class="panel-head">
      <div class="tabs" role="group" aria-label="Setup">
        <button class="tab" type="button" aria-pressed="true" data-tab="wiring">Wiring</button>
        <button class="tab" type="button" aria-pressed="false" data-tab="prompt">Agent prompt</button>
      </div>
      <button type="button" class="copy" data-copy aria-label="Copy">
        ${copyIcon}
      </button>
    </div>
    ${sheet("wiring", demo.file, highlight(demo.code, demo.lang), false)}
    ${sheet("prompt", "agent prompt", escape(agentPrompt(demo)), true)}
  </section>
`;

const home = `
  <div class="home">
    <section class="intro">
      <img class="mark" src="${logo}" alt="" width="38" height="38" />
      <h1>${demo.name}</h1>
      <p class="line">${demo.line}</p>
      <a class="next" href="${appHref("/about")}">
        <span>Second page</span>${arrowRight}
      </a>
    </section>
    ${panel}
  </div>
`;

const about = `
  <section class="second">
    <h1>Second page.</h1>
    <p>Same canvas, same listener. The band covered once and left.</p>
    <a class="next" href="${appHref("/")}">${arrowLeft}<span>Back to the demo</span></a>
  </section>
`;

export function renderPage(path: string): string {
  const isAbout = path === "/about";

  return `
    <div class="page" style="--accent: ${demo.accent}">
      <a class="skip" href="#main">Skip to content</a>
      ${bar}
      <main class="main" id="main">
        ${isAbout ? about : home}
      </main>
    </div>
  `;
}
