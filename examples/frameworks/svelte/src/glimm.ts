import { accentChain } from "glimm-adapters";
import { demos, SWEEP_MS } from "@glimm-examples/shared/demo-data";

/** One defaults object for the whole demo, merged into every sweep. */
export const defaults = {
  sweepMs: SWEEP_MS,
  palette: accentChain(demos.svelte.palette),
};
