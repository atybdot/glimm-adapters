import { tick } from "svelte";
import { writable } from "svelte/store";

/**
 * The docs worker serves this app from /example/svelte. Vite writes that path
 * into `import.meta.env.BASE_URL`; during `pnpm dev` it is "/".
 *
 * Keep `base` unexported: links go through `appHref`, and the store keeps app
 * paths without the base so route matching stays simple.
 */
const base = import.meta.env.BASE_URL.replace(/\/$/, "");

/** Prefix an app path for a real anchor href. */
export const appHref = (path: string) => `${base}${path}`;

/** Drop the deployed base from the address bar path. */
export function toAppPath(pathname: string): string {
  if (!base || !pathname.startsWith(base)) return pathname;
  const rest = pathname.slice(base.length);
  if (!rest) return "/";
  if (!rest.startsWith("/")) return pathname;
  // The static host serves `/about/` for `/about`. Match one shape so direct
  // URLs and in-app links resolve to the same route.
  return rest.replace(/\/+$/, "") || "/";
}

export const path = writable(toAppPath(window.location.pathname));

/**
 * The adapter calls this at the sweep's midpoint. Resolve once Svelte has
 * rendered the new branch; the adapter waits for the next paint before the
 * band leaves.
 */
export async function goto(href: string) {
  if (href === window.location.pathname + window.location.search) return;
  window.history.pushState({}, "", href);
  path.set(toAppPath(window.location.pathname));
  await tick();
}
