# glimm-adapters

glimm's WebGL sweep transitions, wired into TanStack Router, React Router, SvelteKit, Vue Router, Nuxt and Astro, with a vanilla entry point too.

[glimm](https://glimm.dev) does the rendering. Shaders, palettes, easings and the sweep come from glimm unchanged. glimm-adapters adds the router wiring glimm doesn't ship and re-exports the glimm core and React provider. Every glimm option works the same here, so the [glimm docs](https://glimm.dev#props) apply as written.

## Why this exists

glimm ships a vanilla core, a React provider that works with any React router, and Next.js helpers. TanStack Router, SvelteKit, Vue Router, Nuxt and Astro have no official adapter. This package is one small adapter per router. It doesn't fork the engine or copy shader code.

## Install

```bash
npm install glimm-adapters
```

glimm comes with it. Don't install it separately. Then install the peer your app already uses, if you haven't. The package is ESM-only, and each router has its own import path.

| Router                 | Import                    | Main exports                                              |
| ---------------------- | ------------------------- | --------------------------------------------------------- |
| TanStack Router        | `glimm-adapters/tanstack` | `TransitionLink`, `useTransitionRouter`, `InterceptLinks` |
| Any other React router | `glimm-adapters/react`    | `GlimmProvider`, `useInterceptLinks`                      |
| SvelteKit              | `glimm-adapters/svelte`   | `setupGlimm`                                              |
| Vue Router, Nuxt       | `glimm-adapters/vue`      | `setupGlimmVue`                                           |
| Astro                  | `glimm-adapters/astro`    | `setupGlimmAstro`                                         |
| No router, vanilla JS  | `glimm-adapters/vanilla`  | `setupGlimmVanilla`                                       |

## Use

### TanStack Router

```tsx
import { GlimmProvider, InterceptLinks } from "glimm-adapters/tanstack";

export function Root() {
  return (
    <GlimmProvider palette="prism">
      <InterceptLinks />
      <Outlet />
    </GlimmProvider>
  );
}
```

`InterceptLinks` sweeps every plain `<a>` on the page. For a single link or a programmatic navigation, use the link component and the hook.

```tsx
import { TransitionLink, useTransitionRouter } from "glimm-adapters/tanstack";

<TransitionLink to="/about" sweep={{ palette: "berry" }}>
  About
</TransitionLink>;

const router = useTransitionRouter();
router.push("/dashboard", { palette: "ember" });
```

`useTransitionRouter` also returns `replace`, `back` and `forward`. Add `noTransition` to a `TransitionLink` to skip the sweep for that link.

### Other React routers

Pass your router's navigate function. The hook wraps it.

```tsx
import { GlimmProvider, useInterceptLinks } from "glimm-adapters/react";
import { useNavigate } from "react-router-dom";

function AutoLinks() {
  const navigate = useNavigate();
  useInterceptLinks((href) => navigate(href));
  return null;
}
```

Render `AutoLinks` inside `GlimmProvider`, which must sit inside your router.

### SvelteKit

Pass `goto` yourself. The package never imports `$app/navigation`.

```svelte
<script lang="ts">
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import { setupGlimm } from "glimm-adapters/svelte";

  let canvas: HTMLCanvasElement;
  onMount(() => {
    const glimm = setupGlimm({ canvas, goto });
    return () => glimm.destroy();
  });
</script>

<canvas bind:this={canvas} />
```

`setupGlimm` returns `{ navigate, destroy, controller }`. Call `navigate(href, overrides)` for a programmatic sweep. It runs one sweep by default; pass `mode: "covered"` for a route that can be slow.

### Vue and Nuxt

```ts
import { setupGlimmVue } from "glimm-adapters/vue";

const glimm = setupGlimmVue({ canvas: canvasEl.value!, router });
onUnmounted(() => glimm.destroy());
```

The router only needs `push`, and optionally `replace` and `back`, so vue-router and Nuxt's router both fit. The return value has `push`, `replace`, `destroy` and `controller`. It runs one sweep by default; pass `mode: "covered"` for a route that can be slow.

### Astro

Astro needs View Transitions, so add `<ClientRouter />` to your layout. Put `transition:persist` on the canvas so the WebGL context survives page swaps, and cancel Astro's own crossfade with `transition:animate="none"`; otherwise the browser animation runs under the reveal and hides the first half of the sweep.

```astro
---
import { ClientRouter } from "astro:transitions";
---
<html transition:animate="none">
  <head><ClientRouter fallback="swap" /></head>
  <body>
    <canvas id="glimm" transition:persist="glimm-canvas"></canvas>
    <script>
      import { navigate } from "astro:transitions/client";
      import { setupGlimmAstro } from "glimm-adapters/astro";
      const canvas = document.querySelector("#glimm") as HTMLCanvasElement;
      setupGlimmAstro({ canvas, navigate, mode: "reveal" });
    </script>
  </body>
</html>
```

Calling `setupGlimmAstro` again is safe. The adapter reuses the existing instance and re-hosts the canvas after a swap, so you don't need to guard the call yourself. If you leave out `navigate`, it covers the screen, starts the location change from the hold, and stays covered until the browser unloads.

`mode` decides how much of the navigation the band covers:

- `"reveal"` (default) runs one sweep. The band starts over the old page, the route commits at the midpoint, and the new page is painted by the time the band leaves. No curtain, no second pass.
- `"covered"` runs cover → hold → reveal. The curtain hides the screen while the route commits, then the band sweeps the new page in. Use it when the route can be slow enough that the old page would otherwise sit under a finished sweep.

A multi-page navigation without `navigate` always uses the covered path, since there is no new document to reveal in the same sweep.

If you leave the native animation on, the adapter waits for the `::view-transition-*` animations to finish before revealing. The sweep is late rather than invisible, but turning the animation off is still the right setup.

`setupGlimmAstro` also returns `sweep(commit, options)`. Use it to run a sweep around a theme change, a filter update, or any other DOM change. In reveal mode the commit runs inside the single sweep; in covered mode it runs at the hold, so the reveal plays over the changed page.

### Vanilla JS

`setupGlimmVanilla` is the framework-free entry. Pass your router's navigation function. The adapter commits at the sweep's midpoint and waits for the new view to paint before the band leaves.

```ts
import { setupGlimmVanilla } from "glimm-adapters/vanilla";
import { router } from "./router";

const glimm = setupGlimmVanilla({
  canvas: document.querySelector("#glimm")!,
  navigate: (href) => router.push(href),
});

// Any commit can ride the same sweep.
await glimm.sweep(() => applyTheme("dark")).done;
```

Pass `mode: "covered"` when the route can be slow enough that one band crossing is not enough time.

Omit `navigate` for a plain multi-page site: the adapter covers the screen, starts the location change from the hold, and lets the browser unload. The next page loads normally. For a real multi-page reveal without JavaScript, use the native CSS example in `examples/native-css`.

The entry also exports `navigate`, `sweep`, `destroy` and `controller`. Repeated setup on the same canvas with the same options is a no-op, so an inline script that re-runs after a swap will not double-bind.

## How it works

Each adapter listens for same-origin link clicks and plays a sweep. Vanilla, Svelte, Vue and Astro commit the route inside one pass by default: the band crosses the old page, the router commits at the midpoint, the adapter waits for the new view to paint, and the band finishes over it. No curtain, no second pass. React and TanStack delegate to glimm's provider, which uses the View Transition API when the browser supports it. Those entries add the router wiring, not a second rendering engine.

`mode: "covered"` is the fallback for slow routes and for multi-page vanilla navigation without `navigate`:

1. **Cover.** The band sweeps across the old page.
2. **Hold.** A solid curtain, filled with the page's background color, takes over and the WebGL layer goes transparent. The router commits the new route. The adapter waits for the commit and two animation frames, so the new page is painted before anything is revealed.
3. **Reveal.** The band sweeps across the new page, and the curtain drops at the midpoint.

Astro and vanilla also wait for any running `::view-transition-*` animations before the reveal. Astro's `navigate()` resolves when the DOM is updated, not when its crossfade ends, so a naive reveal would play the first half of the sweep underneath the native animation. Waiting makes the adapter correct even when the host forgets to disable it.

glimm's own `playSweep` can't cover a slow commit by itself. Its band has fully left the screen by progress 1, so holding there shows the old page, and the fade-out plays over a band that is already gone. The curtain fills that gap. It lives in `covered.ts` and is exported as `playCoveredSweep`.

In covered mode, if a route takes longer than 8 seconds to commit, the adapter logs a warning and drops the curtain. If the commit throws, it logs the error and drops the curtain. A second click during a sweep interrupts the first.

## Links that skip the sweep

These navigate immediately.

- Clicks with a modifier key, and any non-left button
- External URLs and links with `target` other than `_self`
- Same-page hash links
- Links with a `download` attribute or no `href`
- Anything marked `data-glimm-skip`
- Events an earlier capture-phase handler already called `preventDefault()` on

To change the rules, pass `shouldIntercept` in the intercept options. It replaces the default check.

## Fallbacks

- **No WebGL.** `createShader` returns `null` and navigation runs at once.
- **Server rendering.** Every entry point does nothing without `window` and `document`.
- **Reduced motion.** With `prefers-reduced-motion: reduce`, navigation is instant. Pass `reducedMotion: "sweep"` to play the sweep anyway.

## Options

These are glimm options. Set them as provider defaults, or override them for one navigation, as in `sweep={{ palette: "berry", direction: "rtl" }}`. Svelte, Vue and Astro take the same values through `defaults` and per-call options.

| Option       | Default | What it does                                                                                           |
| ------------ | ------- | ------------------------------------------------------------------------------------------------------ |
| palette      | prism   | Band colors. `prism`, `berry`, `lagoon`, `citrus`, `azure`, `ember`, or a custom a b c d set           |
| direction    | ltr     | Sweep side. `ltr`, `rtl`, `ttb`, `btt`                                                                 |
| easing       | ease    | Band pacing. Ten built-ins including `linear`, `snap`, `back` and `easeOutQuart`, or your own function |
| sweepMs      | 1100    | Time for the band to cross                                                                             |
| outroMs      | 220     | Fade time after the crossing                                                                           |
| midpoint     | 0.56    | Point in the sweep where navigation runs. Clamped to 0.1 to 0.9                                        |
| peakAlpha    | 1       | Caps band opacity, 0 to 1.5                                                                            |
| brightness   | 1       | Scales band RGB. Try 0.85 on dark backgrounds                                                          |
| bandTight    | 14      | Band focus. Lower values give a wider, softer band                                                     |
| waveAmount   | 0       | Edge wobble, 0 to 2. At 0 the edge is straight                                                         |
| rippleAmount | 1       | Vertical ripple texture, 0 to 2                                                                        |
| waveSpeed    | 1       | Shader animation speed, 0 to 3                                                                         |

## Repo layout

```
packages/glimm-adapters/
  src/
    index.ts       glimm core re-export, interceptLinks, playCoveredSweep, createCurtain
    intercept.ts   delegated click interceptor (internal)
    covered.ts     cover, hold, reveal sweep and curtain (internal)
    vanilla.ts     shared runner plus setupGlimmVanilla
    setup-key.ts   per-canvas instance dedupe (internal)
    react.tsx      GlimmProvider re-export, useInterceptLinks
    tanstack.tsx   TransitionLink, useTransitionRouter, InterceptLinks
    svelte.ts      setupGlimm
    vue.ts         setupGlimmVue
    astro.ts       setupGlimmAstro
  tests/
apps/web/          demo app
examples/frameworks/  one runnable app per adapter (React, Vue, Svelte, TanStack, Astro, vanilla); built and served at /example/<framework> in prod
examples/native-css/  a JavaScript-free cross-document version
```

The package is built with tsup. `index`, `react`, `tanstack`, `svelte`, `vue`, `astro` and `vanilla` are the public entries; `intercept.ts`, `covered.ts`, `vanilla.ts` and `setup-key.ts` are internal modules. Router libraries are optional peer dependencies.

## Framework playground

`examples/frameworks` has one small app per adapter, all rendering the same two pages:

```bash
pnpm install
pnpm dev:examples
```

| App      | Adapter                   | Port |
| -------- | ------------------------- | ---- |
| vanilla  | `glimm-adapters/vanilla`  | 4601 |
| react    | `glimm-adapters/react`    | 4602 |
| vue      | `glimm-adapters/vue`      | 4603 |
| svelte   | `glimm-adapters/svelte`   | 4604 |
| tanstack | `glimm-adapters/tanstack` | 4605 |
| astro    | `glimm-adapters/astro`    | 4606 |

See `examples/frameworks/README.md` for what to look for and how to run one app at a time.

The example apps build into the docs site under `/example/<framework>` (for example `/example/svelte`, `/example/vue`, `/example/astro`) and ship in the same Cloudflare Worker as the rest of the site. The example builds still assume the site root, so deep links and asset URLs need a base path before the pages work end to end.

## Demo app

`apps/web` is the docs site. It runs Astro with Tailwind, React (compiler on), astro-themes dark mode, astro-seo, and a sitemap. Local dev goes through portless:

```bash
pnpm dev   # https://glimm-adapters.localhost
```

It deploys to Cloudflare Workers through `@astrojs/cloudflare`, configured with `apps/web/cloudflare.config.ts` and the `cf` CLI. The framework example apps are mounted under `/example/<framework>` on the same worker (see below).

```bash
pnpm --filter web build
pnpm --filter web deploy
```

To also ship the framework example apps under `/example/<framework>` on the same worker, stage them first:

```bash
pnpm build:web:full   # build:lib + build:examples + stage:examples + web build
pnpm deploy:web:full  # same, then deploy
```

CI (`.github/workflows/deploy-web.yml`) runs the same pipeline on push to `main` (production deploy) and on pull requests (a preview worker via `cf previews deploy`). It needs `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` secrets.
The build renders the two share cards with Takumi and writes them to `public/og.png` and `public/og-changelog.png`. They are static files, so requests never render anything. To refresh them without a full build:

```bash
pnpm --filter web og
```

## Credit

The engine is [glimm](https://glimm.dev) by [Noman Ijaz](https://x.com/nomandsign), MIT.  
glimm-adapters is built against glimm 0.3.1. The adapters here are original.

## Release

`scripts/publish.mjs` owns the version, the changelog and the `release-*` tag. It refuses to release from any branch other than the default branch, because `release.yml` only publishes tags reachable from that branch.

```bash
pnpm publish:release -- patch   # 0.1.0 -> 0.1.1
```

Write `release-notes/<version>.md` first to curate the entry; otherwise the script groups conventional commits since the last release tag. The script runs the full check suite, writes and format-checks the version and changelog, commits, tags, and pushes. CI publishes to npm and creates the GitHub release from the changelog entry, so the release appears only after the guard passes.

- Pre-commit: lefthook auto-fixes format/lint on staged files, fails on the rest.
- CI (`ci.yml`): format check, lint, typecheck, test, build on push/PR.
- Publish (`release.yml`): the same checks, plus `pnpm publish`, only on manual dispatch or a `release-*` tag. Needs `NPM_TOKEN`. Prerelease versions publish under the `next` dist-tag.
