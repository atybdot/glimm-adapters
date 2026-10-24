import { useState } from "react";
import {
  ArrowUpRight01Icon,
  CheckmarkCircle02Icon,
  Rocket01Icon,
} from "@hugeicons/core-free-icons";
import Glyph from "../Glyph";
import DemoBar from "./DemoBar";
import { cue } from "../../lib/sound";
import type { DemoProps } from "./types";

/**
 * Demo 1, publishing. A draft becomes a live page, and the sweep sits on the
 * moment it goes live. The edit itself never sweeps; only the release does.
 */
export default function PublishDemo({ sweep }: DemoProps) {
  const [published, setPublished] = useState(false);

  const toggle = () => {
    if (published) {
      setPublished(false);
      cue("toggle", { emphasis: "subtle" });
      return;
    }
    sweep(() => {
      setPublished(true);
      cue("success", { emphasis: "subtle" });
    });
  };

  return (
    <div className="flex h-full flex-col">
      <DemoBar
        left="launch-notes.mdx"
        right={
          <span
            className={`inline-flex items-center gap-1.5 font-mono text-[11px] ${
              published ? "text-ok" : "text-faint"
            }`}
          >
            <span className={`size-1.5 rounded-full ${published ? "bg-ok" : "bg-line"}`} />
            {published ? "live" : "draft"}
          </span>
        }
      />

      <div className="flex flex-1 flex-col p-4">
        <h3 className="text-[15px] font-semibold tracking-[-0.01em] text-ink">Launch notes</h3>
        <p className="mt-2 max-w-[48ch] text-[12.5px] leading-[1.6] text-muted">
          {published
            ? "Published. Readers can open it now."
            : "A short note about the release. Nothing here is public yet."}
        </p>

        <div className="mt-3.5 flex flex-col gap-2" aria-hidden="true">
          <span className="h-2 w-[86%] rounded-full bg-line-soft" />
          <span className="h-2 w-[62%] rounded-full bg-line-soft" />
        </div>

        <div className="mt-auto flex items-center gap-3 pt-4">
          <button
            type="button"
            onClick={toggle}
            className="inline-flex h-8 items-center gap-1.5 rounded-control bg-ink px-3 text-[12.5px] font-medium text-surface transition-[opacity,transform] duration-150 ease-snap hover:opacity-90 active:scale-[0.97]"
          >
            <Glyph icon={published ? CheckmarkCircle02Icon : Rocket01Icon} size={14} />
            {published ? "Published" : "Publish"}
          </button>

          {published ? (
            <a
              className="inline-flex items-center gap-1 text-[12.5px] font-medium text-ink no-underline transition-colors duration-150 ease-snap hover:text-accent"
              href="/changelog"
            >
              View page
              <Glyph icon={ArrowUpRight01Icon} size={13} />
            </a>
          ) : null}
        </div>
      </div>
    </div>
  );
}
