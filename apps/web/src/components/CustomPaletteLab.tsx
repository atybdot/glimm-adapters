"use client";

import { PlayIcon, ShuffleIcon } from "@hugeicons/core-free-icons";
import { resolvePalette, shuffleAccentPalette } from "glimm-adapters";
import Glyph from "./Glyph";
import { playPageSweep } from "../lib/page-sweep";
import { paletteCss } from "../lib/palette-css";
import { cue } from "../lib/sound";
import { setCustom, useSweepState } from "../lib/sweep-store";

const KEYS = ["a", "b", "c", "d"] as const;

function fmt(value: number) {
  return value.toFixed(2);
}

/**
 * Custom palette.
 *
 * The strip is the palette the sweep will use, drawn straight from the cosine
 * fit; the numbers are its four triplets, ready to copy. Shuffle rolls a new
 * one and shows it on the page. Everything else lives in the section prose.
 */
export default function CustomPaletteLab() {
  const { custom, palette: preset } = useSweepState();
  const active = custom ?? resolvePalette(preset);

  const roll = () => {
    setCustom(shuffleAccentPalette());
    cue("select", { emphasis: "subtle" });
    playPageSweep();
  };

  return (
    <div className="mt-6">
      <div className="rounded-card border border-line bg-surface p-3">
        <div
          className="h-14 rounded-control ring-1 ring-inset ring-black/10"
          style={{ background: paletteCss(active) }}
          aria-hidden="true"
        />

        <dl className="mt-3 grid grid-cols-1 gap-x-6 gap-y-1 font-mono text-[12px] sm:grid-cols-2">
          {KEYS.map((key) => (
            <div key={key} className="flex items-baseline gap-2">
              <dt className="w-3 flex-none text-faint">{key}</dt>
              <dd className="text-ink">[{active[key].map(fmt).join(", ")}]</dd>
            </div>
          ))}
        </dl>

        <div className="mt-3 flex items-center gap-2">
          <button
            type="button"
            onClick={roll}
            className="inline-flex h-8 items-center gap-1.5 rounded-control border border-line bg-surface px-3 text-[12.5px] font-medium text-body transition-colors duration-150 ease-snap hover:bg-recess hover:text-ink"
          >
            <Glyph icon={ShuffleIcon} size={14} />
            Shuffle
          </button>
          <button
            type="button"
            onClick={() => {
              cue("navigate", { emphasis: "subtle" });
              playPageSweep();
            }}
            className="inline-flex h-8 items-center gap-1.5 rounded-control bg-line px-3 text-[12.5px] font-medium text-body/90 transition-[opacity,transform] duration-150 ease-snap hover:opacity-90 active:scale-[0.97]"
          >
            <Glyph icon={PlayIcon} size={14} />
            Preview
          </button>
          {custom ? (
            <button
              type="button"
              onClick={() => {
                setCustom(null);
                cue("close", { emphasis: "subtle" });
              }}
              className="inline-flex h-8 items-center rounded-control px-2 text-[12.5px] font-medium text-muted transition-colors duration-150 ease-snap hover:text-ink"
            >
              Reset
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
