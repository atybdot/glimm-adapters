import "@glimm-examples/shared/demo.css";
import { createRoot } from "react-dom/client";
import { App } from "./App";

const root = document.querySelector<HTMLDivElement>("#root");

if (!root) {
  throw new Error("The React demo is missing #root");
}

createRoot(root).render(<App />);
