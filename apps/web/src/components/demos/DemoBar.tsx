import type { ReactNode } from "react";

/**
 * The chrome each demo mock wears: a file or place on the left, a state chip on
 * the right. Keeping it in one place means the four demos read as the same app
 * in four moods, not four unrelated screenshots.
 */
export default function DemoBar({ left, right }: { left: ReactNode; right?: ReactNode }) {
  return (
    <header className="flex h-10 flex-none items-center gap-3 border-b border-line-soft px-4">
      <span className="font-mono text-[11.5px] text-faint">{left}</span>
      {right ? <div className="ml-auto flex items-center gap-2">{right}</div> : null}
    </header>
  );
}
