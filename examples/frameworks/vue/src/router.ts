import { createRouter, createWebHistory } from "vue-router";
import About from "./pages/About.vue";
import Home from "./pages/Home.vue";

/**
 * The docs worker serves this app from /example/vue. Vite writes that path
 * into `import.meta.env.BASE_URL`; during `pnpm dev` it is "/".
 */
export const base = import.meta.env.BASE_URL.replace(/\/$/, "");

/** Drop the deployed base from a pathname the link interceptor reported. */
export function stripBase(pathname: string): string {
  if (!base || !pathname.startsWith(base)) return pathname;
  const rest = pathname.slice(base.length);
  if (!rest) return "/";
  if (rest.startsWith("/")) return rest;
  if (rest.startsWith("?") || rest.startsWith("#")) return `/${rest}`;
  return pathname;
}

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: "/", component: Home },
    { path: "/about", component: About },
    { path: "/:pathMatch(.*)*", redirect: "/" },
  ],
});
