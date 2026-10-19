"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import { initSound } from "../lib/sound";
import { playPageSweep } from "../lib/page-sweep";

type Props = {
  /** Sweep the whole page once on arrival. Used by the 404 and 500 pages. */
  sweepOnLoad?: boolean;
};

/**
 * Page-level behaviour that is not tied to one widget: the audio preference and
 * the smooth scroll.
 *
 * In-app navigations are handled by `setupGlimmAstro` in the base layout, which
 * owns the sweep timing. This component must not sweep on arrival:
 * by the time an island hydrates the new page has already painted, so a timer
 * here would play the transition after the fact instead of leading it.
 *
 * Lenis takes over the wheel and eases it, and `anchors` makes the dock's
 * `#section` links travel there instead of jumping. It respects
 * `prefers-reduced-motion` itself, falling back to native scroll.
 */
export default function PageRuntime({ sweepOnLoad = false }: Props) {
  useEffect(() => {
    initSound();

    const calm = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const sweep = () => {
      if (calm()) return;
      playPageSweep({ easing: "easeOutExpo", sweepMs: 900, outroMs: 260 });
    };

    // Status pages are reached by a full document load, so there is no
    // client-side navigation to ride. A plain arrival sweep is all they can have.
    const enter = sweepOnLoad && !calm() ? window.setTimeout(sweep, 180) : undefined;

    // bfcache restores the document without re-running effects. There is no
    // paint to cover, so only the status pages replay their arrival sweep.
    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted && sweepOnLoad) sweep();
    };
    window.addEventListener("pageshow", onPageShow);

    const lenis = new Lenis({
      autoRaf: true,
      anchors: { offset: -8 },
      duration: 1.05,
      smoothWheel: true,
    });
    return () => {
      if (enter) window.clearTimeout(enter);
      window.removeEventListener("pageshow", onPageShow);
      lenis.destroy();
    };
  }, [sweepOnLoad]);

  return null;
}
