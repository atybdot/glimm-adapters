"use client";

import { PlayIcon } from "@hugeicons/core-free-icons";
import Glyph from "./Glyph";
import Segmented from "./Segmented";
import { playPageSweep } from "../lib/page-sweep";
import { cue } from "../lib/sound";
import { setEasing, useSweepState } from "../lib/sweep-store";
import type { EasingName } from "glimm-adapters";

export type EasingOption = {
  name: EasingName;
  points: string;
};

type Props = {
  easings: EasingOption[];
};

/**
 * The easing graph and its options.
 *
 * The plot is a dot grid and the chosen curve, nothing else. Preview sweeps the
 * whole page with the selected curve, so the choice is judged in context.
 */
export default function EasingLab({ easings }: Props) {
  const { easing } = useSweepState();

  return (
    <div className="mt-6">
      <div className="rounded-card border border-line bg-surface p-3">
        <div className="app-ease-plot overflow-hidden rounded-control bg-recess">
          <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            className="block h-[196px] w-full"
            aria-hidden="true"
          >
            {easings.map((item) => (
              <polyline
                key={item.name}
                className="app-ease-curve"
                data-active={item.name === easing}
                points={item.points}
                fill="none"
                vectorEffect="non-scaling-stroke"
              />
            ))}
          </svg>
        </div>

        <div className="mt-2.5">
          <Segmented
            items={easings.map((item) => ({ id: item.name, label: item.name }))}
            value={easing}
            onChange={(name) => {
              setEasing(name);
              cue("select", { emphasis: "subtle" });
            }}
            mode="toggle"
            size="easing"
            pill="raised"
            tone="faint"
            label="Sweep easing"
          />
        </div>
      </div>

      <div className="mt-4 flex items-center justify-end">
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
  );
}
