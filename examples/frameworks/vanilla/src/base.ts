/**
 * The docs worker serves this app from /example/vanilla. Vite writes that path
 * into `import.meta.env.BASE_URL`; during `pnpm dev` it is "/".
 */
const base = import.meta.env.BASE_URL.replace(/\/$/, "");

/** Prefix an app path for a real anchor href. */
export const appHref = (path: string) => `${base}${path}`;

/** Drop the deployed base from the address bar path. */
export function toAppPath(pathname: string): string {
  if (!base || !pathname.startsWith(base)) return pathname;
  const rest = pathname.slice(base.length);
  if (!rest) return "/";
  if (!rest.startsWith("/")) return pathname;
  // The static host serves `/about/` for `/about`. Match one shape so direct
  // URLs and in-app links resolve to the same route.
  return rest.replace(/\/+$/, "") || "/";
}
