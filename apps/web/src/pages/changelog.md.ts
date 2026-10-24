import type { APIRoute } from "astro";
import { changelogMarkdown } from "../lib/changelog";

/** The changelog as plain markdown, so an agent can read it without the HTML. */
export const prerender = true;

export const GET: APIRoute = () =>
  new Response(changelogMarkdown(), {
    headers: { "content-type": "text/markdown; charset=utf-8" },
  });
