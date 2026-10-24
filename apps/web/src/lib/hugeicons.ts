/**
 * HugeIcons ship as data, not as components: one icon is an array of
 * `[tag, attrs]` pairs. Astro can render that directly, so a glyph costs no
 * React runtime and lands in the server-rendered HTML. This module turns one
 * icon into an SVG string; `Icon.astro` wraps it for markup use.
 *
 * The source uses camelCase SVG attribute names (`strokeWidth`, `fillRule`).
 * Browsers only honour the hyphenated form in HTML, so every name is
 * converted on the way out.
 */
/* The package keeps `IconSvgObject` internal to its own declaration files, so
   the shape is restated here rather than imported from a private subpath. */
export type HugeIcon =
  | [string, { [key: string]: string | number }][]
  | readonly (readonly [string, { readonly [key: string]: string | number }])[];

type RenderOptions = {
  size?: number | string;
  /** Overrides the source stroke on stroke-based icons. */
  strokeWidth?: number | string;
  class?: string;
};

const UPPER = /[A-Z]/g;

function attrName(name: string): string {
  return name.replace(UPPER, (char) => `-${char.toLowerCase()}`);
}

function attrValue(value: string | number): string {
  return String(value).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}

export function renderIcon(icon: HugeIcon, options: RenderOptions = {}): string {
  const { size = 16, strokeWidth, class: className } = options;

  const body = icon
    .map(([tag, attrs]) => {
      const pairs: string[] = [];
      for (const [key, value] of Object.entries(attrs)) {
        if (key === "key") continue;
        if (key === "strokeWidth" && strokeWidth !== undefined) {
          pairs.push(`stroke-width="${attrValue(strokeWidth)}"`);
          continue;
        }
        pairs.push(`${attrName(key)}="${attrValue(value)}"`);
      }
      return `<${tag} ${pairs.join(" ")}/>`;
    })
    .join("");

  const cls = className ? ` class="${attrValue(className)}"` : "";
  const dim = attrValue(size);

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="${dim}" height="${dim}" fill="none" aria-hidden="true"${cls}>${body}</svg>`;
}
