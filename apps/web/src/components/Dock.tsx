"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { cue } from "../lib/sound";

type DockItem = { id: string; label: string };

type Props = {
  items: DockItem[];
};

const RADIUS = 9;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/**
 * The floating progress dock.
 *
 * The label morphs between section names, the ring tracks scroll, and the menu
 * is anchored to the button's centre so it grows out of the control whichever
 * section you are in. No chevron: the morph and the ring already say where you
 * are.
 */
export default function Dock({ items }: Props) {
  const [activeId, setActiveId] = useState(items[0]?.id ?? "");
  const [open, setOpen] = useState(false);
  const [labelWidth, setLabelWidth] = useState<number>();
  const wrapRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<SVGCircleElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);

  const activeItem = items.find((item) => item.id === activeId) ?? items[0];
  const label = activeItem?.label ?? "";

  // Track the active section and the read position.
  useEffect(() => {
    const sections = items
      .map((item) => document.getElementById(item.id))
      .filter((el): el is HTMLElement => el !== null)
      // The menu groups by topic; the page orders its sections, so trust the DOM.
      .sort((a, b) => (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1));
    if (sections.length === 0) return;

    const update = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const ratio = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      if (barRef.current)
        barRef.current.style.strokeDashoffset = String(CIRCUMFERENCE * (1 - ratio));

      // The section whose top has passed the reading line is the one you are in.
      const line = window.innerHeight * 0.4;
      let next = sections[0]!.id;
      for (const section of sections) {
        if (section.getBoundingClientRect().top <= line) next = section.id;
        else break;
      }
      // A short last section may never reach the line, so the foot of the page
      // belongs to it. Without this, the dock says FAQ while you read the end.
      if (max > 0 && window.scrollY >= max - 2) next = sections[sections.length - 1]!.id;
      setActiveId((prev) => (prev === next ? prev : next));
    };

    update();

    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        update();
        ticking = false;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [items]);

  // The button width tweens to the incoming word.
  useLayoutEffect(() => {
    if (labelRef.current) setLabelWidth(labelRef.current.getBoundingClientRect().width);
  }, [label]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!wrapRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const toggle = () => {
    setOpen((prev) => {
      if (!prev) cue("open", { emphasis: "subtle" });
      return !prev;
    });
  };

  return (
    <div ref={wrapRef} className="fixed bottom-5 left-1/2 z-40 -translate-x-1/2">
      <div
        id="app-dock-menu"
        role="menu"
        aria-label="Sections"
        className={`absolute bottom-[calc(100%+10px)] left-1/2 min-w-[210px] origin-bottom -translate-x-1/2 rounded-card border border-line bg-surface p-1.5 shadow-[0_18px_44px_-24px_rgba(0,0,0,0.45)] transition-[opacity,transform] duration-200 ease-snap ${
          open
            ? "pointer-events-auto translate-y-0 opacity-100"
            : "pointer-events-none translate-y-1 opacity-0"
        }`}
      >
        {items.map((item) => {
          const current = item.id === activeId;
          return (
            <a
              key={item.id}
              href={`#${item.id}`}
              role="menuitem"
              aria-current={current ? "true" : undefined}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-2 rounded-sm px-2.5 py-1.5 text-[13px] no-underline transition-colors duration-150 ease-snap hover:bg-recess hover:text-ink ${
                current ? "font-medium text-ink" : "text-body"
              }`}
            >
              <span
                className={`size-1.5 flex-none rounded-full transition-colors duration-150 ease-snap ${
                  current ? "bg-accent" : "bg-transparent"
                }`}
                aria-hidden="true"
              />
              {item.label}
            </a>
          );
        })}
      </div>

      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls="app-dock-menu"
        onClick={toggle}
        className="inline-flex items-center gap-2 rounded-control border border-line bg-surface/85 py-1 pl-1 pr-2.5 text-[13px] font-medium text-body shadow-[0_10px_30px_-14px_rgba(0,0,0,0.4)] backdrop-blur transition-colors duration-150 ease-snap hover:text-ink"
      >
        <svg className="size-[22px]" viewBox="0 0 22 22" aria-hidden="true">
          <circle
            className="app-dock__track"
            cx="11"
            cy="11"
            r={RADIUS}
            fill="none"
            strokeWidth="2"
          />
          <circle
            ref={barRef}
            className="app-dock__bar"
            cx="11"
            cy="11"
            r={RADIUS}
            fill="none"
            strokeWidth="2"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={CIRCUMFERENCE}
            transform="rotate(-90 11 11)"
          />
        </svg>
        <span className="app-morph" style={labelWidth ? { width: `${labelWidth}px` } : undefined}>
          <span key={label} ref={labelRef} className="app-morph__in">
            {label}
          </span>
        </span>
      </button>
    </div>
  );
}
