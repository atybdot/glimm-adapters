// TanStack Router adapter for glimm — mirrors the `glimm/next` API
// (`TransitionLink`, `useTransitionRouter`, `InterceptLinks`) on top of
// `@tanstack/react-router`. Only this file knows about TanStack; the WebGL
// engine is reused as-is from `glimm` via `glimm/react`.

import { forwardRef, useEffect } from "react";
import { Link, useRouter, type LinkComponentProps } from "@tanstack/react-router";
import { useGlimm } from "glimm/react";
import type { SweepHandle, SweepOptions } from "glimm/react";
import { defaultShouldIntercept, interceptLinks } from "./intercept.js";
import type { InterceptLinksOptions } from "./intercept.js";

export { GlimmProvider, useGlimm } from "glimm/react";
export { PALETTES, EASINGS } from "glimm/react";
export type {
  Palette,
  PaletteName,
  Direction,
  EasingName,
  GlimmDefaults,
  SweepFn,
  SweepHandle,
  SweepOptions,
} from "glimm/react";

export type TransitionLinkProps = LinkComponentProps<"a"> & {
  /** Per-link sweep overrides (palette, direction, duration…). */
  sweep?: SweepOptions;
  /** If true, skip the sweep and just navigate. Default false. */
  noTransition?: boolean;
};

/**
 * Drop-in replacement for TanStack Router's `<Link>` that plays a glimm
 * sweep around the navigation. Falls back to a normal link click for
 * modifier clicks, `target="_blank"`, external URLs, and same-page hashes.
 *
 * ```tsx
 * import { TransitionLink } from 'glimm-adapters/tanstack'
 * <TransitionLink to="/about" sweep={{ palette: 'berry', direction: 'rtl' }}>
 *   About
 * </TransitionLink>
 * ```
 *
 * Opt out per link with `noTransition` or globally per anchor with
 * `data-glimm-skip` (handled by `<InterceptLinks />`, not here).
 */
export const TransitionLink = forwardRef<HTMLAnchorElement, TransitionLinkProps>(
  function TransitionLink({ onClick, sweep: sweepOpts, noTransition, ...linkProps }, ref) {
    const router = useRouter();
    const { sweep } = useGlimm();

    const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
      onClick?.(e);
      if (e.defaultPrevented) return;
      if (noTransition) return;
      const anchor = e.currentTarget;
      if (!defaultShouldIntercept(e.nativeEvent, anchor)) return;
      e.preventDefault();
      let url: URL;
      try {
        url = new URL(anchor.href, window.location.href);
      } catch {
        return;
      }
      const { to, params, search, hash, replace } = linkProps as {
        to?: string;
        params?: Record<string, string>;
        search?: Record<string, unknown>;
        hash?: string;
        replace?: boolean;
      };
      const normalizedHash = hash ? hash.replace(/^#/, "") : undefined;
      try {
        if (to) {
          sweep(
            () =>
              router.navigate({
                to: to as string,
                params: params as never,
                search: search as never,
                hash: normalizedHash,
                replace,
              }),
            sweepOpts,
          );
        } else {
          // Fall back to the clicked href. Pass it as a single `to` so
          // search/hash are not supplied twice.
          sweep(
            () =>
              router.navigate({
                to: (url.pathname + url.search + url.hash) as string,
                replace,
              }),
            sweepOpts,
          );
        }
      } catch {
        // Sweep setup failed — fall back to plain navigation.
        if (to) {
          void router.navigate({
            to: to as string,
            params: params as never,
            search: search as never,
            hash: normalizedHash,
            replace,
          });
        } else {
          void router.navigate({ to: (url.pathname + url.search + url.hash) as string, replace });
        }
      }
    };

    return <Link ref={ref} {...linkProps} onClick={handleClick} />;
  },
);

export type TransitionRouter = {
  /** Push a new route, animated by a sweep. Returns the sweep handle. */
  push: (href: string, options?: SweepOptions) => SweepHandle;
  /** Replace the current route, animated by a sweep. */
  replace: (href: string, options?: SweepOptions) => SweepHandle;
  /** Navigate back, animated by a sweep. */
  back: (options?: SweepOptions) => SweepHandle;
  /** Navigate forward, animated by a sweep. */
  forward: (options?: SweepOptions) => SweepHandle;
};

/**
 * The parts of the TanStack router this adapter uses. Structural, so the
 * adapter does not need the router's full generic type at the call site.
 */
export type TanStackRouterLike = {
  navigate: (options: { to: string; replace?: boolean }) => Promise<void>;
  history: { back: () => void; forward: () => void };
  subscribe: (event: "onRendered", listener: () => void) => () => void;
};

/**
 * Resolve after the router has rendered the location a history call moved to.
 * `history.back()`/`forward()` return void, so the sweep cannot await them
 * directly and would reveal before the new route paints.
 */
function afterRender(
  router: Pick<TanStackRouterLike, "subscribe">,
  run: () => void,
): Promise<void> {
  return new Promise((resolve) => {
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      unsubscribe();
      resolve();
    };
    const unsubscribe = router.subscribe("onRendered", finish);
    run();
  });
}

/**
 * Router-shaped commit functions, separate from React so the timing can be
 * tested without mounting a router.
 */
export function createTanStackCommit(router: TanStackRouterLike) {
  const navigate = (href: string, replace?: boolean) =>
    replace === undefined ? router.navigate({ to: href }) : router.navigate({ to: href, replace });
  return {
    push: (href: string) => navigate(href),
    replace: (href: string) => navigate(href, true),
    back: () => afterRender(router, () => router.history.back()),
    forward: () => afterRender(router, () => router.history.forward()),
  };
}

/**
 * Drop-in programmatic navigation for TanStack Router that plays a glimm
 * sweep around each call. For declarative links prefer `<TransitionLink>`.
 *
 * `router.navigate` returns a promise that resolves after the route has
 * loaded. `router.history.push` returns void, which lets the sweep reveal
 * before the new route renders, so it is not used here.
 *
 * ```tsx
 * const router = useTransitionRouter()
 * await save(form)
 * router.push('/dashboard', { palette: 'ember' })
 * ```
 */
export function useTransitionRouter(): TransitionRouter {
  const router = useRouter();
  const { sweep } = useGlimm();
  const commit = createTanStackCommit(router as unknown as TanStackRouterLike);
  return {
    push: (href, options) => sweep(() => commit.push(href), options),
    replace: (href, options) => sweep(() => commit.replace(href), options),
    back: (options) => sweep(() => commit.back(), options),
    forward: (options) => sweep(() => commit.forward(), options),
  };
}

/**
 * React hook variant. Drop it once inside `<GlimmProvider>` (e.g. in the
 * root route) and every internal link click gets a sweep automatically.
 * Opt individual links out with `data-glimm-skip`.
 *
 * ```tsx
 * // __root.tsx
 * import { GlimmProvider } from 'glimm-adapters/tanstack'
 * import { InterceptLinks } from 'glimm-adapters/tanstack'
 * export function Root() {
 *   return (
 *     <GlimmProvider palette="prism">
 *       <InterceptLinks />
 *       <Outlet />
 *     </GlimmProvider>
 *   )
 * }
 * ```
 */
export function InterceptLinks(props: InterceptLinksOptions): null {
  const router = useRouter();
  const { sweep } = useGlimm();
  useEffect(() => {
    // `navigate` returns a promise that resolves after the route loads, so
    // glimm's commit holds the curtain until the new page has rendered.
    return interceptLinks(sweep, (href) => router.navigate({ to: href }), props);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router, sweep, props.sweep, props.shouldIntercept]);
  return null;
}
