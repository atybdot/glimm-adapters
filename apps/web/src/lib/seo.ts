/**
 * Share-card facts, one place so every page points at the same asset.
 *
 * Both images are static 1200x630 PNGs in `public`, rendered by Takumi at build
 * time. The general card carries the package version in its top-right corner;
 * the changelog card swaps in its own headline and description.
 */

import { pageUrl } from "./page-md";

export const ogImage = `${pageUrl}/og.png`;
export const ogImageAlt = "glimm-adapters, a WebGL band sweeping between two pages";
export const changelogOgImage = `${pageUrl}/og-changelog.png`;
export const changelogOgImageAlt = "glimm-adapters changelog, every release newest first";
export const twitterHandle = "@atybdot";
