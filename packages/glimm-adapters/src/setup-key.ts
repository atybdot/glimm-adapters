// Shared identity helpers for adapter setup.
//
// Every adapter that can be mounted more than once (Astro re-runs its inline
// script after a swap; SvelteKit and Nuxt re-run layout mounts under HMR) needs
// to answer two questions:
//
//   1. Is there already an instance for this canvas?
//   2. Is it configured the same way?
//
// Functions and routers have no meaningful JSON form, so they are interned to
// stable ids. A changed function identity rebuilds the slot; a stable import
// reuses it.

const refIds = new WeakMap<object, number>();
let nextRefId = 0;

/** Stable id for a function or object, for setup-key comparisons. */
export function refId(value: object): string {
  let id = refIds.get(value);
  if (id === undefined) {
    id = ++nextRefId;
    refIds.set(value, id);
  }
  return `ref:${id}`;
}

function stable(value: unknown): unknown {
  if (typeof value === "function") return refId(value);
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, entry] of Object.entries(value)) out[key] = stable(entry);
    return out;
  }
  return value;
}

export type SetupKeyParts = {
  defaults?: unknown;
  reducedMotion?: unknown;
  /** Functions and router objects are compared by identity. */
  navigate?: unknown;
  /** Adapter-specific settings that change behavior, such as the sweep mode. */
  extra?: unknown;
};

/** JSON key of a setup. Equal keys mean the existing instance can be reused. */
export function setupKey({ defaults, reducedMotion, navigate, extra }: SetupKeyParts): string {
  const nav =
    typeof navigate === "function" || (navigate !== null && typeof navigate === "object")
      ? refId(navigate as object)
      : null;
  return JSON.stringify([
    stable(defaults ?? {}),
    reducedMotion ?? null,
    nav,
    stable(extra ?? null),
  ]);
}

export type CanvasSlot<T> = {
  api: T;
  setupKey: string;
};

/** One live instance per canvas, with identity-checked removal. */
export function createCanvasSlots<T>() {
  const slots = new WeakMap<HTMLCanvasElement, CanvasSlot<T>>();
  return {
    get(canvas: HTMLCanvasElement): CanvasSlot<T> | undefined {
      return slots.get(canvas);
    },
    set(canvas: HTMLCanvasElement, slot: CanvasSlot<T>): void {
      slots.set(canvas, slot);
    },
    delete(canvas: HTMLCanvasElement, api: T): void {
      const slot = slots.get(canvas);
      if (slot?.api === api) slots.delete(canvas);
    },
  };
}
