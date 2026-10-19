"use client";

import {
  ComputerTerminal01Icon,
  Css3Icon,
  Html5Icon,
  SourceCodeIcon,
  Typescript02Icon,
} from "@hugeicons/core-free-icons";
import type { HugeIcon } from "../lib/hugeicons";
import Glyph from "./Glyph";
import CopyIconButton from "./CopyIconButton";

export type FileKind = "ts" | "html" | "css" | "shell" | "text";

const glyphs: Record<FileKind, HugeIcon> = {
  ts: Typescript02Icon,
  html: Html5Icon,
  css: Css3Icon,
  shell: ComputerTerminal01Icon,
  text: SourceCodeIcon,
};

const glyphClass: Record<FileKind, string> = {
  ts: "text-[var(--ic-ts)]",
  html: "text-[var(--ic-html)]",
  css: "text-[var(--ic-css)]",
  shell: "text-[var(--ic-shell)]",
  text: "text-faint",
};

type Props = {
  label: string;
  /** Raw source, written to the clipboard. */
  code: string;
  /** Pre-highlighted markup, rendered as-is. Built in the Astro frontmatter so
      no highlighter ships to the client. */
  html: string;
  file?: FileKind;
  /** Dims the body, for prose-like blocks where the words matter more. */
  muted?: boolean;
  className?: string;
};

/** The code block on the page: header with a file glyph and a copy control. */
export default function CodeBlock({
  label,
  code,
  html,
  file = "text",
  muted = false,
  className = "",
}: Props) {
  return (
    <figure
      className={`overflow-hidden rounded-card border border-line bg-surface ${className}`}
      data-muted={muted ? "true" : undefined}
    >
      <figcaption className="flex items-center justify-between gap-3 border-b border-line-soft px-3 py-2">
        <span className="inline-flex items-center gap-2 font-mono text-[12.5px] text-muted">
          <span className={`inline-flex ${glyphClass[file]}`}>
            <Glyph icon={glyphs[file]} size={15} />
          </span>
          {label}
        </span>
        <CopyIconButton text={code} label={`Copy ${label}`} />
      </figcaption>
      <pre
        className={`m-0 overflow-x-auto p-3 font-mono text-[12.5px] leading-[1.7] whitespace-pre [tab-size:2] ${
          muted ? "text-muted" : "text-body"
        }`}
      >
        <code dangerouslySetInnerHTML={{ __html: html }} />
      </pre>
    </figure>
  );
}
