"use client";

import { useSyncExternalStore } from "react";
import { soundEnabled, subscribeSound } from "./sound";

/** The sound preference, kept in sync across every island. */
export function useSoundEnabled(): boolean {
  return useSyncExternalStore(subscribeSound, soundEnabled, () => true);
}
