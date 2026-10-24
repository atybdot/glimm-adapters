import { describe, expect, it, vi } from "vitest";
import { createRunnerState, runVanillaSweep } from "../src/vanilla.js";

function runInstant(commit: () => void, options = {}) {
  return runVanillaSweep({
    state: createRunnerState(),
    controller: null,
    curtain: null,
    defaults: {},
    reducedMotion: "instant",
    commit,
    options,
  });
}

describe("runVanillaSweep instant path", () => {
  it("commits synchronously and still runs midpoint and complete callbacks", () => {
    const order: string[] = [];
    const commit = vi.fn<() => void>(() => {
      order.push("commit");
    });
    const handle = runInstant(commit, {
      onMidpoint: () => order.push("midpoint"),
      onComplete: () => order.push("complete"),
    });

    expect(handle).toBeNull();
    expect(order).toEqual(["midpoint", "commit", "complete"]);
  });

  it("logs a rejected navigation instead of leaving it unhandled", async () => {
    const errors = vi.spyOn(console, "error").mockImplementation(() => {});
    runInstant(() => Promise.reject(new Error("boom")));
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(errors).toHaveBeenCalledWith(
      "[glimm-adapters] instant navigation failed:",
      expect.any(Error),
    );
    errors.mockRestore();
  });

  it("still navigates when an async midpoint callback rejects", async () => {
    const commit = vi.fn<() => void>();
    const errors = vi.spyOn(console, "error").mockImplementation(() => {});
    runInstant(commit, {
      onMidpoint: () => Promise.reject(new Error("midpoint")),
    });
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(commit).toHaveBeenCalledTimes(1);
    errors.mockRestore();
  });
});
