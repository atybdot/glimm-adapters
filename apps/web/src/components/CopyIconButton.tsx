"use client";

import { useEffect, useRef, useState } from "react";
import { Copy01Icon, Tick02Icon } from "@hugeicons/core-free-icons";
import Glyph from "./Glyph";
import { writeClipboard } from "../lib/clipboard";
import { cue } from "../lib/sound";

type Props = {
  /** The text to write to the clipboard. */
  text: string;
  /** Accessible name, e.g. `Copy src/routes/__root.tsx`. */
  label: string;
};

/**
 * The copy control that sits in a code block's header.
 *
 * It locks itself while the tick is showing: a second click would replay the
 * cue and restart the reset timer, so it is dropped until the icon returns.
 */
export default function CopyIconButton({ text, label }: Props) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const onClick = async () => {
    if (copied) return;
    await writeClipboard(text);
    cue("success", { emphasis: "subtle" });
    setCopied(true);
    timer.current = window.setTimeout(() => setCopied(false), 1300);
  };

  return (
    <button
      type="button"
      className={`app-copy${copied ? " is-copied" : ""}`}
      aria-label={label}
      disabled={copied}
      onClick={onClick}
    >
      <span className="relative inline-flex size-4">
        <span className="app-copy__icon app-copy__copy">
          <Glyph icon={Copy01Icon} size={15} />
        </span>
        <span className="app-copy__icon app-copy__check">
          <Glyph icon={Tick02Icon} size={15} />
        </span>
      </span>
    </button>
  );
}
