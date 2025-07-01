export const config = {
  runtime: "edge",
};

import type { APIRoute } from "astro";
import { GET as getPages } from "./pages";
import { GET as getCollections } from "./collections";

interface PagesResponse {
  pagesProcessed: number;
}

interface CollectionsResponse {
  success: boolean;
  message: string;
}

export const POST: APIRoute = async ({ request, locals }) => {
  const runtime = locals.runtime;

  try {
    console.log("Received webhook from Webflow");

    const payload = await request.json();
    console.log("Webhook payload:", JSON.stringify(payload, null, 2));

    // Process pages first
    console.log("Processing pages...");
    const pagesResponse = await getPages({ url: request.url, locals } as any);
    if (!pagesResponse.ok) {
      throw new Error(`Failed to process pages: ${await pagesResponse.text()}`);
    }
    const pagesResult = (await pagesResponse.json()) as PagesResponse;
    console.log("Pages processed:", pagesResult);

    // Then process collections
    console.log("Processing collections...");
    const collectionsResponse = await getCollections({ locals } as any);
    if (!collectionsResponse.ok) {
      throw new Error(
        `Failed to process collections: ${await collectionsResponse.text()}`
      );
    }
    const collectionsResult =
      (await collectionsResponse.json()) as CollectionsResponse;
    console.log("Collections processed:", collectionsResult);

    return new Response(
      JSON.stringify({
        success: true,
        pagesProcessed: pagesResult.pagesProcessed || 0,
        collectionsProcessed:
          collectionsResult.message || "Collections updated",
        llmstxt: `${import.meta.env._BASE_URL}/llms.txt`,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
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
