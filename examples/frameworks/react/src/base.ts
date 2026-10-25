/**
 * The docs worker serves this app from /example/react. Vite writes that path
 * into `import.meta.env.BASE_URL` at build time; during `pnpm dev` it is "/".
 */

/** The base without a trailing slash, so `base + "/about"` stays tidy. */
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
