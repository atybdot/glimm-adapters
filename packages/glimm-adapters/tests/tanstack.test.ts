import { describe, expect, it, vi } from "vitest";
import { createTanStackCommit } from "../src/tanstack.js";
import type { TanStackRouterLike } from "../src/tanstack.js";

function routerLike(overrides: Partial<TanStackRouterLike> = {}): TanStackRouterLike {
  return {
    navigate: vi.fn<() => Promise<void>>(async () => {}),
    history: { back: vi.fn<() => void>(), forward: vi.fn<() => void>() },
    subscribe: vi.fn<TanStackRouterLike["subscribe"]>(() => () => {}),
    ...overrides,
  };
}

describe("createTanStackCommit", () => {
  it("awaits router.navigate so the route renders before the reveal", async () => {
    let finishRoute!: () => void;
    const navigate = vi.fn<() => Promise<void>>(
      () =>
        new Promise<void>((resolve) => {
          finishRoute = resolve;
        }),
    );
    const router = routerLike({ navigate });
    const commit = createTanStackCommit(router);

    let rendered = false;
    const task = commit.push("/b").then(() => {
      rendered = true;
    });

    expect(navigate).toHaveBeenCalledWith({ to: "/b" });
    await Promise.resolve();
    expect(rendered).toBe(false);

    finishRoute();
    await task;
    expect(rendered).toBe(true);
  });

  it("never uses the void history.push API", async () => {
    const navigate = vi.fn<() => Promise<void>>(async () => {});
    const push = vi.fn<() => void>();
    const router = routerLike({ navigate });
    // history.push is not part of the adapter's contract; a router that
    // exposes it must still be driven through navigate.
    (router.history as unknown as { push: () => void }).push = push;

    await createTanStackCommit(router).push("/b");
    expect(navigate).toHaveBeenCalledWith({ to: "/b" });
    expect(push).not.toHaveBeenCalled();
  });

  it("marks replace navigations", async () => {
    const navigate = vi.fn<() => Promise<void>>(async () => {});
    await createTanStackCommit(routerLike({ navigate })).replace("/b");
    expect(navigate).toHaveBeenCalledWith({ to: "/b", replace: true });
  });

  it("resolves back only after the router has rendered", async () => {
    let fireRendered!: () => void;
    const subscribe = vi.fn<TanStackRouterLike["subscribe"]>((_event, listener) => {
      fireRendered = listener;
      return () => {};
    });
    const back = vi.fn<() => void>();
    const router = routerLike({
      history: { back, forward: vi.fn<() => void>() },
      subscribe,
    });
    const commit = createTanStackCommit(router);

    let rendered = false;
    const task = commit.back().then(() => {
      rendered = true;
    });

    expect(back).toHaveBeenCalledTimes(1);
    expect(subscribe).toHaveBeenCalledWith("onRendered", expect.any(Function));
    await Promise.resolve();
    expect(rendered).toBe(false);

    fireRendered();
    await task;
    expect(rendered).toBe(true);
  });

  it("resolves forward only after the router has rendered", async () => {
    let fireRendered!: () => void;
    const subscribe = vi.fn<TanStackRouterLike["subscribe"]>((_event, listener) => {
      fireRendered = listener;
      return () => {};
    });
    const forward = vi.fn<() => void>();
    const router = routerLike({
      history: { back: vi.fn<() => void>(), forward },
      subscribe,
    });
    const commit = createTanStackCommit(router);

    let rendered = false;
    const task = commit.forward().then(() => {
      rendered = true;
    });
    expect(forward).toHaveBeenCalledTimes(1);
    fireRendered();
    await task;
    expect(rendered).toBe(true);
  });
});
