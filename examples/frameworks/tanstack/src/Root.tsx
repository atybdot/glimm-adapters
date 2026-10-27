import { useMemo, useState } from "react";
import { Outlet } from "@tanstack/react-router";
import { GlimmProvider, InterceptLinks } from "glimm-adapters/tanstack";
import { SWEEP_MS } from "@glimm-examples/shared/demo-data";
import { Shell } from "./ui";

export function Root() {
  const [sweepMs, setSweepMs] = useState(SWEEP_MS.initial);
  const sweep = useMemo(() => ({ sweepMs }), [sweepMs]);

  return (
    <GlimmProvider palette="prism">
      <InterceptLinks sweep={sweep} />
      <Shell sweepMs={sweepMs} onSweepMs={setSweepMs}>
        <Outlet />
      </Shell>
    </GlimmProvider>
  );
}
