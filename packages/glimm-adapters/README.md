# glimm-adapters

Router adapters for glimm's WebGL sweep page transitions. One engine, seven entry points.

glimm owns the WebGL: shaders, palettes, easings, the sweep. glimm-adapters reuses that engine as-is and adds the router wiring glimm does not ship. It re-exports the glimm core and React provider, so every glimm prop and sweep option works as documented at https://glimm.dev#props.

## Why this exists

glimm ships a vanilla core, a React provider that works with any React router, and a Next-only helper set. TanStack Router, SvelteKit, Vue Router, Nuxt and Astro have no official adapter. This package fills that gap with one thin adapter per router. No engine fork, no copied shaders.

## Install

```bash
npm install glimm-adapters
```

That is all. glimm installs automatically as a dependency of glimm-adapters. Do not install it separately. Then add only the peer your app needs, like react, @tanstack/react-router, svelte, vue with vue-router, or astro.

## Entry points

| Import                  | Use for                                                                 |
| ----------------------- | ----------------------------------------------------------------------- |
| glimm-adapters          | glimm core, interceptLinks, playCoveredSweep, createCurtain             |
| glimm-adapters/react    | GlimmProvider, useGlimm, useInterceptLinks for any React router         |
| glimm-adapters/tanstack | TransitionLink, useTransitionRouter, InterceptLinks for TanStack Router |
| glimm-adapters/svelte   | setupGlimm for SvelteKit                                                |
| glimm-adapters/vue      | setupGlimmVue for Vue Router and Nuxt                                   |
| glimm-adapters/astro    | setupGlimmAstro for Astro                                               |
| glimm-adapters/vanilla  | setupGlimmVanilla for any router, or plain multi-page navigation        |

## How it works

Each adapter intercepts same-origin link clicks and plays a sweep. Vanilla, Svelte, Vue and Astro commit the route inside one pass by default: the band crosses the old page, the router commits at the midpoint, the adapter waits for the new view to paint, and the band finishes over it. No curtain, no second pass.

Pass `mode: "covered"` for a slow route. Covered mode plays cover → hold → reveal: the screen stays hidden while the router commits, then the band sweeps the new page in. Multi-page vanilla navigation without `navigate` always uses it. React and TanStack delegate to glimm's provider, which uses the View Transition API when available; those entries add router wiring, not a second engine.

Links that skip the sweep navigate instantly. That covers modifier clicks, right clicks, external URLs, same-page hashes, download links, target blank, and anything marked with `data-glimm-skip`.

No WebGL falls back to plain navigation. Server renders no-op. Reduced motion defaults to instant navigation unless you pass the sweep variant.

## Use

TanStack Router.

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

```tsx
import { TransitionLink, useTransitionRouter } from "glimm-adapters/tanstack";

<TransitionLink to="/about" sweep={{ palette: "berry" }}>
  About
</TransitionLink>;

const router = useTransitionRouter();
router.push("/dashboard", { palette: "ember" });
```

Any other React router. Pass your own navigate function.

```tsx
import { GlimmProvider, useInterceptLinks } from "glimm-adapters/react";
import { useNavigate } from "react-router-dom";

function AutoLinks() {
  const navigate = useNavigate();
  useInterceptLinks((href) => navigate(href));
  return null;
}
```

SvelteKit.

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

`setupGlimm` runs one sweep by default. Pass `mode: "covered"` for a slow route.

Vue.

```ts
import { setupGlimmVue } from "glimm-adapters/vue";

const glimm = setupGlimmVue({ canvas: canvasEl.value!, router });
onUnmounted(() => glimm.destroy());
```

`setupGlimmVue` runs one sweep by default. Pass `mode: "covered"` for a slow route.

Astro.

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

`transition:animate="none"` cancels Astro's crossfade so the reveal owns the transition. If you leave it on, the adapter waits for the native `::view-transition-*` animations before revealing, which makes the sweep late instead of invisible.

`mode: "reveal"` (the default) runs one sweep: the band starts over the old page, the route commits at the midpoint, and the new page is painted by the time the band leaves. No curtain, no second pass. `mode: "covered"` runs cover → hold → reveal and hides a slow route behind the curtain.

`setupGlimmAstro` also returns `sweep(commit, options)` for sweeps around theme changes or other DOM updates that are not navigations. Repeated calls on the same persisted canvas reuse the live instance.

Vanilla.

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

`setupGlimmVanilla` commits at the sweep's midpoint and waits for the new view to paint before the band leaves. Pass `mode: "covered"` for a slow route. Omit `navigate` for plain multi-page navigation: the adapter covers, starts the location change, and lets the browser unload. The package also includes `examples/native-css`, a JavaScript-free cross-document version built on `@view-transition` and CSS masks.

## Options

These are glimm options. Pass them as provider defaults or per-navigation overrides. Defaults shown.

| Option       | Default | What it does                                                                          |
| ------------ | ------- | ------------------------------------------------------------------------------------- |
| palette      | prism   | Band colors. prism, berry, lagoon, citrus, azure, ember, or a custom a b c d set      |
| direction    | ltr     | Sweep side. ltr, rtl, ttb, btt                                                        |
| easing       | ease    | Band pacing. 10 built-ins like linear, snap, back, easeOutQuart, or your own function |
| sweepMs      | 1100    | How long the band takes to cross                                                      |
| outroMs      | 220     | Fade time after the crossing                                                          |
| midpoint     | 0.56    | Point in the sweep where navigation runs                                              |
| peakAlpha    | 1       | Caps band opacity, 0 to 1.5                                                           |
| brightness   | 1       | Scales band RGB. Try 0.85 on dark backgrounds                                         |
| bandTight    | 14      | Band focus. Lower reads wider and softer                                              |
| waveAmount   | 0       | Edge wobble, 0 to 2. 0 keeps a straight edge                                          |
| rippleAmount | 1       | Vertical ripple texture, 0 to 2                                                       |
| waveSpeed    | 1       | Shader motion speed, 0 to 3                                                           |

Palettes and easings resolve by name. `sweep={{ palette: "berry", direction: "rtl" }}` overrides the provider for one navigation. Svelte, Vue, vanilla and Astro take the same shape through `defaults` and per-call options. The DOM adapters also accept `mode: "reveal" | "covered"`.

## Credit

Engine by [Noman Ijaz](https://x.com/nomandsign) via [glimm](https://glimm.dev), MIT. Source at [github.com/nomanjack/glimm](https://github.com/nomanjack/glimm). Adapters here are original.
