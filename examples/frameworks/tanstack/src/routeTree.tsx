import { createRootRoute, createRoute } from "@tanstack/react-router";
import { Root } from "./Root";
import { AboutPage, HomePage, PromptPage } from "./ui";

const rootRoute = createRootRoute({ component: Root });

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: HomePage,
});

const aboutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/about",
  component: AboutPage,
});

const promptRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/prompt",
  component: PromptPage,
});

export const routeTree = rootRoute.addChildren([indexRoute, aboutRoute, promptRoute]);
