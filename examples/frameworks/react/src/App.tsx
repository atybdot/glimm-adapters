import { useMemo, useState } from "react";
import { BrowserRouter, Route, Routes, useNavigate } from "react-router-dom";
import { GlimmProvider, useInterceptLinks } from "glimm-adapters/react";
import { SWEEP_MS } from "@glimm-examples/shared/demo-data";
import { base, stripBase } from "./base";
import { AboutPage, HomePage, PromptPage, Shell } from "./pages";

/** One hook binds every same-origin anchor to the provider's sweep. */
function AutoLinks({ sweepMs }: { sweepMs: number }) {
  const navigate = useNavigate();
  // The interceptor reports the full pathname, which includes the deployed
  // base. React Router wants the path inside the router.
  const sweep = useMemo(() => ({ sweepMs }), [sweepMs]);
  useInterceptLinks((href) => navigate(stripBase(href)), { sweep });
  return null;
}

export function App() {
  const [sweepMs, setSweepMs] = useState(SWEEP_MS.initial);

  return (
    <BrowserRouter basename={base || "/"}>
      <GlimmProvider palette="prism">
        <AutoLinks sweepMs={sweepMs} />
        <Shell sweepMs={sweepMs} onSweepMs={setSweepMs}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/prompt" element={<PromptPage />} />
            <Route path="*" element={<HomePage />} />
          </Routes>
        </Shell>
      </GlimmProvider>
    </BrowserRouter>
  );
}
