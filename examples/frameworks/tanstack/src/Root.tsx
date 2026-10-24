import { Outlet } from "@tanstack/react-router";
import { GlimmProvider, InterceptLinks } from "glimm-adapters/tanstack";
import { Shell } from "./ui";

export function Root() {
  return (
    <GlimmProvider palette="prism">
      <InterceptLinks />
      <Shell>
        <Outlet />
      </Shell>
    </GlimmProvider>
  );
}
