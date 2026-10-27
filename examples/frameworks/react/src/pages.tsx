import { type CSSProperties, type ReactNode, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  agentPrompt,
  demos,
  frameworks,
  frameworkHref,
  SWEEP_MS,
} from "@glimm-examples/shared/demo-data";
import { flashCopy } from "@glimm-examples/shared/copy";

const demo = demos.react;
const accent = { "--accent": demo.accent } as CSSProperties;

function CopyButton({ text }: { text: string }) {
  const ref = useRef<HTMLButtonElement>(null);

  return (
    <button
      ref={ref}
      type="button"
      className="copy"
      aria-label="Copy the snippet"
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

function Chevron() {
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
      <path d="m3 4.5 3 3 3-3" />
    </svg>
  );
}

function Footer({ sweepMs, onSweepMs }: { sweepMs: number; onSweepMs: (ms: number) => void }) {
  return (
    <footer className="foot">
      <label className="duration">
        <span>duration</span>
        <input
          type="range"
          min={SWEEP_MS.min}
          max={SWEEP_MS.max}
          step={SWEEP_MS.step}
          value={sweepMs}
          onChange={(e) => onSweepMs(Number(e.target.value))}
        />
        <output>{sweepMs} ms</output>
      </label>
    </footer>
  );
}

export function Shell({
  sweepMs,
  onSweepMs,
  children,
}: {
  sweepMs: number;
  onSweepMs: (ms: number) => void;
  children: ReactNode;
}) {
  const { pathname } = useLocation();
  const route = pathname.replace(/\/+$/, "") || "/";
  const page = route === "/about" ? "wiring" : route === "/prompt" ? "prompt" : "sweep";
  const tabs = [
    { id: "sweep", label: "Sweep", to: "/" },
    { id: "wiring", label: "Wiring", to: "/about" },
    { id: "prompt", label: "Prompt", to: "/prompt" },
  ] as const;

  return (
    <div className="page" style={accent}>
      <a className="skip" href="#main">
        Skip to content
      </a>

      <header className="bar">
        <Link className="wordmark" to="/" aria-label="glimm-adapters home">
          glimm-adapters
        </Link>
        <span className="slash" aria-hidden="true">
          /
        </span>
        <label className="picker">
          <span className="sr-only">Framework</span>
          <select
            name="framework"
            defaultValue={demo.id}
            onChange={(e) =>
              window.location.assign(frameworkHref(import.meta.env.BASE_URL, e.target.value))
            }
          >
            {frameworks.map((framework) => (
              <option key={framework.id} value={framework.id}>
                {framework.name}
              </option>
            ))}
          </select>
          <Chevron />
        </label>
      </header>

      <main className="stage" id="main">
        <div className="fw-card">
          <img src={`${import.meta.env.BASE_URL}${demo.logo}`} alt="" width="52" height="52" />
          <h1>{demo.name}</h1>
        </div>

        <nav className="switcher" aria-label="Demo pages">
          {tabs.map((tab) =>
            tab.id === page ? (
              <span key={tab.id} className="switch" aria-current="page">
                {tab.label}
              </span>
            ) : (
              <Link key={tab.id} className="switch" to={tab.to}>
                {tab.label}
              </Link>
            ),
          )}
        </nav>

        {children}
      </main>

      <Footer sweepMs={sweepMs} onSweepMs={onSweepMs} />
    </div>
  );
}

export function HomePage() {
  return <p className="line">{demo.line}</p>;
}

export function PromptPage() {
  return (
    <figure className="code code--prose">
      <figcaption className="code-head">
        <span>agent prompt</span>
        <CopyButton text={agentPrompt(demo)} />
      </figcaption>
      <pre>
        <code>{agentPrompt(demo)}</code>
      </pre>
    </figure>
  );
}

export function AboutPage() {
  return (
    <figure className="code">
      <figcaption className="code-head">
        <span>{demo.file}</span>
        <CopyButton text={demo.code} />
      </figcaption>
      <pre>
        <code>{demo.code}</code>
      </pre>
    </figure>
  );
}
