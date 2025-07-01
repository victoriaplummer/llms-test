import type { APIRoute } from "astro";

export const GET: APIRoute = async ({ locals, url }) => {
  try {
    // Log the incoming request URL for debugging
    console.log("Incoming request URL:", url.toString());

    // Get llms.txt content from KV
    const content = await locals.webflowContent.get("llms.txt");

    // Log the content we got
    console.log("Retrieved content:", content);

    if (!content) {
      console.log("No content found in KV store");
      return new Response(
        "Content has not been generated yet. Please:\n\n" +
          "1. Visit the admin interface at /\n" +
          "2. Configure which collections and pages to expose\n" +
          "3. Click 'Regenerate llms.txt' to generate the content\n",
        {
          status: 404,
          headers: {
            "Content-Type": "text/plain",
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
            Expires: "0",
          },
        }
      );
    }

    // Return the content with appropriate headers
    return new Response(content, {
      headers: {
        "Content-Type": "text/plain",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    });
  } catch (error) {
    console.error("Error retrieving llms.txt content:", error);
    return new Response(
      `Error retrieving content: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
      {
        status: 500,
        headers: {
          "Content-Type": "text/plain",
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      }
    );
  }
};
