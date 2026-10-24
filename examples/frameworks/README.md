# Framework playground

Six small apps, one per adapter entry. Every app renders the same two pages, so the only variable
is the transition.

| App        | Adapter                   | Port | Sweep                             |
| ---------- | ------------------------- | ---- | --------------------------------- |
| `vanilla`  | `glimm-adapters/vanilla`  | 4601 | reveal (one pass)                 |
| `react`    | `glimm-adapters/react`    | 4602 | provider (masked where supported) |
| `vue`      | `glimm-adapters/vue`      | 4603 | reveal (one pass)                 |
| `svelte`   | `glimm-adapters/svelte`   | 4604 | reveal (one pass)                 |
| `tanstack` | `glimm-adapters/tanstack` | 4605 | provider (masked where supported) |
| `astro`    | `glimm-adapters/astro`    | 4606 | reveal (one pass)                 |

## Run everything

```bash
pnpm install
pnpm dev:examples
```

Then open <http://localhost:4601>, <http://localhost:4602>, and so on. Each app is independent; you
can also start one:

```bash
pnpm --filter @glimm-examples/react dev
```

## Run a production build

```bash
pnpm build:examples
pnpm --filter @glimm-examples/react preview
```

## What to check

- Click **About** and then **Home**. The page should swap exactly once per click.
- Watch the canvas across the swap. Only the page should change; the canvas must survive.
- Use the browser back/forward buttons. They should land on the right page without a stuck curtain.
- Compare the adapter apps with React and TanStack. The DOM adapters commit at the sweep's midpoint
  and finish in one pass. Pass `mode: "covered"` in one of them if you want to compare the older
  cover → hold → reveal path.
- Open DevTools and look for duplicate canvases or a growing number of click listeners after a few
  navigations.

## Notes

- Apps import `glimm-adapters` from the workspace, which resolves to `packages/glimm-adapters/dist`.
  After editing the package source, rebuild it before reloading:

  ```bash
  pnpm build:lib
  ```

  For continuous rebuilds, run `pnpm --filter glimm-adapters dev` in another terminal.

- React and TanStack use glimm's React provider (`GlimmProvider`), which owns the canvas and the
  sweep. The other apps pass a DOM canvas to their adapter.

- The vanilla and Svelte apps use a tiny `history.pushState` router so the demo stays dependency
  free. Their navigate callbacks only commit the route; the adapter waits for the new view to paint
  before the band leaves.

- If you change a port, update the app's `vite.config.ts` (or `astro.config.mjs`) and the table above.
