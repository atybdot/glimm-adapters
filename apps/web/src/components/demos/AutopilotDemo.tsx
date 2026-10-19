import { useState } from "react";
import { ArrowRight01Icon, Settings02Icon } from "@hugeicons/core-free-icons";
import Glyph from "../Glyph";
import Switch from "../Switch";
import DemoBar from "./DemoBar";
import { cue } from "../../lib/sound";
import type { DemoProps } from "./types";

/**
 * Demo 2, autopilot. A mode switch changes what the app does on every route
 * change, so the sweep belongs on the switch itself, not on each navigation.
 */
export default function AutopilotDemo({ sweep }: DemoProps) {
  const [autopilot, setAutopilot] = useState(false);

  return (
    <div className="flex h-full flex-col">
      <DemoBar
        left="workspace"
        right={<Glyph icon={Settings02Icon} size={14} className="text-faint" />}
      />

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-[13.5px] font-medium text-ink">Autopilot</p>
            <p className="mt-0.5 text-[12px] leading-[1.5] text-muted">
              {autopilot
                ? "Route changes sweep on their own."
                : "Nothing sweeps unless you ask for it."}
            </p>
          </div>

          <Switch
            label="Autopilot"
            checked={autopilot}
            onChange={(next) => {
              // The switch is the control, so it answers at once. The sweep is
              // feedback that plays alongside it, never the source of truth.
              setAutopilot(next);
              cue("toggle", { emphasis: "subtle" });
              sweep();
            }}
          />
        </div>

        <div className="mt-auto flex items-center gap-2 rounded-control border border-line-soft bg-recess px-3 py-3 text-[12.5px] text-body">
          <Glyph
            icon={ArrowRight01Icon}
            size={13}
            className={`flex-none transition-colors duration-200 ease-snap ${autopilot ? "text-accent" : "text-faint"}`}
          />
          <span className="font-mono text-[12px]">
            {autopilot ? "next route: sweep" : "next route: router.push"}
          </span>
        </div>
      </div>
    </div>
  );
}
