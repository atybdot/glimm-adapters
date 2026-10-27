import { type CSSProperties, type ReactNode, useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  agentPrompt,
  demos,
  frameworks,
  frameworkHref,
  siteHref,
} from "@glimm-examples/shared/demo-data";
import { flashCopy } from "@glimm-examples/shared/copy";
import { highlight } from "@glimm-examples/shared/highlight";
import { initPicker } from "@glimm-examples/shared/picker";

const demo = demos.tanstack;
const accent = { "--accent": demo.accent } as CSSProperties;
const base = import.meta.env.BASE_URL;

function Arrow({ back = false }: { back?: boolean }) {
  return (
    <svg
      viewBox="0 0 12 12"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {back ? <path d="M9 1.5 3.5 6 9 10.5" /> : <path d="m6 1.5 4.5 4.5L6 10.5M1.5 6h9" />}
    </svg>
  );
}

function Chevron() {
  return (
    <svg
      className="picker-chevron"
      viewBox="0 0 12 12"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m3 4.5 3 3 3-3" />
    </svg>
  );
}

function Picker() {
  return (
    <details className="picker" data-picker>
      <summary>
        <img className="picker-mark" src={`${base}${demo.logo}`} alt="" width="17" height="17" />
        <span>{demo.name}</span>
        <Chevron />
      </summary>
      <div className="picker-menu">
        {frameworks.map((framework) => (
          <a
            key={framework.id}
            className="picker-item"
            href={frameworkHref(base, framework.id)}
            data-glimm-skip
            aria-current={framework.id === demo.id ? "page" : undefined}
          >
            <img src={`${base}${framework.logo}`} alt="" width="17" height="17" />
            {framework.name}
          </a>
        ))}
      </div>
    </details>
  );
}

function CopyButton({ text }: { text: string }) {
  const ref = useRef<HTMLButtonElement>(null);

  return (
    <button
      ref={ref}
      type="button"
      className="copy"
      aria-label="Copy"
      onClick={() => {
        if (ref.current) void flashCopy(ref.current, text);
      }}
    >
      <svg
        className="copy__copy"
        viewBox="0 0 16 16"
        width="15"
        height="15"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <rect x="6" y="6" width="8" height="8" rx="1.5" />
        <path d="M10 6V3.5A1.5 1.5 0 0 0 8.5 2h-5A1.5 1.5 0 0 0 2 3.5v5A1.5 1.5 0 0 0 3.5 10H6" />
      </svg>
      <svg
        className="copy__check"
        viewBox="0 0 16 16"
        width="15"
        height="15"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="m3 8.5 3.2 3L13 4.5" />
      </svg>
    </button>
  );
}

export function Shell({ children }: { children: ReactNode }) {
  useEffect(() => initPicker(), []);

  return (
    <div className="page" style={accent}>
      <a className="skip" href="#main">
        Skip to content
      </a>

      <header className="bar">
        <a className="wordmark" href={siteHref(base)} data-glimm-skip>
          glimm-adapters
        </a>
        <Picker />
      </header>

      <main className="main" id="main">
        {children}
      </main>
    </div>
  );
}

export function HomePage() {
  const [tab, setTab] = useState<"wiring" | "prompt">("wiring");
  const prose = tab === "prompt";
  const wiring = highlight(demo.code, demo.lang);

  return (
    <div className="home">
      <section className="intro">
        <img className="mark" src={`${base}${demo.logo}`} alt="" width="38" height="38" />
        <h1>{demo.name}</h1>
        <p className="line">{demo.line}</p>
        <Link className="next" to="/about">
          <span>Second page</span>
          <Arrow />
        </Link>
      </section>

      <section className="panel" aria-label="Setup">
        <div className="panel-head">
          <div className="tabs" role="group" aria-label="Setup">
            <button
              type="button"
              className="tab"
              data-tab="wiring"
              aria-pressed={tab === "wiring"}
              onClick={() => setTab("wiring")}
            >
              Wiring
            </button>
            <button
              type="button"
              className="tab"
              data-tab="prompt"
              aria-pressed={prose}
              onClick={() => setTab("prompt")}
            >
              Agent prompt
            </button>
          </div>
          <CopyButton text={prose ? agentPrompt(demo) : demo.code} />
        </div>

        <div className={`sheet${prose ? " sheet--prose" : ""}`}>
          <p className="sheet-file">{prose ? "agent prompt" : demo.file}</p>
          <pre>
            {prose ? (
              <code>{agentPrompt(demo)}</code>
            ) : (
              <code dangerouslySetInnerHTML={{ __html: wiring }} />
            )}
          </pre>
        </div>
      </section>
    </div>
  );
}

export function AboutPage() {
  return (
    <section className="second">
      <h1>Second page.</h1>
      <p>Same canvas, same listener. The band covered once and left.</p>
      <Link className="next" to="/">
        <Arrow back />
        <span>Back to the demo</span>
      </Link>
    </section>
  );
}
