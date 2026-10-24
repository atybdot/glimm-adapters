import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";

const mocks = vi.hoisted(() => {
  const sweep = vi.fn<(navigate: () => void | Promise<void>) => unknown>();
  return { sweep };
});

vi.mock("glimm/react", () => ({
  GlimmProvider: ({ children }: { children: ReactNode }) => children,
  useGlimm: () => ({ sweep: mocks.sweep, defaults: {} }),
  PALETTES: {},
  EASINGS: {},
}));

import { act } from "react";
import { createRoot } from "react-dom/client";
import type { Root } from "react-dom/client";
import { useInterceptLinks } from "../src/react.js";
import { mountPages, pageMounted, renderPage } from "./support/timing.js";

function App({ goto }: { goto: (href: string) => Promise<void> }) {
  useInterceptLinks(goto);
  return <a href="/b">Page B</a>;
}

describe("useInterceptLinks", () => {
  let root: Root | null = null;
  let container: HTMLDivElement;

  beforeEach(() => {
    (globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT =
      true;
    mocks.sweep.mockReset();
    mountPages();
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(async () => {
      root?.unmount();
    });
    root = null;
    container.remove();
  });

  it("hands glimm a promise that resolves after the router rendered page B", async () => {
    let navigateResult: unknown;
    const goto = vi.fn<() => Promise<void>>(async () => {
      renderPage("b");
    });

    mocks.sweep.mockImplementation((navigate: () => void | Promise<void>) => {
      navigateResult = navigate();
      return {
        midpoint: Promise.resolve(),
        done: Promise.resolve(),
        cancel: () => {},
      };
    });

    await act(async () => {
      root!.render(<App goto={goto} />);
    });

    const anchor = container.querySelector("a")!;
    await act(async () => {
      anchor.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, button: 0 }));
    });

    expect(mocks.sweep).toHaveBeenCalledTimes(1);
    expect(navigateResult).toBeInstanceOf(Promise);
    await expect(navigateResult as Promise<void>).resolves.toBeUndefined();
    expect(goto).toHaveBeenCalledWith("/b");
    expect(pageMounted("b")).toBe(true);
  });

  it("does not navigate before glimm calls the midpoint", async () => {
    let navigateAtMidpoint: (() => void | Promise<void>) | undefined;
    const goto = vi.fn<() => Promise<void>>(async () => {});

    mocks.sweep.mockImplementation((navigate: () => void | Promise<void>) => {
      navigateAtMidpoint = navigate;
      return {
        midpoint: Promise.resolve(),
        done: Promise.resolve(),
        cancel: () => {},
      };
    });

    await act(async () => {
      root!.render(<App goto={goto} />);
    });
    const anchor = container.querySelector("a")!;
    await act(async () => {
      anchor.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, button: 0 }));
    });

    expect(navigateAtMidpoint).toBeTypeOf("function");
    expect(goto).not.toHaveBeenCalled();

    await act(async () => {
      await navigateAtMidpoint?.();
    });
    expect(goto).toHaveBeenCalledWith("/b");
  });

  it("removes the delegated listener on unmount", async () => {
    const goto = vi.fn<() => Promise<void>>(async () => {});
    mocks.sweep.mockImplementation(() => ({
      midpoint: Promise.resolve(),
      done: Promise.resolve(),
      cancel: () => {},
    }));

    await act(async () => {
      root!.render(<App goto={goto} />);
    });
    const anchor = container.querySelector("a")!;

    await act(async () => {
      root!.unmount();
    });
    root = null;

    // The adapter's listener is gone, so stop the browser from actually
    // navigating in jsdom when the anchor is clicked.
    anchor.addEventListener("click", (event) => event.preventDefault());
    anchor.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, button: 0 }));
    expect(mocks.sweep).not.toHaveBeenCalled();
  });
});
