"use client";

import { useCallback, useEffect, useRef } from "react";
import { PlayIcon } from "@hugeicons/core-free-icons";
import { createShader } from "glimm-adapters";
import type { ShaderController } from "glimm-adapters";
import Glyph from "./Glyph";
import { playPageSweep } from "../lib/page-sweep";
import { cue } from "../lib/sound";
import { activePalette, getSweepState, setBandTight, useSweepState } from "../lib/sweep-store";

const MIN = 5;
const MAX = 50;
/** Park the band mid-travel so it reads at full strength while you tune it. */
const PARKED_AT = 0.5;

/**
 * Band width, shown rather than described.
 *
 * A second shader on its own small canvas, parked at the middle of a sweep, so
 * the stripe across the preview is the real band. Drag across it to set
 * `bandTight`; the value reaches the page-wide sweep on the next preview. No
 * page sweep on drag, so tuning is quiet.
 */
export default function BandWidthLab() {
  const { palette, custom, bandTight: value } = useSweepState();
  const boxRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctrlRef = useRef<ShaderController | null>(null);
  const dragging = useRef(false);

  // One shader on the preview canvas, created on mount and parked. It ticks
  // only while the preview is on screen.
  useEffect(() => {
    const canvas = canvasRef.current;
    const box = boxRef.current;
    if (!canvas || !box) return;
    const ctrl = createShader({
      canvas,
      palette: activePalette(),
      bandTight: getSweepState().bandTight,
    });
    if (!ctrl) return;
    ctrl.setProgress(PARKED_AT);
    ctrl.setAlpha(1);
    ctrlRef.current = ctrl;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) ctrl.setAlpha(entry.isIntersecting ? 1 : 0);
      },
      { threshold: 0 },
    );
    observer.observe(box);

    return () => {
      observer.disconnect();
      ctrl.destroy();
      ctrlRef.current = null;
    };
  }, []);

  // The preview follows the shared palette, so it matches the sweep you get.
  useEffect(() => {
    ctrlRef.current?.setPalette(activePalette());
  }, [palette, custom]);

  // The value lives in the shared store, so the preview band follows it.
  useEffect(() => {
    ctrlRef.current?.setBandTight(value);
  }, [value]);

  /** Pointer x across the preview maps straight onto the range. */
  const fromClientX = useCallback((clientX: number) => {
    const box = boxRef.current;
    if (!box) return;
    const rect = box.getBoundingClientRect();
    const ratio = rect.width > 0 ? (clientX - rect.left) / rect.width : 0;
    setBandTight(Math.round(MIN + Math.min(1, Math.max(0, ratio)) * (MAX - MIN)));
  }, []);

  return (
    <div className="mt-6">
      <div className="rounded-card border border-line bg-surface p-3">
        <div
          ref={boxRef}
          role="slider"
          tabIndex={0}
          aria-label="Band width"
          aria-valuemin={MIN}
          aria-valuemax={MAX}
          aria-valuenow={value}
          title="Drag to set the band width"
          onPointerDown={(event) => {
            dragging.current = true;
            fromClientX(event.clientX);
            cue("select", { emphasis: "subtle" });
            try {
              event.currentTarget.setPointerCapture(event.pointerId);
            } catch {
              // The pointer is already gone; dragging still works without capture.
            }
          }}
          onPointerMove={(event) => {
            if (dragging.current) fromClientX(event.clientX);
          }}
          onPointerUp={(event) => {
            dragging.current = false;
            try {
              event.currentTarget.releasePointerCapture(event.pointerId);
            } catch {
              // Nothing to release.
            }
          }}
          onPointerCancel={(event) => {
            dragging.current = false;
            try {
              event.currentTarget.releasePointerCapture(event.pointerId);
            } catch {
              // Nothing to release.
            }
          }}
          onKeyDown={(event) => {
            const step =
              event.key === "ArrowLeft" || event.key === "ArrowDown"
                ? -1
                : event.key === "ArrowRight" || event.key === "ArrowUp"
                  ? 1
                  : event.key === "PageDown"
                    ? -5
                    : event.key === "PageUp"
                      ? 5
                      : 0;
            if (step !== 0) {
              event.preventDefault();
              setBandTight(Math.min(MAX, Math.max(MIN, value + step)));
            } else if (event.key === "Home") {
              event.preventDefault();
              setBandTight(MIN);
            } else if (event.key === "End") {
              event.preventDefault();
              setBandTight(MAX);
            }
          }}
          className="relative aspect-[16/9] cursor-ew-resize touch-none select-none overflow-hidden rounded-control bg-recess outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <canvas
            ref={canvasRef}
            className="pointer-events-none absolute inset-0 h-full w-full"
            aria-hidden="true"
          />
          {/* Fades the band into the well at the edges, so the middle reads as a
              beam rather than a wash. Same trick the original page uses. */}
          <span
            className="app-band-vignette pointer-events-none absolute inset-0"
            aria-hidden="true"
          />
          <span className="pointer-events-none absolute left-3 top-2.5 font-mono text-[12px] text-faint">
            bandTight <span className="text-ink">{value}</span>
          </span>
        </div>

        <div className="mt-2.5 flex items-center justify-end">
          <button
            type="button"
            onClick={() => {
              cue("navigate", { emphasis: "subtle" });
              playPageSweep({ sweepMs: 1200, outroMs: 240 });
            }}
            className="inline-flex h-7 flex-none items-center gap-1.5 rounded-control bg-line px-3 text-[12.5px] font-medium text-body/90 transition-[opacity,transform] duration-150 ease-snap hover:opacity-90 active:scale-[0.97]"
          >
            <Glyph icon={PlayIcon} size={14} />
            Preview
          </button>
        </div>
      </div>
    </div>
  );
}
