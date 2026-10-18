# Changelog

All notable changes to `glimm-adapters` are documented here. Releases are cut
with `scripts/publish.mjs`, which owns the version bump, this changelog file and
the `release-*` tag.

## 0.1.0 (2026-10-20) · Six routes, one engine

One WebGL engine, six ways in. `glimm-adapters` 0.1.0 adds the adapter layer glimm does not ship: every router gets the same sweep, the same options, and the same skip rules, with no fork of the engine.

### Added

- Adapters for TanStack Router, React Router, SvelteKit, Vue Router and Nuxt, Astro, and vanilla JavaScript.
- TanStack Router: `GlimmProvider`, `InterceptLinks`, `TransitionLink`, and `useTransitionRouter`.
- React: `GlimmProvider`, `useGlimm`, and `useInterceptLinks`, so any router with a navigate function can sweep.
- Core re-exports: `createShader`, `createCurtain`, `playCoveredSweep`, `interceptLinks`, plus every glimm palette and easing.
- Skip rules for modifier clicks, right clicks, external URLs, hashes, downloads, `target="_blank"`, and `data-glimm-skip`.
- Instant navigation when WebGL is unavailable or motion is reduced, and a server-side no-op.
- A docs site with a live sweep stage, easing and band-width labs, and a palette roller.

### Fixed

- The release helper now refuses a dirty working tree, a duplicate tag, and a target version below the current one.
