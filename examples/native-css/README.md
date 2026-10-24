# Native CSS glimm

A JavaScript-free version of the sweep for multi-page sites. Two HTML files and
one stylesheet. No build step, no package, no canvas.

```sh
python3 -m http.server 4173
# open http://localhost:4173/
```

## What it does

`@view-transition { navigation: auto }` opts same-origin link navigations into
the browser's cross-document View Transition. The browser snapshots the old
document as `::view-transition-old(root)` and the new one as
`::view-transition-new(root)`, then animates them while the new document loads.

Two masks share one animated custom property, `--glimm-at`, which sweeps from
`-20%` to `120%`:

- the new snapshot is visible behind the edge,
- the old snapshot is visible ahead of it,
- both are transparent in the same 14% slot.

That slot exposes the `::view-transition-image-pair(root)` background, which is
the gradient band. The band is paint, not a shader.

## What it cannot do

This is not a port of the WebGL engine, and it should not be sold as one.

- **No waves, ripples, swell or palette blending.** CSS masks only reveal and
  hide. The engine displaces pixels; CSS cannot.
- **No hold hook.** A cross-document transition starts when the browser starts
  the navigation; there is no midpoint to hold through a slow route. The old
  page stays visible until the new document is ready, which is the closest
  equivalent.
- **No per-link tuning.** The transition is declared once for the document.
  Per-link palettes and directions would need `view-transition-name` and extra
  classes, not a JS option object.
- **Cross-document only.** `@view-transition { navigation: auto }` does not run
  for same-document navigation (a client-side router). For SPAs, call
  `document.startViewTransition()` and use the same pseudo-element CSS, or use
  the WebGL adapter and keep the full engine.
- **No fallback animation.** Browsers without cross-document View Transitions
  navigate normally. That is the intended fallback: a fast page change, not a
  broken overlay.

## Browser support

Cross-document View Transitions are supported in Chromium 126+ and Safari 18.2+.
Firefox support depends on the release; check the current compatibility table
before shipping to a Firefox-heavy audience.

`@property` is required for the animated custom property. It is supported in
Chromium 85+, Safari 16.4+ and Firefox 128+.

The demo in this directory was exercised in Chrome 155: both
`::view-transition-old(root)` and `::view-transition-new(root)` run the
`glimm-at` animation, and the band paint comes from the image pair's gradient.

## Reduced motion

The stylesheet drops the animation under
`@media (prefers-reduced-motion: reduce)`. The browser then performs its own
instant swap. If you want a crossfade instead, replace `animation: none` with a
short opacity animation.

## Using it in a real site

1. Copy `glimm.css` into your site and load it on every page.
2. Make sure navigations are same-origin and not `target="_blank"`.
3. If you use a client-side router, this file does nothing; use the WebGL
   adapter (`glimm-adapters`) or `document.startViewTransition()` with the same
   mask rules.
