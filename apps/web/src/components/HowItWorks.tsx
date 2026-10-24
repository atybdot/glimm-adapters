"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { PauseIcon, PlayIcon, RefreshIcon } from "@hugeicons/core-free-icons";
import Glyph from "./Glyph";
import { cue } from "../lib/sound";

type Step = { n: string; title: string; note: string };

/** The fixed phases, in ms. Paint is the app's own time, so it is the slider. */
const COVER_MS = 900;
const COMMIT_MS = 620;
const REVEAL_MS = 900;

/** The beat at the end of a cycle, before the loop runs again. */
const HOLD_MS = 1300;

const DEFAULT_RENDER = 1100;

const PHASE_LABEL = ["", 'router.push("/dashboard")', "waiting for render", ""];

/** easeOutQuart. Leaves quickly, then settles into place. */
function ease(t: number) {
  return 1 - (1 - t) ** 4;
}

/** The system preference as external state, so hydration starts settled. */
function useReducedMotion() {
  return useSyncExternalStore(
    (onChange) => {
      const query = window.matchMedia("(prefers-reduced-motion: reduce)");
      query.addEventListener("change", onChange);
      return () => query.removeEventListener("change", onChange);
    },
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false,
  );
}

const controlClass =
  "inline-flex h-7 flex-none items-center gap-1.5 rounded-control border border-line bg-surface px-2.5 text-[12.5px] font-medium text-body transition-[background-color,color,transform] duration-150 ease-snap hover:bg-recess hover:text-ink active:scale-[0.97]";

const momentClass =
  "flex h-7 items-center justify-center rounded-control px-1 text-[12.5px] transition-colors duration-200 ease-snap";

/**
 * How it works, as the four moments over one shared clock.
 *
 * A miniature two-page app sits above a single scrub rail. The ember band
 * crosses it, the two pages swap under the cover, and the rail fills with the
 * same progress the band is drawing. The app's render time is the one dial:
 * move it and the paint phase stretches, which is the whole point.
 *
 * Drag the rail to scrub, click a moment to park, or let it loop. The clock
 * writes straight to the band, the rail fill and the playhead, so sixty frames
 * a second never become sixty renders.
 */
export default function HowItWorks({ steps }: { steps: Step[] }) {
  const [renderMs, setRenderMs] = useState(DEFAULT_RENDER);
  const [phase, setPhase] = useState(0);
  const [playing, setPlaying] = useState(true);
  const reduce = useReducedMotion();

  const figureRef = useRef<HTMLElement>(null);
  const bandRef = useRef<HTMLDivElement>(null);
  const railFillRef = useRef<HTMLSpanElement>(null);
  const playheadRef = useRef<HTMLSpanElement>(null);
  const rafRef = useRef(0);
  const holdRef = useRef<number | undefined>(undefined);
  const renderRef = useRef(DEFAULT_RENDER);
  const phaseRef = useRef(0);
  const reduceRef = useRef(false);
  const visibleRef = useRef(false);
  const playingRef = useRef(true);
  const absRef = useRef(0);
  const pausedAtRef = useRef(0);
  const scrubRef = useRef(false);
  const wasPlayingRef = useRef(false);

  useEffect(() => {
    renderRef.current = renderMs;
  }, [renderMs]);

  useEffect(() => {
    playingRef.current = playing;
  }, [playing]);

  /** The four durations in ms, reading the live render wait. */
  const clock = useCallback(() => [COVER_MS, COMMIT_MS, renderRef.current, REVEAL_MS], []);

  /** Paints one frame: the band, the rail fill and the playhead. */
  const writeFrame = useCallback(
    (p: number, frame: number) => {
      const d = clock();
      const span = d.reduce((sum, value) => sum + value, 0);
      const before = d.slice(0, p).reduce((sum, value) => sum + value, 0);
      const abs = Math.min(1, Math.max(0, (before + d[p]! * frame) / span));
      absRef.current = abs;

      const band = bandRef.current;
      if (band) {
        const x = p === 0 ? -100 + 100 * ease(frame) : p === 3 ? 100 * ease(frame) : 0;
        band.style.transform = `translate3d(${x}%, 0, 0)`;
      }
      if (railFillRef.current) railFillRef.current.style.transform = `scaleX(${abs})`;
      if (playheadRef.current) playheadRef.current.style.left = `${abs * 100}%`;
    },
    [clock],
  );

  const stop = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    window.clearTimeout(holdRef.current);
  }, []);

  /** Jumps to an absolute progress, 0..1, and parks there. */
  const seekTo = useCallback(
    (abs: number) => {
      stop();
      const clamped = Math.min(1, Math.max(0, abs));
      const d = clock();
      const span = d.reduce((sum, value) => sum + value, 0);
      let t = clamped * span;
      let p = 0;
      while (p < 3 && t >= d[p]!) {
        t -= d[p]!;
        p += 1;
      }
      phaseRef.current = p;
      setPhase(p);
      writeFrame(p, Math.min(1, t / (d[p] || 1)));
      pausedAtRef.current = clamped;
    },
    [clock, stop, writeFrame],
  );

  /** Runs the clock from an absolute progress. At the end, hold, then loop. */
  const startAt = useCallback(
    function startAt(abs: number) {
      stop();
      if (reduceRef.current) {
        seekTo(1);
        return;
      }
      const d = clock();
      const span = d.reduce((sum, value) => sum + value, 0);
      const from = abs >= 1 ? 0 : Math.max(0, abs);
      const start = performance.now() - from * span;

      const tick = (now: number) => {
        let elapsed = now - start;
        if (elapsed >= span) {
          phaseRef.current = 3;
          setPhase(3);
          writeFrame(3, 1);
          pausedAtRef.current = 1;
          holdRef.current = window.setTimeout(() => {
            if (playingRef.current && visibleRef.current) startAt(0);
          }, HOLD_MS);
          return;
        }
        let p = 0;
        while (elapsed >= d[p]!) {
          elapsed -= d[p]!;
          p += 1;
        }
        if (p !== phaseRef.current) {
          phaseRef.current = p;
          setPhase(p);
        }
        writeFrame(p, elapsed / (d[p] || 1));
        rafRef.current = requestAnimationFrame(tick);
      };

      rafRef.current = requestAnimationFrame(tick);
    },
    [clock, seekTo, stop, writeFrame],
  );

  /** Autoplay in view, hold the clock off screen, tear it down on unmount. */
  useEffect(() => {
    const figure = figureRef.current;
    reduceRef.current = reduce;
    writeFrame(0, 0);

    if (reduce) {
      playingRef.current = false;
      // The media query is the external system; parking is the sync.
      // oxlint-disable-next-line react/set-state-in-effect
      seekTo(1);
    } else if (visibleRef.current && playingRef.current) {
      // The preference can flip back at runtime, and the observer will not
      // fire again for a figure that never left the viewport.
      startAt(pausedAtRef.current);
    }

    // A bfcache restore or a background tab never crosses the observer, so the
    // clock is parked and woken from here instead.
    const sleep = () => {
      pausedAtRef.current = absRef.current;
      stop();
    };
    const wake = () => {
      if (document.visibilityState !== "visible") return;
      if (playingRef.current && visibleRef.current) startAt(pausedAtRef.current);
    };
    const onVisibility = () => {
      if (document.visibilityState === "visible") wake();
      else sleep();
    };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pageshow", wake);
    window.addEventListener("pagehide", sleep);

    if (!figure) {
      if (!reduce) startAt(0);
      return () => {
        document.removeEventListener("visibilitychange", onVisibility);
        window.removeEventListener("pageshow", wake);
        window.removeEventListener("pagehide", sleep);
        stop();
      };
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const was = visibleRef.current;
          visibleRef.current = entry.isIntersecting;
          if (entry.isIntersecting && !was) {
            if (playingRef.current) startAt(pausedAtRef.current);
          } else if (!entry.isIntersecting && was) {
            pausedAtRef.current = absRef.current;
            stop();
          }
        }
      },
      { threshold: 0.35 },
    );
    observer.observe(figure);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pageshow", wake);
      window.removeEventListener("pagehide", sleep);
      stop();
    };
  }, [reduce, seekTo, startAt, stop, writeFrame]);

  const togglePlaying = () => {
    const next = !playing;
    playingRef.current = next;
    setPlaying(next);
    if (next) {
      startAt(pausedAtRef.current);
      cue("navigate", { emphasis: "subtle" });
    } else {
      pausedAtRef.current = absRef.current;
      stop();
      cue("toggle", { emphasis: "subtle" });
    }
  };

  const reset = () => {
    stop();
    playingRef.current = false;
    setPlaying(false);
    pausedAtRef.current = 0;
    phaseRef.current = 0;
    setPhase(0);
    writeFrame(0, 0);
    cue("select", { emphasis: "subtle" });
  };

  const park = (index: number) => {
    playingRef.current = false;
    setPlaying(false);
    seekTo((index + 0.5) / 4);
    cue("select", { emphasis: "subtle" });
  };

  const progressAt = (clientX: number, rect: DOMRect) =>
    Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));

  const scrubStart = (event: ReactPointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    scrubRef.current = true;
    wasPlayingRef.current = playingRef.current;
    playingRef.current = false;
    setPlaying(false);
    seekTo(progressAt(event.clientX, event.currentTarget.getBoundingClientRect()));
  };

  const scrubMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!scrubRef.current) return;
    seekTo(progressAt(event.clientX, event.currentTarget.getBoundingClientRect()));
  };

  const scrubEnd = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!scrubRef.current) return;
    scrubRef.current = false;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    if (wasPlayingRef.current) {
      playingRef.current = true;
      setPlaying(true);
      startAt(absRef.current);
    }
  };

  const swap = phase >= 1;

  return (
    <figure
      ref={figureRef}
      className="app-how mt-6 overflow-hidden rounded-card border border-line bg-surface"
      aria-label="A sweep crossing a mock two-page app, over the four moments it is made of"
    >
      <div className="relative h-[210px] overflow-hidden border-b border-line bg-recess">
        <div className="app-how__page absolute inset-0 p-4" data-on={!swap} aria-hidden={swap}>
          <MiniPage path="/" title="Home" />
        </div>

        <div className="app-how__page absolute inset-0 p-4" data-on={swap} aria-hidden={!swap}>
          <MiniPage path="/dashboard" title="Dashboard" stats />
        </div>

        <div
          ref={bandRef}
          className="app-how__band absolute inset-y-0 left-0 w-full overflow-hidden"
        >
          <span
            className="absolute inset-y-0 right-0 w-16 bg-gradient-to-r from-transparent to-white/30"
            aria-hidden="true"
          />
          {phase === 2 ? <span className="app-how__sheen" aria-hidden="true" /> : null}
          <span className="absolute inset-0 grid place-items-center px-4 font-mono text-[12.5px] text-white">
            <span key={phase} className="app-how__label">
              {PHASE_LABEL[phase]}
            </span>
          </span>
        </div>
      </div>

      <div className="px-4 pb-3 pt-3">
        <div
          className="relative cursor-ew-resize touch-none py-3"
          onPointerDown={scrubStart}
          onPointerMove={scrubMove}
          onPointerUp={scrubEnd}
          onPointerCancel={scrubEnd}
        >
          <div className="relative h-1.5 rounded-full bg-line">
            <span
              ref={railFillRef}
              className="app-how__rail-fill absolute inset-0 rounded-full bg-[#ff5b39]"
            />
          </div>
          <span
            ref={playheadRef}
            className="app-how__playhead pointer-events-none absolute top-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#ff5b39] ring-2 ring-surface"
            aria-hidden="true"
          />
        </div>

        <div className="mt-1 grid grid-cols-4 gap-1">
          {steps.map((step, index) => (
            <button
              key={step.n}
              type="button"
              onClick={() => park(index)}
              aria-pressed={index === phase}
              aria-label={`${step.n} ${step.title}`}
              className={`${momentClass} ${
                index === phase ? "font-medium text-ink" : "text-muted hover:text-body"
              }`}
            >
              {step.title}
            </button>
          ))}
        </div>

        <p
          key={phase}
          className="app-how__note mt-1 min-h-[3em] text-[13px] leading-[1.5] text-body"
        >
          {steps[phase]?.note}
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
          <div className="flex items-center gap-2">
            {reduce ? null : (
              <button
                type="button"
                onClick={togglePlaying}
                aria-pressed={playing}
                className={controlClass}
              >
                <span key={playing ? "pause" : "play"} className="app-how__num inline-flex">
                  <Glyph icon={playing ? PauseIcon : PlayIcon} size={14} />
                </span>
                {playing ? "Pause" : "Play"}
              </button>
            )}

            <button type="button" onClick={reset} className={controlClass}>
              <Glyph icon={RefreshIcon} size={14} />
              Reset
            </button>
          </div>

          <div className="flex min-w-[200px] flex-1 items-center gap-3">
            <label htmlFor="app-render" className="flex-none text-[12.5px] text-muted">
              Render wait
            </label>
            <input
              id="app-render"
              type="range"
              min={200}
              max={2000}
              step={50}
              value={renderMs}
              onChange={(event) => {
                setRenderMs(Number(event.target.value));
              }}
              className="app-range min-w-0 flex-1"
            />
            <span
              key={renderMs}
              className="app-how__num w-[58px] flex-none whitespace-nowrap text-right font-mono text-[12px] text-faint"
            >
              {renderMs} ms
            </span>
          </div>
        </div>
      </div>
    </figure>
  );
}

/** One side of the mock app: a path, a title, and a little page furniture. */
function MiniPage({
  path,
  title,
  stats = false,
}: {
  path: string;
  title: string;
  stats?: boolean;
}) {
  return (
    <div className="flex h-full flex-col">
      <span className="font-mono text-[11px] text-faint">{path}</span>
      <span className="mt-1.5 text-[16px] font-semibold tracking-[-0.01em] text-ink">{title}</span>

      {stats ? (
        <div className="mt-4 grid grid-cols-3 gap-2">
          {["1.2k", "98%", "3"].map((value) => (
            <span
              key={value}
              className="rounded-control border border-line-soft bg-surface px-2.5 py-2 text-center font-mono text-[13px] text-body"
            >
              {value}
            </span>
          ))}
        </div>
      ) : null}

      <div className="mt-4 flex flex-col gap-2">
        <span className="h-2 w-[72%] rounded-full bg-line" />
        <span className="h-2 w-[88%] rounded-full bg-line-soft" />
        <span className="h-2 w-[54%] rounded-full bg-line-soft" />
      </div>
    </div>
  );
}
