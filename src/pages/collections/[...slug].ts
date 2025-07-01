import type { APIRoute } from "astro";

export const GET: APIRoute = async ({ params, locals }) => {
  const { slug = "" } = params;

  // Try both with and without .md extension
  const key = `collections/${slug}`;
  const keyWithMd = key + ".md";

  // First try with .md extension
  let markdownContent = await locals.webflowContent.get(keyWithMd);

  // If not found, try without .md extension
  if (!markdownContent) {
    markdownContent = await locals.webflowContent.get(key);
  }

  if (!markdownContent) {
    return new Response("Collection not found", { status: 404 });
  }

  // Return raw markdown content
  return new Response(markdownContent, {
    status: 200,
    headers: {
      "Content-Type": "text/markdown",
    },
  });
};
