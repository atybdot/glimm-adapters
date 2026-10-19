/**
 * Page content shared by the landing page and its markdown mirror.
 *
 * Both the page and `/index.md` render from here, so the prose, the code
 * samples and the FAQ answers cannot drift apart.
 */

export const prompts = [
  "Add glimm-adapters to my app and sweep every internal link.",
  "Use the berry palette on the pricing link, prism everywhere else.",
  "The band holds too long after the page swaps. Tighten the reveal.",
].join("\n");

export const skipCode = [
  '<a href="/pricing" data-glimm-skip>Pricing</a>',
  '<a href="/docs" target="_blank">Docs</a>',
  '<a href="#faq">FAQ</a>',
].join("\n");

export const overrideCode = [
  "import { TransitionLink } from 'glimm-adapters/tanstack'",
  "",
  "<TransitionLink to='/about' sweep={{ palette: 'berry', direction: 'rtl' }}>",
  "  About",
  "</TransitionLink>",
].join("\n");

export type Step = { n: string; title: string; note: string };

export const steps: Step[] = [
  { n: "01", title: "Cover", note: "The band paints over the view you are leaving." },
  { n: "02", title: "Commit", note: "At the midpoint your router runs the navigation." },
  { n: "03", title: "Paint", note: "The next view renders underneath the band." },
  { n: "04", title: "Reveal", note: "Two frames later the band lifts away." },
];

export const triggers = [
  {
    id: "intercept",
    name: "<InterceptLinks />",
    note: "Covers every internal link. No markup changes.",
    label: "src/routes/__root.tsx",
    lang: "tsx" as const,
    file: "ts" as const,
    code: [
      "import { InterceptLinks } from 'glimm-adapters/tanstack'",
      "",
      "export function Root() {",
      "  return (",
      "    <>",
      "      <InterceptLinks />",
      "      <Outlet />",
      "    </>",
      "  )",
      "}",
    ].join("\n"),
  },
  {
    id: "link",
    name: "<TransitionLink>",
    note: "One link, with its own options.",
    label: "nav.tsx",
    lang: "tsx" as const,
    file: "ts" as const,
    code: [
      "import { TransitionLink } from 'glimm-adapters/tanstack'",
      "",
      "<TransitionLink to='/pricing' sweep={{ palette: 'berry', direction: 'rtl' }}>",
      "  Pricing",
      "</TransitionLink>",
    ].join("\n"),
  },
  {
    id: "router",
    name: "useTransitionRouter()",
    note: "Sweep from a handler of your own.",
    label: "CheckoutButton.tsx",
    lang: "tsx" as const,
    file: "ts" as const,
    code: [
      "import { useTransitionRouter } from 'glimm-adapters/tanstack'",
      "",
      "const router = useTransitionRouter()",
      "",
      "<button onClick={() => router.push('/checkout', { palette: 'ember' })}>",
      "  Checkout",
      "</button>",
    ].join("\n"),
  },
];

export const api: [string, string][] = [
  [
    "createShader({ canvas })",
    "Builds the controller that owns one canvas. Every option is a live setter, so you can retune a sweep while it runs.",
  ],
  [
    "playSweep(ctrl, opts?)",
    "Runs one sweep from where the controller is now. Returns a handle with midpoint, done and cancel.",
  ],
  [
    "createCurtain(host)",
    "The opaque plate that covers the page while the next view paints under it.",
  ],
  [
    "playCoveredSweep(ctrl, curtain, commit)",
    "Covers the page, runs your commit and waits for the next paint, then reveals.",
  ],
  [
    "interceptLinks(sweep, navigate)",
    "One click listener on the document. Returns a cleanup for your unmount.",
  ],
  [
    "ensureCurtainHost(canvas)",
    "Moves the canvas into a fixed overlay that also owns the curtain.",
  ],
  ["nextPaint(signal?)", "Resolves after two frames, once the new view has painted."],
];

export const fits: [string, boolean][] = [
  ["Moves between clearly different sections", true],
  ["Checkout, onboarding or review, where the old view is finished", true],
  ["Publishing and submitting, where a short beat helps the result land", true],
  ["A slow route that needs something to look at while it loads", true],
  ["Everyday navigation between neighbouring pages", false],
  ["Hover, focus, tooltips and menus", false],
  ["Pagination, or checking off rows in a list", false],
  ["Loading states. The band marks a moment, it does not spin", false],
];

export const faqs: { q: string; a: string }[] = [
  {
    q: "Does it work without a framework?",
    a: "Yes. createShader and playSweep are plain DOM APIs, and every adapter is a few lines around them. If your router hands you a navigate function, you can wire the sweep to it.",
  },
  {
    q: "What about reduced motion?",
    a: "The sweep honours prefers-reduced-motion. With it on, navigation happens straight away with no band, and the demo above stops looping.",
  },
  {
    q: "Will it fight my router?",
    a: "No. The adapter catches the click, plays the band and calls your navigate at the midpoint, once the band covers the screen. Your router keeps history, scroll position and state.",
  },
  {
    q: "Can I use my own colours?",
    a: "Yes. A palette is a cosine fit, color(t) = a + b·cos(2π·(c·t + d)). Pass one of the six presets, or four RGB triplets and the band follows your brand.",
  },
  {
    q: "How big is it?",
    a: "Under 10 KB, no dependencies. The band is one shader on one canvas, created the first time a sweep runs.",
  },
];
