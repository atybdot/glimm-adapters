import { SWEEP_MS } from "@glimm-examples/shared/demo-data";

/**
 * One defaults object for the whole demo. The slider mutates `sweepMs`; the
 * adapter merges this same object into every sweep, so the next click picks
 * up the new duration without a re-setup.
 */
export const defaults = { sweepMs: SWEEP_MS.initial };
