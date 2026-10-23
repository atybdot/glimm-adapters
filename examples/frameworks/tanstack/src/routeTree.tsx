import { createRootRoute, createRoute } from "@tanstack/react-router";
import { Root } from "./Root";
import { AboutPage, HomePage } from "./ui";

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

export const routeTree = rootRoute.addChildren([indexRoute, aboutRoute]);
