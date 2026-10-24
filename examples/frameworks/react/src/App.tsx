import { BrowserRouter, Route, Routes, useNavigate } from "react-router-dom";
import { GlimmProvider, useInterceptLinks } from "glimm-adapters/react";
import { AboutPage, HomePage, Shell } from "./pages";

/** One hook binds every same-origin anchor to the provider's sweep. */
function AutoLinks() {
  const navigate = useNavigate();
  useInterceptLinks((href) => navigate(href));
  return null;
}

export function App() {
  return (
    <BrowserRouter>
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
