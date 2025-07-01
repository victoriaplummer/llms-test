import type { APIRoute } from "astro";

export const GET: APIRoute = async ({ locals }) => {
  try {
    // Log that we're attempting to get content
    console.log("Attempting to get llms.txt content from KV");

    // Get llms.txt content from KV
    const content = await locals.webflowContent.get("llms.txt");

    // Log the content we got
    console.log("Retrieved content:", content);

    if (!content) {
      console.log("No content found in KV store");
      return new Response("No content available", {
        status: 404,
        headers: { "Content-Type": "text/plain" },
      });
    }

    // Set content type to text/plain
    return new Response(content, {
      headers: {
        "Content-Type": "text/plain",
      },
    });
  } catch (error) {
    console.error("Error in llms.txt endpoint:", error);
    return new Response("Internal Server Error", {
      status: 500,
      headers: { "Content-Type": "text/plain" },
    });
  }
};
