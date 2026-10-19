// Tiny, dependency-free syntax highlighter for the code figures on the
// marketing pages. It runs in Astro frontmatter, so the markup it returns is
// static and ships with the page. It only needs to cover the handful of
// snippets we author by hand, not arbitrary code.

const KEYWORDS = new Set([
  "import",
  "from",
  "export",
  "default",
  "const",
  "let",
  "var",
  "function",
  "return",
  "if",
  "else",
  "for",
  "while",
  "do",
  "switch",
  "case",
  "break",
  "continue",
  "new",
  "await",
  "async",
  "type",
  "interface",
  "as",
  "of",
  "in",
  "class",
  "extends",
  "implements",
  "try",
  "catch",
  "finally",
  "throw",
  "typeof",
  "instanceof",
  "void",
  "yield",
  "delete",
  "this",
  "super",
  "null",
  "undefined",
  "true",
  "false",
  "get",
  "set",
]);

const TYPES = new Set([
  "Direction",
  "EasingName",
  "PaletteName",
  "Palette",
  "SweepOptions",
  "SweepHandle",
  "ShaderController",
  "HTMLCanvasElement",
  "HTMLInputElement",
  "HTMLAnchorElement",
  "AbortSignal",
  "Element",
]);

const esc = (s: string): string =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Wrap text, escaping it first. */
const tag = (cls: string, text: string): string => `<span class="${cls}">${esc(text)}</span>`;

/** Wrap text that is already escaped. */
const raw = (cls: string, text: string): string => `<span class="${cls}">${text}</span>`;

const JS_TOKEN =
  /(\/\/[^\n]*|\/\*[\s\S]*?\*\/)|('(?:[^'\\\n]|\\.)*'|"(?:[^"\\\n]|\\.)*"|`(?:[^`\\]|\\.)*`)|\b(\d[\d_]*(?:\.\d+)?)\b|\b([A-Za-z_$][\w$]*)\b|([{}()[\];,.:=<>+\-*/%!?&|~^]+)/g;

function highlightJs(src: string): string {
  let out = "";
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = JS_TOKEN.exec(src))) {
    out += esc(src.slice(last, m.index));
    const token = m[0];
    const after = src.slice(m.index + token.length);
    if (m[1]) out += tag("t-com", token);
    else if (m[2]) out += tag("t-str", token);
    else if (m[3]) out += tag("t-num", token);
    else if (m[4]) {
      if (KEYWORDS.has(token)) out += tag("t-kw", token);
      else if (TYPES.has(token)) out += tag("t-typ", token);
      else if (/^\s*[(<]/.test(after)) out += tag("t-fn", token);
      else out += esc(token);
    } else out += tag("t-pun", token);
    last = m.index + token.length;
  }
  return out + esc(src.slice(last));
}

const ATTR_TOKEN =
  /([A-Za-z_:][\w:.-]*)(=)("[^"]*"|'[^']*')|("[^"]*"|'[^']*')|([A-Za-z_:][\w:.-]*)/g;

function highlightAttrs(src: string): string {
  return esc(src).replace(ATTR_TOKEN, (full, name, eq, value, bare, lone) => {
    if (name) return raw("t-attr", name) + raw("t-pun", eq) + raw("t-str", value);
    if (bare) return raw("t-str", bare);
    if (lone) return raw("t-attr", lone);
    return full;
  });
}

const HTML_TOKEN = /(<!--[\s\S]*?-->)|(<\/?)([A-Za-z][\w-]*)([^>]*?)(\/?>)/g;

function highlightHtml(src: string): string {
  let out = "";
  let last = 0;
  for (const match of src.matchAll(HTML_TOKEN)) {
    const index = match.index ?? 0;
    // Text between tags is content, not markup. Escape it, or an author's
    // `a < b` (and anything worse) lands in the page as raw HTML.
    out += esc(src.slice(last, index));
    const [full, comment, open, name, rest, close] = match;
    if (comment) {
      out += tag("t-com", comment);
    } else if (open) {
      out +=
        raw("t-pun", esc(open)) +
        raw("t-tag", esc(name ?? "")) +
        highlightAttrs(rest ?? "") +
        raw("t-pun", esc(close ?? ""));
    } else {
      out += esc(full ?? "");
    }
    last = index + (full?.length ?? 0);
  }
  return out + esc(src.slice(last));
}

const CSS_TOKEN = /(\/\*[\s\S]*?\*\/)|(@[\w-]+)|([.#][\w-]+)|([a-z][\w-]*)(?=\s*:)|(:[^;{}]+)/g;

function highlightCss(src: string): string {
  return esc(src).replace(CSS_TOKEN, (full, comment, at, selector, prop, value) => {
    if (comment) return raw("t-com", comment);
    if (at) return raw("t-kw", at);
    if (selector) return raw("t-tag", selector);
    if (prop) return raw("t-attr", prop);
    if (value) return raw("t-str", value);
    return full;
  });
}

export type Lang = "ts" | "tsx" | "js" | "html" | "astro" | "css" | "text";

/** Returns highlighted, HTML-escaped markup for a code figure. */
export function highlight(code: string, lang: Lang = "text"): string {
  switch (lang) {
    case "ts":
    case "tsx":
    case "js":
      return highlightJs(code);
    case "html":
    case "astro":
      return highlightHtml(code);
    case "css":
      return highlightCss(code);
    default:
      return esc(code);
  }
}
