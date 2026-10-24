/**
 * Cuelume, wrapped so every island plays cues the same way.
 *
 * The Web Audio context needs a user gesture before it will sound, so the
 * first pointer or key press arms it once. The on/off preference is kept in
 * `localStorage` and shared through a tiny subscription so the menu's switch
 * and the handlers that play cues never disagree.
 */

import { play, setEnabled, setVolume, unlock } from "cuelume";
import type { Emphasis, SoundName } from "cuelume";

const STORAGE_KEY = "app-sound";

let enabled = true;
let armed = false;
let initialized = false;
const listeners = new Set<() => void>();

/**
 * Builds the shared output bus on the arming gesture.
 *
 * The bus carries a short convolver room, and its impulse is two 12k-sample
 * passes. That build is the expensive part of the very first cue: paying for
 * it on pointerdown means the click that follows is heard immediately instead
 * of waiting for the room to be built. The cue used is one tick at -80 dB, so
 * it warms the graph without being audible.
 */
function warm() {
  void unlock().then((ready) => {
    if (!ready) {
      // A blocked or unsupported context should not burn the one warm-up try.
      armed = false;
      return;
    }
    play("tap", { volume: 0.0001 });
  });
}

/** Starts the audio context. Must run inside a user gesture. */
function arm() {
  if (armed || !enabled) return;
  armed = true;
  setVolume(0.6);
  warm();
}

/** Reads the stored preference and arms the audio context on the first gesture. */
export function initSound() {
  if (typeof window === "undefined" || initialized) return;
  initialized = true;
  try {
    enabled = localStorage.getItem(STORAGE_KEY) !== "off";
  } catch {
    // Private mode or a blocked storage partition. Default to sound on.
    enabled = true;
  }
  setEnabled(enabled);
  for (const listener of listeners) listener();

  window.addEventListener("pointerdown", arm, { capture: true, passive: true });
  window.addEventListener("keydown", arm, { capture: true });
}

export function soundEnabled(): boolean {
  return enabled;
}

export function subscribeSound(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function setSound(next: boolean) {
  enabled = next;
  try {
    localStorage.setItem(STORAGE_KEY, next ? "on" : "off");
  } catch {
    // The preference still applies to this page even when it cannot persist.
  }
  setEnabled(next);
  if (next) arm();
  for (const listener of listeners) listener();
}

/** Plays a cue, unless sound is off. Safe to call from anywhere. */
export function cue(sound: SoundName, options?: { emphasis?: Emphasis }): void {
  if (!enabled) return;
  play(sound, options);
}
