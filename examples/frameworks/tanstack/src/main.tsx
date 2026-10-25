import "@glimm-examples/shared/demo.css";
import { createRoot } from "react-dom/client";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { basepath } from "./base";
import { routeTree } from "./routeTree";

const router = createRouter({ routeTree, basepath });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

const root = document.querySelector<HTMLDivElement>("#root");

if (!root) {
  throw new Error("The TanStack demo is missing #root");
}

createRoot(root).render(<RouterProvider router={router} />);
