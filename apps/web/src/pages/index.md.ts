import type { APIRoute } from "astro";
import { pageMarkdown } from "../lib/page-md";

/** The page as plain markdown, so an agent can read it without the HTML. */
export const prerender = true;

export const GET: APIRoute = () =>
  new Response(pageMarkdown(), {
    headers: { "content-type": "text/markdown; charset=utf-8" },
  });
