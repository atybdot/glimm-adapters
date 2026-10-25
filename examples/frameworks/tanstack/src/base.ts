/**
 * The docs worker serves this app from /example/tanstack. Vite writes that
 * path into `import.meta.env.BASE_URL`; during `pnpm dev` it is "/".
 *
 * TanStack Router wants the base as `basepath` and strips it from
 * `useLocation().pathname`, so route matching stays unprefixed.
 */
const base = import.meta.env.BASE_URL.replace(/\/$/, "");

export const basepath = base || "/";

/** Prefix an app path for a real anchor href. */
export const appHref = (path: string) => `${base}${path}`;
