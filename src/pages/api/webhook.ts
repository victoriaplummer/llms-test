export const config = {
  runtime: "edge",
};

import type { APIRoute } from "astro";
import { POST as regenerateLlms } from "./regenerate-llms";

interface PagesResponse {
  pagesProcessed: number;
}

interface CollectionsResponse {
  success: boolean;
  message: string;
}

export const POST: APIRoute = async ({ request, locals }) => {
  // Use env directly from locals
  // const env = (locals as any).runtime.env;

  try {
    console.log("Received webhook from Webflow");

    const payload = await request.json();
    console.log("Webhook payload:", JSON.stringify(payload, null, 2));

    // Call the regenerate-llms endpoint
    console.log("Triggering llms.txt regeneration...");
    const regenerationResponse = await regenerateLlms({
      locals,
      request,
    } as any);

    if (!regenerationResponse.ok) {
      throw new Error(
        `Failed to regenerate llms.txt: ${await regenerationResponse.text()}`
      );
    }

    // Forward the stream response from regenerateLlms
    return new Response(regenerationResponse.body, {
      status: regenerationResponse.status,
      headers: regenerationResponse.headers,
    });
  } catch (error) {
    console.error("Webhook Error:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to process webhook",
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
