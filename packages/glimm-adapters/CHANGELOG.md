# Changelog

All notable changes to `glimm-adapters` are documented here. Releases are cut
with `scripts/publish.mjs`, which owns the version bump, this changelog file and
the `release-*` tag.

## 1.1.0 (2026-10-25) · TanStack links respect the deployed basepath

### Fixed

- TanStack Router: strip the deployed basepath before navigating, so intercepted links and `TransitionLink` no longer double-prefix the route.

## 1.0.0 (2026-10-24) · One adapter package for six routers

The package is now `glimm-adapters`: one sweep contract behind TanStack Router,
React, SvelteKit, Vue Router, Astro, and vanilla JavaScript.

### Added

- Adapters for TanStack Router, React Router, SvelteKit, Vue Router, Astro, and vanilla JavaScript.
- Reveal mode: one sweep with the route commit at the midpoint.
- Covered mode: cover → hold → reveal for routes slow enough to outrun a single sweep.
- A shared runner with link interception, skip rules, instant fallback, and reduced-motion handling.
- TanStack Router: `GlimmProvider`, `InterceptLinks`, `TransitionLink`, and `useTransitionRouter`.
- React: `GlimmProvider`, `useGlimm`, and `useInterceptLinks`.

### Fixed

- Vue: route tests mount the adapter with the matching test setup.

## 0.1.0 (2026-10-20) · Six routes, one engine

One WebGL engine, six ways in. `glimm-adapters` 0.1.0 adds the adapter layer glimm does not ship: every router gets the same sweep, the same options, and the same skip rules, with no fork of the engine.

### Added

- Adapters for TanStack Router, React Router, SvelteKit, Vue Router and Nuxt, Astro, and vanilla JavaScript.
- TanStack Router: `GlimmProvider`, `InterceptLinks`, `TransitionLink`, and `useTransitionRouter`.
- React: `GlimmProvider`, `useGlimm`, and `useInterceptLinks`, so any router with a navigate function can sweep.
- Core re-exports: `createShader`, `createCurtain`, `playCoveredSweep`, `interceptLinks`, plus every glimm palette and easing.
- Skip rules for modifier clicks, right clicks, external URLs, hashes, downloads, `target="_blank"`, and `data-glimm-skip`.
- Instant navigation when WebGL is unavailable or motion is reduced, and a server-side no-op.
