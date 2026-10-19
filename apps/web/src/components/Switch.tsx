"use client";

/**
 * The site's one switch.
 *
 * Two exports, one look: `Switch` is the standalone control for a card,
 * `SwitchVisual` is the same track for a row that already owns its button
 * (a menu item cannot nest a button). Keep the geometry in this file so a
 * toggle in a menu and a toggle in a demo never drift apart.
 */

const track =
  "relative inline-block h-[20px] w-[34px] flex-none rounded-full transition-colors duration-200 ease-snap";

const knob =
  "absolute left-[3px] top-[3px] size-3.5 rounded-full bg-surface shadow-[0_1px_2px_rgba(0,0,0,0.25)] transition-transform duration-200 ease-snap";

/** The track and knob, with no interaction of its own. */
export function SwitchVisual({ checked }: { checked: boolean }) {
  return (
    <span aria-hidden="true" className={`${track} ${checked ? "bg-accent" : "bg-line"}`}>
      <span className={`${knob} ${checked ? "translate-x-3.5" : "translate-x-0"}`} />
    </span>
  );
}

type Props = {
  checked: boolean;
  onChange: (next: boolean) => void;
  /** Accessible name. The switch carries no visible text. */
  label: string;
};

/** A standalone switch. The state change is the caller's job. */
export default function Switch({ checked, onChange, label }: Props) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className="inline-flex flex-none items-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-accent-soft"
    >
      <SwitchVisual checked={checked} />
    </button>
  );
}
