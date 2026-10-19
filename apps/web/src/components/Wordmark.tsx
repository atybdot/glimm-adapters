"use client";

import { useEffect, useRef } from "react";

type Props = {
  /** Three-stop colour chains. The band picks one at random on each hover. */
  sweeps: string[][];
  href?: string;
  label?: string;
};

/**
 * The wordmark, with its glimm band clipped to the type.
 *
 * The shine is a narrow, low-contrast streak (the stops are mixed toward the
 * ink in CSS), so it reads as a sheen rather than a colour wipe. Mouse-enter
 * only, one shot, and never the same preset twice running. A short beat before
 * the sweep means a cursor crossing the word on its way somewhere else does not
 * set it off.
 */
export default function Wordmark({ sweeps, href = "/", label = "glimm-adapters" }: Props) {
  const ref = useRef<HTMLAnchorElement>(null);
  const last = useRef(-1);

  useEffect(() => {
    const el = ref.current;
    if (!el || sweeps.length === 0) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    if (reduce || !finePointer) return;
    const word = el.classList.contains("app-word")
      ? el
      : el.querySelector<HTMLElement>(".app-word");
    if (!word) return;

    let timer = 0;

    const sweep = () => {
      let pick = Math.floor(Math.random() * sweeps.length);
      if (sweeps.length > 1 && pick === last.current) pick = (pick + 1) % sweeps.length;
      last.current = pick;
      const [a, b, c] = sweeps[pick] ?? [];
      if (a) word.style.setProperty("--glimpse-a", a);
      if (b) word.style.setProperty("--glimpse-b", b);
      if (c) word.style.setProperty("--glimpse-c", c);
      word.animate([{ backgroundPosition: "100% 50%" }, { backgroundPosition: "0% 50%" }], {
        duration: 1900,
        easing: "cubic-bezier(0.32, 0.72, 0, 1)",
      });
    };

    const onEnter = () => {
      timer = window.setTimeout(sweep, 160);
    };
    const onLeave = () => window.clearTimeout(timer);

    el.addEventListener("pointerenter", onEnter);
    el.addEventListener("pointerleave", onLeave);
    return () => {
      window.clearTimeout(timer);
      el.removeEventListener("pointerenter", onEnter);
      el.removeEventListener("pointerleave", onLeave);
    };
  }, [sweeps]);

  return (
    <a
      ref={ref}
      className="app-word inline-flex items-center text-ink no-underline"
      href={href}
      aria-label={`${label}, home`}
    >
      {label}
    </a>
  );
}
