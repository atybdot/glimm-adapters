import { BrowserRouter, Route, Routes, useNavigate } from "react-router-dom";
import { GlimmProvider, useInterceptLinks } from "glimm-adapters/react";
import { base, stripBase } from "./base";
import { AboutPage, HomePage, Shell } from "./pages";

/** One hook binds every same-origin anchor to the provider's sweep. */
function AutoLinks() {
  const navigate = useNavigate();
  // The interceptor reports the full pathname, which includes the deployed
  // base. React Router wants the path inside the router.
  useInterceptLinks((href) => navigate(stripBase(href)));
  return null;
}

export function App() {
  return (
    <BrowserRouter basename={base || "/"}>
      <GlimmProvider palette="prism">
        <AutoLinks />
        <Shell>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="*" element={<HomePage />} />
          </Routes>
        </Shell>
      </GlimmProvider>
    </BrowserRouter>
  );
}
