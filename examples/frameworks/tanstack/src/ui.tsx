import type { ReactNode } from "react";
import { useLocation } from "@tanstack/react-router";
import { appHref } from "./base";

export function Shell({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const page = pathname === "/about" ? "about" : "home";

  return (
    <div className="page" data-page={page}>
      <header className="topbar">
        <a className="brand" href={appHref("/")}>
          <span className="mark" /> glimm <span>/ TanStack</span>
        </a>
        <nav>
          <a href={appHref("/")} aria-current={page === "home" ? "page" : undefined}>
            Home
          </a>
          <a href={appHref("/about")} aria-current={page === "about" ? "page" : undefined}>
            About
          </a>
        </nav>
      </header>
      <main>
        <section className="hero">{children}</section>
      </main>
      <footer className="footer">
        <span>glimm-adapters / tanstack</span>
        <span>GlimmProvider · InterceptLinks</span>
      </footer>
    </div>
  );
}

export function HomePage() {
  return (
    <>
      <p className="eyebrow">Framework demo · TanStack Router</p>
      <h1>
        Sweep in.
        <br />
        <em>Land on the next view.</em>
      </h1>
      <p className="lede">
        This is page A. Click the link and watch the band cross while the router swaps the view. The
        canvas stays put; only the page changes.
      </p>
      <div className="actions">
        <a className="button" href={appHref("/about")}>
          Open the About page <span aria-hidden="true">→</span>
        </a>
      </div>
      <div className="card">
        <div>
          <p className="eyebrow">Current page</p>
          <p className="card-title">Page A · Home</p>
          <p className="card-note">
            <code>router.navigate</code> resolves after the route renders.
          </p>
        </div>
        <div className="big">A</div>
      </div>
    </>
  );
}

export function AboutPage() {
  return (
    <>
      <p className="eyebrow">Second page · TanStack Router</p>
      <h1>
        New page.
        <br />
        <em>Same canvas.</em>
      </h1>
      <p className="lede">
        This is page B. The sweep committed the route at its midpoint. The canvas survived the swap,
        so a second navigation starts from a clean state.
      </p>
      <div className="actions">
        <a className="button" href={appHref("/")}>
          Back to the Home page <span aria-hidden="true">→</span>
        </a>
      </div>
      <div className="card">
        <div>
          <p className="eyebrow">Current page</p>
          <p className="card-title">Page B · About</p>
          <p className="card-note">
            Navigate back and forth; the transition should feel identical.
          </p>
        </div>
        <div className="big">B</div>
      </div>
    </>
  );
}
