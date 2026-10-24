// jsdom does not implement WebGL or navigation; glimm falls back to null in
// both cases. Stub the two APIs so the unimplemented-method warnings don't
// spam the test output (and the release dry-run) without changing behavior.
import { vi } from "vitest";

HTMLCanvasElement.prototype.getContext = vi.fn<() => null>(
  () => null,
) as unknown as typeof HTMLCanvasElement.prototype.getContext;

const originalError = console.error;
console.error = (...args: unknown[]) => {
  const first = args[0];
  if (typeof first === "string" && first.includes("Not implemented")) return;
  originalError(...args);
};
