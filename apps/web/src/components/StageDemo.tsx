"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { ArrowDown01Icon, PauseIcon, PlayIcon } from "@hugeicons/core-free-icons";
import { createShader, playSweep, resolvePalette } from "glimm-adapters";
import type { PaletteName, ShaderController, SweepHandle } from "glimm-adapters";
import Glyph from "./Glyph";
import AutopilotDemo from "./demos/AutopilotDemo";
import PublishDemo from "./demos/PublishDemo";
import { demos, type DemoId } from "../lib/demos";
import { paletteCss } from "../lib/palette-css";
import { cue } from "../lib/sound";
import {
  activePalette,
  getSweepState,
  setPalette as setStorePalette,
  useSweepState,
} from "../lib/sweep-store";

/** The preset chips, drawn from the same cosine fit the band uses. */
const PALETTES = (["prism", "berry", "lagoon", "citrus", "azure", "ember"] as PaletteName[]).map(
  (name) => ({ name, css: paletteCss(resolvePalette(name)) }),
);

/** True when the visitor asked the system to calm motion down. */
function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/**
 * The same question as external state. `getServerSnapshot` keeps the hydration
 * render in step with the server, and a later re-render picks up the real
 * answer, so a reduced-motion visitor never sees a mismatch.
 */
function useReducedMotion(): boolean {
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

/**
 * The live stage: one real shader on one canvas, with a small app above it
 * that changes state on the band's midpoint. The toolbar picks the app, the
 * palette and whether the loop runs.
 */
export default function StageDemo() {
  const figureRef = useRef<HTMLElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctrlRef = useRef<ShaderController | null>(null);
  const activeRef = useRef<SweepHandle | null>(null);
  const hoverRef = useRef(false);
  const visibleRef = useRef(false);
  const greetedRef = useRef(false);

  const { palette, custom, bandTight } = useSweepState();
  const reduce = useReducedMotion();

  const [demo, setDemo] = useState<DemoId>("publish");
  const [demoOpen, setDemoOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  // The loop starts on so the hydration render matches the server's; a
  // reduced-motion visitor just never sees the control.
  const [playing, setPlaying] = useState(true);
  const playingRef = useRef(playing);

  useEffect(() => {
    playingRef.current = playing;
  }, [playing]);

  /** Runs one sweep across the stage canvas, landing the callback at midpoint. */
  const sweepTo = (onMidpoint?: () => void) => {
    const ctrl = ctrlRef.current;
    // Reduced motion skips the band but still lands the state change.
    if (!ctrl || prefersReducedMotion()) {
      onMidpoint?.();
      return;
    }
    activeRef.current?.cancel();
    const { easing, bandTight: tight } = getSweepState();
    activeRef.current = playSweep(ctrl, {
      palette: activePalette(),
      easing,
      bandTight: tight,
      sweepMs: 1500,
      outroMs: 240,
      onMidpoint: () => {
        onMidpoint?.();
      },
      onComplete: () => {
        activeRef.current = null;
      },
    });
  };

  // One shader on the stage canvas, created on mount.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctrl = createShader({
      canvas,
      palette: activePalette(),
      bandTight: getSweepState().bandTight,
    });
    if (!ctrl) return;
    ctrl.setAlpha(0);
    ctrlRef.current = ctrl;
    return () => {
      ctrl.destroy();
      ctrlRef.current = null;
    };
  }, []);

  // Follow the shared store: a preset or a rolled palette, and the band width.
  useEffect(() => {
    const ctrl = ctrlRef.current;
    if (!ctrl) return;
    ctrl.setPalette(activePalette());
    ctrl.setBandTight(bandTight);
  }, [palette, custom, bandTight]);

  // Autoplay pauses while the pointer is over the demo and while it is off screen.
  useEffect(() => {
    if (reduce) return;
    const figure = figureRef.current;
    if (!figure) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          visibleRef.current = entry.isIntersecting;
          if (entry.isIntersecting && !greetedRef.current) {
            greetedRef.current = true;
            window.setTimeout(() => {
              if (playingRef.current) sweepTo();
            }, 1100);
          }
        }
      },
      { threshold: 0.25 },
    );
    observer.observe(figure);
    return () => observer.disconnect();
  }, [reduce]);

  useEffect(() => {
    if (reduce || !playing) return;
    const timer = window.setInterval(() => {
      if (!hoverRef.current && visibleRef.current) sweepTo();
    }, 7000);
    return () => window.clearInterval(timer);
  }, [reduce, playing]);

  // Only one menu at a time, and a click outside or Escape puts both away.
  useEffect(() => {
    if (!demoOpen && !paletteOpen) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!toolbarRef.current?.contains(event.target as Node)) {
        setDemoOpen(false);
        setPaletteOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setDemoOpen(false);
        setPaletteOpen(false);
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [demoOpen, paletteOpen]);

  const choosePalette = (name: PaletteName) => {
    setStorePalette(name);
    setPaletteOpen(false);
    cue("select", { emphasis: "subtle" });
    sweepTo();
  };

  const current = PALETTES.find((item) => item.name === palette) ?? PALETTES[0]!;
  const swatch = custom ? paletteCss(custom) : current.css;
  const paletteLabel = custom ? "custom" : current.name;

  const chooseDemo = (id: DemoId) => {
    setDemo(id);
    setDemoOpen(false);
    cue("select", { emphasis: "subtle" });
  };

  const currentDemo = demos.find((item) => item.id === demo) ?? demos[0]!;

  const menuBase =
    "absolute z-20 rounded-card border border-line bg-surface p-1.5 shadow-[0_18px_44px_-24px_rgba(0,0,0,0.45)] transition-[transform,opacity] ease-snap";
  const menuState = (open: boolean) =>
    open
      ? "pointer-events-auto scale-100 opacity-100 duration-[250ms]"
      : "pointer-events-none scale-[0.97] opacity-0 duration-150";

  return (
    <figure ref={figureRef} className="mt-8 scroll-mt-6" id="app-demo">
      <div className="rounded-stage border border-line bg-surface">
        <div
          ref={toolbarRef}
          className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-b border-line bg-recess px-2 py-1.5"
        >
          <div className="relative min-w-0">
            <button
              type="button"
              aria-haspopup="menu"
              aria-expanded={demoOpen}
              aria-controls="app-demo-menu"
              onClick={() => {
                setDemoOpen((open) => !open);
                setPaletteOpen(false);
                cue("select", { emphasis: "subtle" });
              }}
              className="inline-flex h-7 max-w-full items-center gap-1.5 rounded-sm px-2 text-[12.5px] text-body outline-none transition-colors duration-150 ease-snap hover:bg-surface hover:text-ink focus-visible:text-ink"
            >
              <span className="truncate font-mono text-[12px]">{currentDemo.label}</span>
              <Glyph
                icon={ArrowDown01Icon}
                size={13}
                className={`text-faint transition-transform duration-200 ease-snap ${demoOpen ? "rotate-180" : ""}`}
              />
            </button>

            <div
              id="app-demo-menu"
              role="menu"
              inert={!demoOpen}
              className={`${menuBase} ${menuState(demoOpen)} left-0 top-[calc(100%+6px)] w-[168px] origin-top-left`}
            >
              {demos.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  role="menuitemradio"
                  aria-checked={item.id === demo}
                  onClick={() => chooseDemo(item.id)}
                  className={`flex w-full items-center rounded-sm px-2 py-1.5 text-left font-mono text-[12px] text-body transition-colors duration-150 ease-snap hover:bg-recess hover:text-ink ${
                    item.id === demo ? "bg-recess text-ink" : ""
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-none items-center gap-1.5">
            <div className="relative">
              <button
                type="button"
                aria-haspopup="menu"
                aria-expanded={paletteOpen}
                aria-controls="app-pal-menu"
                onClick={() => {
                  setPaletteOpen((open) => !open);
                  setDemoOpen(false);
                  cue("select", { emphasis: "subtle" });
                }}
                className="inline-flex h-7 items-center gap-2 rounded-sm px-2 text-[12.5px] text-body outline-none transition-colors duration-150 ease-snap hover:bg-surface hover:text-ink focus-visible:text-ink"
              >
                <span
                  className="size-3.5 flex-none rounded-xs ring-1 ring-inset ring-black/10"
                  style={{ background: swatch }}
                  aria-hidden="true"
                />
                <span className="font-mono text-[12px]">{paletteLabel}</span>
                <Glyph
                  icon={ArrowDown01Icon}
                  size={13}
                  className={`text-faint transition-transform duration-200 ease-snap ${paletteOpen ? "rotate-180" : ""}`}
                />
              </button>

              <div
                id="app-pal-menu"
                role="menu"
                inert={!paletteOpen}
                className={`${menuBase} ${menuState(paletteOpen)} bottom-[calc(100%+6px)] right-0 w-[168px] origin-bottom-right`}
              >
                {PALETTES.map((item) => (
                  <button
                    key={item.name}
                    type="button"
                    role="menuitemradio"
                    aria-checked={item.name === palette && !custom}
                    onClick={() => choosePalette(item.name)}
                    className={`flex w-full items-center gap-2.5 rounded-sm px-2 py-1.5 text-left text-[13px] text-body transition-colors duration-150 ease-snap hover:bg-recess ${
                      item.name === palette && !custom ? "bg-recess text-ink" : ""
                    }`}
                  >
                    <span
                      className="size-3.5 flex-none rounded-xs"
                      style={{ background: item.css }}
                      aria-hidden="true"
                    />
                    <span className="font-mono text-[12px]">{item.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {reduce ? null : (
              <button
                type="button"
                aria-pressed={playing}
                aria-label={playing ? "Pause demo" : "Play demo"}
                onClick={() => {
                  const nextPlaying = !playing;
                  setPlaying(nextPlaying);
                  cue("toggle", { emphasis: "subtle" });
                  if (nextPlaying) sweepTo();
                }}
                className="inline-flex h-7 items-center gap-1.5 rounded-sm px-2 text-[12.5px] text-body outline-none transition-colors duration-150 ease-snap hover:bg-surface hover:text-ink focus-visible:text-ink"
              >
                <span className="app-iswap size-3.5 place-items-center">
                  <span data-on={playing ? "false" : "true"}>
                    <Glyph icon={PlayIcon} size={14} />
                  </span>
                  <span data-on={playing ? "true" : "false"}>
                    <Glyph icon={PauseIcon} size={14} />
                  </span>
                </span>
                <span className="app-wswap">
                  <span data-on={playing ? "true" : "false"}>Pause</span>
                  <span data-on={playing ? "false" : "true"}>Play</span>
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Inner card: the app the sweep runs over */}
        <div className="relative m-3 overflow-hidden rounded-card border border-line bg-canvas">
          <div
            className="relative h-[262px] overflow-hidden bg-canvas sm:h-[292px]"
            onPointerEnter={() => {
              hoverRef.current = true;
            }}
            onPointerLeave={() => {
              hoverRef.current = false;
            }}
          >
            {demo === "publish" ? <PublishDemo sweep={sweepTo} /> : null}
            {demo === "autopilot" ? <AutopilotDemo sweep={sweepTo} /> : null}

            <canvas
              ref={canvasRef}
              className="pointer-events-none absolute inset-0 h-full w-full"
              aria-hidden="true"
            />
          </div>
        </div>
      </div>
    </figure>
  );
}
