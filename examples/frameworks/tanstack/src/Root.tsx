import { Outlet } from "@tanstack/react-router";
import { accentChain } from "glimm-adapters";
import { GlimmProvider, InterceptLinks } from "glimm-adapters/tanstack";
import { demos } from "@glimm-examples/shared/demo-data";
import { Shell } from "./ui";

// The TanStack mark is monochrome, so the sweep uses the coral the page
// already wears for it.
const palette = accentChain(demos.tanstack.palette);

export function Root() {
  return (
    <GlimmProvider palette={palette}>
      <InterceptLinks />
      <Shell>
        <Outlet />
      </Shell>
    </GlimmProvider>
  );
}
