"use client";

import { useLayoutEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";

export type SegmentSize = "xs" | "sm" | "md" | "easing";

export type Segment<T extends string> = {
  id: T;
  label: ReactNode;
  /** Markup placed before the label, e.g. a framework logo. */
  icon?: ReactNode;
  /** Accessible name where the visible label is code or a mark. */
  ariaLabel?: string;
};

type Props<T extends string> = {
  items: Segment<T>[];
  value: T;
  onChange: (id: T) => void;
  /** Names the group for assistive tech. */
  label: string;
  /** Tabs get roving focus and arrow keys; toggle is a plain button group. */
  mode?: "tabs" | "toggle";
  size?: SegmentSize;
  /** Raised sits on a bordered track; soft is the quiet recess used in the mock. */
  pill?: "raised" | "soft";
  /** Resting colour of an unselected option. */
  tone?: "muted" | "faint";
  /** The panel-id prefix, so a tab's aria-controls resolves. */
  controlsPrefix?: string;
  className?: string;
};

const sizeClasses: Record<SegmentSize, string> = {
  xs: "h-7 flex-none gap-1.5 px-2.5 text-[12.5px]",
  sm: "h-7 flex-none gap-1.5 px-2.5 font-mono text-[12px]",
  md: "h-8 flex-none gap-2 px-3 text-[13px]",
  // The easing row sits quieter than the tab rows: smaller, and lighter again
  // in weight of colour, so it reads as a set of options and not a primary nav.
  easing: "h-6 flex-none gap-1 px-2 font-mono text-[11.5px]",
};

/**
 * The segmented control every row of choices on the page uses: adapter tabs,
 * trigger tabs, the easing options and the demo's own nav.
 *
 * One sliding highlight measures itself against the active button and follows
 * it, so the radius, the height and the motion are identical wherever it
 * appears. `mode` changes the semantics, never the look.
 */
export default function Segmented<T extends string>({
  items,
  value,
  onChange,
  label,
  mode = "tabs",
  size = "sm",
  pill = "raised",
  tone = "muted",
  controlsPrefix,
  className = "",
}: Props<T>) {
  const trackRef = useRef<HTMLDivElement>(null);
  const pillRef = useRef<HTMLSpanElement>(null);
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const firstRun = useRef(true);
  const [maskImage, setMaskImage] = useState<string>("none");

  useLayoutEffect(() => {
    const track = trackRef.current;
    const indicator = pillRef.current;
    if (!track || !indicator) return;

    const place = (animate: boolean) => {
      const active = buttons.current[items.findIndex((item) => item.id === value)];
      if (!active) return;
      const trackBox = track.getBoundingClientRect();
      const box = active.getBoundingClientRect();
      if (!animate) indicator.style.transition = "none";
      indicator.style.borderRadius = getComputedStyle(active).borderRadius;
      indicator.style.width = `${box.width}px`;
      indicator.style.height = `${box.height}px`;
      // The track's padding box is the indicator's containing block, so add the
      // scroll offset back and strip the border the way clientLeft/clientTop do.
      indicator.style.transform = `translate(${
        box.left - trackBox.left - track.clientLeft + track.scrollLeft
      }px, ${box.top - trackBox.top - track.clientTop + track.scrollTop}px)`;
      if (!animate) {
        void indicator.offsetWidth;
        indicator.style.transition = "";
      }
    };

    place(!firstRun.current);
    firstRun.current = false;

    const observer = new ResizeObserver(() => place(false));
    observer.observe(track);
    const updateMask = () => {
      if (!track) return;
      const { scrollLeft, scrollWidth, clientWidth } = track;
      if (scrollWidth <= clientWidth + 1) {
        setMaskImage("none");
        return;
      }
      const fade = 14;
      const left = scrollLeft > 1 ? fade : 0;
      const right = scrollLeft + clientWidth < scrollWidth - 1 ? fade : 0;
      setMaskImage(
        `linear-gradient(to right, transparent 0, black ${left}px, black calc(100% - ${right}px), transparent 100%)`,
      );
    };
    const onScroll = () => {
      place(false);
      updateMask();
    };
    track.addEventListener("scroll", onScroll, { passive: true });
    updateMask();
    const maskObserver = new ResizeObserver(() => updateMask());
    maskObserver.observe(track);

    // Fonts land after first paint and change the label widths.
    void document.fonts?.ready.then(() => place(false));

    return () => {
      observer.disconnect();
      maskObserver.disconnect();
      track.removeEventListener("scroll", onScroll);
    };
  }, [items, value]);

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (mode !== "tabs") return;
    const current = items.findIndex((item) => item.id === value);
    let target = current;
    if (event.key === "ArrowRight") target = (current + 1) % items.length;
    else if (event.key === "ArrowLeft") target = (current - 1 + items.length) % items.length;
    else if (event.key === "Home") target = 0;
    else if (event.key === "End") target = items.length - 1;
    else return;
    event.preventDefault();
    const next = items[target];
    if (!next) return;
    onChange(next.id);
    buttons.current[target]?.focus();
  };

  const trackClass = [
    "relative flex w-fit max-w-full items-center gap-px overflow-x-auto rounded-control p-0.5",
    "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
    pill === "raised" ? "border border-line bg-recess" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      ref={trackRef}
      className={trackClass}
      style={{ maskImage, WebkitMaskImage: maskImage }}
      role={mode === "tabs" ? "tablist" : "group"}
      aria-label={label}
      onKeyDown={onKeyDown}
    >
      <span
        ref={pillRef}
        aria-hidden="true"
        className={pill === "soft" ? "app-pill app-pill--soft" : "app-pill app-pill--raised"}
      />
      {items.map((item, index) => {
        const active = item.id === value;
        const stateProps =
          mode === "tabs"
            ? { role: "tab" as const, "aria-selected": active, tabIndex: active ? 0 : -1 }
            : { "aria-pressed": active };
        return (
          <button
            key={item.id}
            ref={(node) => {
              buttons.current[index] = node;
            }}
            type="button"
            id={controlsPrefix ? `${controlsPrefix}-tab-${item.id}` : undefined}
            aria-controls={controlsPrefix ? `${controlsPrefix}-panel-${item.id}` : undefined}
            aria-label={item.ariaLabel}
            onClick={() => onChange(item.id)}
            className={[
              "relative z-[1] inline-flex items-center rounded-sm font-medium transition-colors duration-150 ease-snap",
              tone === "faint" ? "text-faint hover:text-ink" : "text-muted hover:text-ink",
              sizeClasses[size],
              active ? "text-ink" : "",
            ]
              .filter(Boolean)
              .join(" ")}
            {...stateProps}
          >
            {item.icon}
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
