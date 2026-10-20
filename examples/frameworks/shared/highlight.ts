// Tiny, dependency-free syntax highlighter for the demo snippets. It mirrors
// the docs site's highlighter, plus just enough mixed-markup handling for the
// Svelte, Vue and Astro examples. The snippets are authored by hand, so this
// only needs to cover them, not arbitrary code.

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
  /(?<comment>\/\/[^\n]*|\/\*[\s\S]*?\*\/)|(?<str>'(?:[^'\\\n]|\\.)*'|"(?:[^"\\\n]|\\.)*"|`(?:[^`\\]|\\.)*`)|(?<jsx>(?<![\w$])<\/?[A-Z][\w.]*(?:\s+[A-Za-z_:][\w:.-]*(?:=(?:"[^"]*"|'[^']*'|\{[^}]*\}))?)*\s*\/?>)|(?<num>\b\d[\d_]*(?:\.\d+)?\b)|(?<ident>\b[A-Za-z_$][\w$]*\b)|(?<pun>[{}()[\];,.:=<>+\-*/%!?&|~^]+)/g;

const JSX_ATTR = /([A-Za-z_:][\w:.-]*)(=)("[^"]*"|'[^']*'|\{[^}]*\})?/g;

function highlightJsxAttrs(src: string): string {
  let out = "";
  let last = 0;
  for (const m of src.matchAll(JSX_ATTR)) {
    const index = m.index ?? 0;
    out += esc(src.slice(last, index));
    out += raw("t-attr", esc(m[1] ?? ""));
    if (m[2]) out += raw("t-pun", esc(m[2]));
    if (m[3]) out += raw("t-str", esc(m[3]));
    last = index + m[0].length;
  }
  return out + esc(src.slice(last));
}

/** One JSX tag: punctuation, a tag name, then attributes. */
function highlightJsxTag(src: string): string {
  const m = /^(<\/?)([A-Z][\w.]*)([\s\S]*?)(\/?>)$/.exec(src);
  if (!m) return esc(src);
  return (
    raw("t-pun", esc(m[1] ?? "")) +
    raw("t-tag", esc(m[2] ?? "")) +
    highlightJsxAttrs(m[3] ?? "") +
    raw("t-pun", esc(m[4] ?? ""))
  );
}

function highlightJs(src: string): string {
  let out = "";
  let last = 0;
  let m: RegExpExecArray | null;
  JS_TOKEN.lastIndex = 0;
  while ((m = JS_TOKEN.exec(src))) {
    out += esc(src.slice(last, m.index));
    const token = m[0];
    const groups = m.groups ?? {};
    const after = src.slice(m.index + token.length);
    if (groups.comment) out += tag("t-com", token);
    else if (groups.str) out += tag("t-str", token);
    else if (groups.jsx) out += highlightJsxTag(token);
    else if (groups.num) out += tag("t-num", token);
    else if (groups.ident) {
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

/**
 * Markup with embedded script blocks (and, for Astro, a frontmatter block).
 * The surrounding markup goes through the HTML tokenizer; the script bodies go
 * through the JS one, so a Svelte or Vue setup block is not left grey.
 */
function highlightMixed(src: string): string {
  let out = "";
  let start = 0;

  if (src.startsWith("---\n")) {
    const end = src.indexOf("\n---", 4);
    if (end !== -1) {
      out += raw("t-pun", "---") + "\n";
      out += highlightJs(src.slice(4, end + 1));
      out += raw("t-pun", "---");
      start = end + 4;
    }
  }

  const SCRIPT = /(<script[^>]*>)([\s\S]*?)(<\/script>)/g;
  SCRIPT.lastIndex = start;
  let last = start;
  let match: RegExpExecArray | null;

  while ((match = SCRIPT.exec(src))) {
    out += highlightHtml(src.slice(last, match.index));
    out += highlightHtml(match[1] ?? "");
    out += highlightJs(match[2] ?? "");
    out += highlightHtml(match[3] ?? "");
    last = SCRIPT.lastIndex;
  }

  return out + highlightHtml(src.slice(last));
}

export type Lang = "ts" | "tsx" | "js" | "html" | "astro" | "css" | "svelte" | "vue" | "text";

/** Returns highlighted, HTML-escaped markup for a code figure. */
export function highlight(code: string, lang: Lang = "text"): string {
  switch (lang) {
    case "ts":
    case "tsx":
    case "js":
      return highlightJs(code);
    case "html":
      return highlightHtml(code);
    case "astro":
    case "svelte":
    case "vue":
      return highlightMixed(code);
    case "css":
      return highlightCss(code);
    default:
      return esc(code);
  }
}
