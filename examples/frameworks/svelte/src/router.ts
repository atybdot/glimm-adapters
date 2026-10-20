import { tick } from "svelte";
import { writable } from "svelte/store";

export const path = writable(window.location.pathname);

/**
 * The adapter calls this at the sweep's midpoint. Resolve once Svelte has
 * rendered the new branch; the adapter waits for the next paint before the
 * band leaves.
 */
export async function goto(href: string) {
  if (href === window.location.pathname + window.location.search) return;
  window.history.pushState({}, "", href);
  path.set(window.location.pathname);
  await tick();
}
