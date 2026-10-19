/**
 * One source of truth for the sweep settings the page's widgets share.
 *
 * The live demo picks the palette, the easing lab picks the curve, the band lab
 * picks how tight the band is, and the theme switch, easing preview and band
 * preview all sweep the page-wide canvas with whatever is selected. Keeping
 * that in a module store means every island reads the same values without a
 * prop drill across hydration roots.
 *
 * `useSweepState` is a `useSyncExternalStore` adapter, so React re-renders the
 * control that owns a value and no one else.
 */

import { useSyncExternalStore } from "react";
import { resolvePalette } from "glimm-adapters";
import type { EasingName, Palette, PaletteName } from "glimm-adapters";

export type SweepState = {
  palette: PaletteName;
  /** A palette rolled by the custom-palette lab. Wins over the preset while set. */
  custom: Palette | null;
  easing: EasingName;
  bandTight: number;
};

const DEFAULT_BAND_TIGHT = 14;

let state: SweepState = {
  palette: "ember",
  custom: null,
  easing: "ease",
  bandTight: DEFAULT_BAND_TIGHT,
};

const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

export function getSweepState(): SweepState {
  return state;
}

/** The palette a sweep runs with: the rolled one if set, otherwise the preset. */
export function activePalette(): Palette {
  return state.custom ?? resolvePalette(state.palette);
}

export function subscribeSweep(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function setPalette(palette: PaletteName) {
  if (state.palette === palette && state.custom === null) return;
  // Picking a preset drops any rolled palette, so the two never fight.
  state = { ...state, palette, custom: null };
  emit();
}

export function setCustom(custom: Palette | null) {
  state = { ...state, custom };
  emit();
}

export function setEasing(easing: EasingName) {
  if (state.easing === easing) return;
  state = { ...state, easing };
  emit();
}

export function setBandTight(bandTight: number) {
  if (state.bandTight === bandTight) return;
  state = { ...state, bandTight };
  emit();
}

/** The subscribed view of the store, for React islands. */
export function useSweepState(): SweepState {
  return useSyncExternalStore(subscribeSweep, getSweepState, getSweepState);
}
