/**
 * The changelog, parsed from the package's own `CHANGELOG.md`.
 *
 * The file in `packages/glimm-adapters` is the source of truth: `publish.mjs`
 * writes it at release time, npm ships it, and this page imports the same bytes
 * at build time. Nothing is copied into the site by hand, so the page and the
 * package cannot drift.
 *
 * Expected shape:
 *
 *   ## 0.1.0 (2026-10-20) · Six routes, one engine
 *
 *   One short paragraph.
 *
 *   ### Added
 *   - A change.
 */

import raw from "../../../../packages/glimm-adapters/CHANGELOG.md?raw";

export type ChangeGroup = {
  /** `Added`, `Improved`, `Fixed`, `Performance`, `Internal`, or anything else. */
  kind: string;
  items: string[];
};

export type Release = {
  version: string;
  /** ISO date when the entry has one, otherwise the text as written. */
  date: string;
  title: string | null;
  summary: string | null;
  groups: ChangeGroup[];
};

/** Groups read in this order; unknown headings keep their file order at the end. */
const GROUP_ORDER = ["Added", "Improved", "Fixed", "Performance", "Internal"];

const RELEASE = /^##\s+v?([0-9][^\s(]*)\s+\(([^)]+)\)(?:\s*[·—–-]\s*(.+))?\s*$/;
const GROUP = /^###\s+(.+?)\s*$/;
const BULLET = /^[-*]\s+(.+?)\s*$/;

function sortGroups(groups: ChangeGroup[]): ChangeGroup[] {
  return [...groups].sort((a, b) => {
    const ai = GROUP_ORDER.indexOf(a.kind);
    const bi = GROUP_ORDER.indexOf(b.kind);
    if (ai === -1 && bi === -1) return 0;
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });
}

function parse(text: string): Release[] {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const releases: Release[] = [];

  let release: Release | null = null;
  let group: ChangeGroup | null = null;
  let paragraph: string[] = [];

  const flushParagraph = () => {
    if (release && !group && !release.summary && paragraph.length > 0) {
      release.summary = paragraph.join(" ");
    }
    paragraph = [];
  };

  for (const line of lines) {
    const heading = RELEASE.exec(line);
    if (heading) {
      flushParagraph();
      release = {
        version: heading[1],
        date: heading[2],
        title: heading[3]?.trim() || null,
        summary: null,
        groups: [],
      };
      releases.push(release);
      group = null;
      continue;
    }

    if (!release) continue;

    const groupHeading = GROUP.exec(line);
    if (groupHeading) {
      flushParagraph();
      group = { kind: groupHeading[1], items: [] };
      release.groups.push(group);
      continue;
    }

    const bullet = BULLET.exec(line);
    if (bullet) {
      if (!group) {
        group = { kind: "Changed", items: [] };
        release.groups.push(group);
      }
      group.items.push(bullet[1]);
      continue;
    }

    if (line.trim() === "") {
      flushParagraph();
      continue;
    }

    // A paragraph is the release summary, unless we are inside a group.
    if (!group) paragraph.push(line.trim());
  }

  flushParagraph();

  return releases.map((entry) => ({
    ...entry,
    groups: sortGroups(entry.groups).filter((g) => g.items.length > 0),
  }));
}

export const releases: Release[] = parse(raw);

/** The whole file, for the header menu's copy and `View as Markdown` actions. */
export function changelogMarkdown(): string {
  return `${raw.trim()}\n`;
}

/** `2026-10-20` -> `Oct 20, 2026`; anything else is left alone. */
export function formatDate(date: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return date;
  const [year, month, day] = date.split("-").map(Number);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

/**
 * Escapes a line, then turns `code spans` into `<code>`.
 *
 * The changelog is authored in this repo, but escaping first means a stray
 * angle bracket in a commit subject can never become markup.
 */
export function inlineHtml(text: string): string {
  const escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

  return escaped.replace(
    /`([^`]+)`/g,
    '<code class="rounded-[4px] bg-line-soft px-1 py-0.5 font-mono text-[0.92em] text-ink">$1</code>',
  );
}
