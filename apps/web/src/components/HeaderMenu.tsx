"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import {
  BrowserIcon,
  ChatGptIcon,
  ClaudeIcon,
  Copy01Icon,
  GithubIcon,
  HistoryIcon,
  Moon02Icon,
  MoreHorizontalIcon,
  SourceCodeIcon,
  Sun03Icon,
  VolumeHighIcon,
  VolumeOffIcon,
} from "@hugeicons/core-free-icons";
import Glyph from "./Glyph";
import { SwitchVisual } from "./Switch";
import { writeClipboard } from "../lib/clipboard";
import { getPageController, playPageSweep } from "../lib/page-sweep";
import { cue, setSound } from "../lib/sound";
import { useSoundEnabled } from "../lib/use-sound";

type Props = {
  /** The whole page as markdown, for the copy action. Omitted where there is no
      mirror, and the menu then drops the four model actions. */
  markdown?: string;
  /** A link to the page's markdown mirror. */
  mdHref?: string;
  chatGptHref?: string;
  claudeHref?: string;
};

const itemClass =
  "flex w-full items-center gap-2.5 rounded-sm px-2.5 py-2 text-left text-[13.5px] text-body no-underline transition-colors duration-150 ease-snap hover:bg-recess hover:text-ink";

function Separator() {
  return <div className="my-1.5 h-px bg-line-soft" role="separator" />;
}

function SwitchRow({
  icon,
  children,
  checked,
  onChange,
}: {
  icon: ReactNode;
  children: ReactNode;
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  // The whole row is the control. `menuitemcheckbox` rather than `switch`,
  // because a menu item may not host a button of its own.
  return (
    <button
      type="button"
      role="menuitemcheckbox"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex w-full items-center gap-2.5 rounded-sm px-2.5 py-2 text-left text-[13.5px] text-body outline-none transition-colors duration-150 ease-snap hover:bg-recess hover:text-ink focus-visible:bg-recess focus-visible:text-ink"
    >
      <span className="text-muted">{icon}</span>
      <span className="flex-1">{children}</span>
      <SwitchVisual checked={checked} />
    </button>
  );
}

/**
 * The one menu in the header: copy/view the page as markdown, open it in a
 * model, the display switches, and the links out.
 */
export default function HeaderMenu({ markdown, mdHref, chatGptHref, claudeHref }: Props) {
  const [open, setOpen] = useState(false);
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle");
  const [dark, setDark] = useState(false);
  const sound = useSoundEnabled();
  const wrapRef = useRef<HTMLDivElement>(null);
  const copyTimer = useRef<number | undefined>(undefined);
  const themeSweep = useRef<ReturnType<typeof playPageSweep>>(null);
  const wasOpen = useRef(false);

  useEffect(() => {
    const sync = () => setDark(document.documentElement.getAttribute("data-theme") === "dark");
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    return () => observer.disconnect();
  }, []);

  useEffect(
    () => () => {
      window.clearTimeout(copyTimer.current);
      themeSweep.current?.cancel();
    },
    [],
  );

  const setMenu = useCallback((next: boolean) => {
    setOpen(next);
  }, []);

  // Cue on the transition, not inside a state updater: updaters can run twice
  // in StrictMode, which played the cue twice.
  useEffect(() => {
    if (wasOpen.current === open) return;
    wasOpen.current = open;
    cue(open ? "open" : "close", { emphasis: "subtle" });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!wrapRef.current?.contains(event.target as Node)) setMenu(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenu(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, setMenu]);

  const copyMarkdown = async () => {
    if (!markdown) return;
    const ok = await writeClipboard(markdown);
    if (!ok) {
      setCopyState("failed");
      window.clearTimeout(copyTimer.current);
      copyTimer.current = window.setTimeout(() => setCopyState("idle"), 1600);
      return;
    }
    cue("success", { emphasis: "subtle" });
    setCopyState("copied");
    window.clearTimeout(copyTimer.current);
    copyTimer.current = window.setTimeout(() => setCopyState("idle"), 1400);
    setMenu(false);
  };

  const flipTheme = (next: boolean) => {
    document.dispatchEvent(new CustomEvent("set-theme", { detail: next ? "dark" : "light" }));
  };

  const setTheme = (next: boolean) => {
    // The switch answers the click. The band only carries the paint, so the
    // knob never snaps back while it waits for a midpoint.
    setDark(next);
    cue("navigate", { emphasis: "subtle" });

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || !getPageController()) {
      flipTheme(next);
      return;
    }

    // A second click supersedes the first sweep; drop its pending theme flip.
    themeSweep.current?.cancel();
    themeSweep.current = playPageSweep({
      easing: "easeOutExpo",
      sweepMs: 720,
      outroMs: 260,
      onMidpoint: () => flipTheme(next),
    });
    // The canvas could fail to initialise; the theme still has to change.
    if (!themeSweep.current) flipTheme(next);
  };

  const setSoundOn = (next: boolean) => {
    setSound(next);
    if (next) cue("success", { emphasis: "subtle" });
  };

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        id="app-menu-btn"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls="app-menu-list"
        onClick={() => setMenu(!open)}
        className="inline-flex h-9 items-center gap-1.5 rounded-control border border-line bg-surface px-2.5 text-[13px] font-medium text-body outline-none transition-[background-color,color,transform] duration-150 ease-snap hover:bg-recess hover:text-ink active:scale-[0.96] focus-visible:border-accent"
      >
        <Glyph icon={MoreHorizontalIcon} size={17} />
        <span>Menu</span>
      </button>

      <div
        id="app-menu-list"
        role="menu"
        aria-labelledby="app-menu-btn"
        inert={!open}
        className={`absolute right-0 top-[calc(100%+8px)] z-50 w-[280px] origin-top-right rounded-card border border-line bg-surface p-1.5 shadow-[0_18px_44px_-24px_rgba(0,0,0,0.25)] transition-[opacity,transform] duration-200 ease-snap ${
          open
            ? "pointer-events-auto opacity-100 scale-100"
            : "pointer-events-none opacity-0 scale-[0.97]"
        }`}
      >
        {markdown ? (
          <>
            <button type="button" role="menuitem" className={itemClass} onClick={copyMarkdown}>
              <Glyph icon={Copy01Icon} size={16} className="text-muted" />
              <span>
                {copyState === "copied"
                  ? "Copied"
                  : copyState === "failed"
                    ? "Copy failed"
                    : "Copy as Markdown"}
              </span>
            </button>

            <a href={mdHref} role="menuitem" className={itemClass} target="_blank" rel="noreferrer">
              <Glyph icon={SourceCodeIcon} size={16} className="text-muted" />
              View as Markdown
            </a>

            <a
              href={chatGptHref}
              role="menuitem"
              className={itemClass}
              target="_blank"
              rel="noreferrer"
            >
              <Glyph icon={ChatGptIcon} size={16} className="text-muted" />
              Open in ChatGPT
            </a>

            <a
              href={claudeHref}
              role="menuitem"
              className={itemClass}
              target="_blank"
              rel="noreferrer"
            >
              <Glyph icon={ClaudeIcon} size={16} className="text-muted" />
              Open in Claude
            </a>

            <Separator />
          </>
        ) : null}

        <SwitchRow
          checked={dark}
          onChange={setTheme}
          icon={
            <>
              <span className="dark:hidden">
                <Glyph icon={Moon02Icon} size={16} />
              </span>
              <span className="hidden dark:block">
                <Glyph icon={Sun03Icon} size={16} />
              </span>
            </>
          }
        >
          Dark mode
        </SwitchRow>

        <SwitchRow
          checked={sound}
          onChange={setSoundOn}
          icon={
            sound ? (
              <Glyph icon={VolumeHighIcon} size={16} />
            ) : (
              <Glyph icon={VolumeOffIcon} size={16} />
            )
          }
        >
          Sound effects
        </SwitchRow>

        <Separator />

        <a href="/#examples" role="menuitem" className={itemClass}>
          <Glyph icon={BrowserIcon} size={16} className="text-muted" />
          Live examples
        </a>
        <a
          href="https://github.com/atybdot/glimm-adapters"
          target="_blank"
          rel="noreferrer"
          role="menuitem"
          className={itemClass}
        >
          <Glyph icon={GithubIcon} size={16} className="text-muted" />
          GitHub
        </a>
        <a href="/changelog" role="menuitem" className={itemClass}>
          <Glyph icon={HistoryIcon} size={16} className="text-muted" />
          Changelog
        </a>
      </div>
    </div>
  );
}
