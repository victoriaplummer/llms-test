import type { APIRoute } from "astro";

interface PageConfig {
  isVisible: boolean;
  displayName?: string;
  description?: string;
}

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const settings = (await request.json()) as Record<string, PageConfig>;

    // Store settings in KV
    await locals.webflowContent.put(
      "page-settings",
      JSON.stringify({
        settings,
        timestamp: Date.now(),
      })
    );

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Error saving page settings:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to save page settings",
        message: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
};
