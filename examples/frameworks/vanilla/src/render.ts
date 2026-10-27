import {
  agentPrompt,
  demos,
  frameworks,
  frameworkHref,
  SWEEP_MS,
} from "@glimm-examples/shared/demo-data";
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
  <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.4"
    stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="m3 4.5 3 3 3-3" />
  </svg>
`;

const options = frameworks
  .map(
    (framework) =>
      `<option value="${frameworkHref(base, framework.id)}"${
        framework.id === demo.id ? " selected" : ""
      }>${framework.name}</option>`,
  )
  .join("");

const bar = `
  <header class="bar">
    <a class="wordmark" href="${appHref("/")}" aria-label="glimm-adapters home">glimm-adapters</a>
    <span class="slash" aria-hidden="true">/</span>
    <label class="picker">
      <span class="sr-only">Framework</span>
      <select name="framework" data-framework>
        ${options}
      </select>
      ${chevron}
    </label>
  </header>
`;

type Page = "sweep" | "wiring" | "prompt";

const switcher = (page: Page) => {
  const tabs = [
    { id: "sweep", label: "Sweep", href: appHref("/") },
    { id: "wiring", label: "Wiring", href: appHref("/about") },
    { id: "prompt", label: "Prompt", href: appHref("/prompt") },
  ] as const;

  return `
  <nav class="switcher" aria-label="Demo pages">
    ${tabs
      .map((tab) =>
        tab.id === page
          ? `<span class="switch" aria-current="page">${tab.label}</span>`
          : `<a class="switch" href="${tab.href}">${tab.label}</a>`,
      )
      .join("")}
  </nav>
`;
};

const code = (text: string, label: string, prose = false) => `
  <figure class="code${prose ? " code--prose" : ""}">
    <figcaption class="code-head">
      <span>${label}</span>
      <button type="button" class="copy" data-copy aria-label="Copy">
        ${copyIcon}
      </button>
    </figcaption>
    <pre><code>${escape(text)}</code></pre>
  </figure>
`;

const wiringCode = code(demo.code, demo.file);
const promptCode = code(agentPrompt(demo), "agent prompt", true);

const footer = (sweepMs: number) => `
  <footer class="foot">
    <label class="duration">
      <span>duration</span>
      <input
        type="range"
        min="${SWEEP_MS.min}"
        max="${SWEEP_MS.max}"
        step="${SWEEP_MS.step}"
        value="${sweepMs}"
      />
      <output>${sweepMs} ms</output>
    </label>
  </footer>
`;

export function renderPage(path: string, sweepMs: number): string {
  const page: Page = path === "/about" ? "wiring" : path === "/prompt" ? "prompt" : "sweep";

  return `
    <div class="page" style="--accent: ${demo.accent}">
      <a class="skip" href="#main">Skip to content</a>
      ${bar}
      <main class="stage" id="main">
        <div class="fw-card">
          <img src="${logo}" alt="" width="52" height="52" />
          <h1>${demo.name}</h1>
        </div>
        ${switcher(page)}
        ${
          page === "wiring"
            ? wiringCode
            : page === "prompt"
              ? promptCode
              : `<p class="line">${demo.line}</p>`
        }
      </main>
      ${footer(sweepMs)}
    </div>
  `;
}
