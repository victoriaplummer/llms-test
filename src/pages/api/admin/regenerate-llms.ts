export const config = {
  runtime: "edge",
};

import type { APIRoute } from "astro";
import { GET as getCollections } from "../collections";
import { GET as getPages } from "../pages";
import { createWebflowClient } from "../../../utils/webflow/client";
import type { ProcessedPage } from "../../../types";
import {
  loadExposureSettings,
  isCollectionExposed,
} from "../../../utils/collection-exposure";

const basePath = import.meta.env.BASE_URL;

interface ErrorResponse {
  error: string;
  message?: string;
}

// Helper to send progress events
const sendProgress = (
  controller: ReadableStreamDefaultController,
  message: string
) => {
  const encoder = new TextEncoder();
  controller.enqueue(
    encoder.encode(`data: ${JSON.stringify({ message })}\n\n`)
  );
};

/**
 * Creates the initial llms.txt content
 */
const createInitialContent = async (locals: App.Locals) => {
  // Get site info from Cloudflare Worker env
  const siteId = (locals as any).runtime.env.WEBFLOW_SITE_ID;
  const accessToken = (locals as any).runtime.env.WEBFLOW_SITE_API_TOKEN;
  if (!accessToken) throw new Error("Missing Webflow API token");
  const webflow = createWebflowClient(accessToken);

  const sites = await webflow.sites.list();
  const site = sites?.sites?.find((s: any) => s.id === siteId);

  return [
    `# ${site?.displayName || "Webflow Documentation"}`,
    "",
    `> This is the documentation for ${
      site?.displayName || "our Webflow site"
    }, providing information about our pages and content.`,
    "",
    "## Important Notes",
    "",
    "- All content is automatically generated from our Webflow site",
    "- Each page and collection has a clean markdown version available at the same URL with .md appended",
    "- Content is updated whenever changes are published in Webflow",
    "",
  ].join("\n");
};

export const POST: APIRoute = async ({ locals, request }) => {
  try {
    // Load exposure settings first
    await loadExposureSettings((locals as any).exposureSettings);

    // Create a stream to send progress events
    const stream = new ReadableStream({
      async start(controller) {
        try {
          console.log("Starting llms.txt regeneration");
          sendProgress(controller, "Initializing...");

          // Attach progressCallback directly to the existing locals object
          (locals as any).progressCallback = (step: string) => {
            try {
              sendProgress(controller, step);
            } catch (error) {
              // Ignore errors from closed controller
              if (
                error instanceof TypeError &&
                error.message.includes("Controller is closed")
              ) {
                console.debug("Progress update skipped - controller closed");
              } else {
                console.warn(`Progress callback error: ${error}`);
              }
            }
          };

          // Create initial content
          const initialContent = await createInitialContent(locals);
          await (locals as any).webflowContent.put("llms.txt", initialContent);

          // Call collections endpoint with progress callback
          console.log("Regenerating collections content...");
          sendProgress(controller, "Fetching collections...");
          const collectionsResponse = await getCollections({
            locals,
            request,
            url: new URL(request.url),
          } as any);

          const collectionsData = (await collectionsResponse.json()) as
            | ErrorResponse
            | { collections: any[] };
          if (!collectionsResponse.ok) {
            throw new Error(
              `Collections endpoint failed: ${
                (collectionsData as ErrorResponse).error ||
                collectionsResponse.statusText
              }`
            );
          }

          // Call pages endpoint with progress callback
          console.log("Regenerating pages content...");
          sendProgress(controller, "Fetching pages...");
          const pagesResponse = await getPages({
            locals,
            request,
            url: new URL(request.url),
          } as any);

          const pagesData = (await pagesResponse.json()) as
            | ErrorResponse
            | ProcessedPage[];
          if (!pagesResponse.ok) {
            throw new Error(
              `Pages endpoint failed: ${
                (pagesData as ErrorResponse).error || pagesResponse.statusText
              }`
            );
          }

          // Send completion event and close stream
          sendProgress(controller, "Finalizing...");
          controller.close();
        } catch (error) {
          console.error("Error in stream:", error);
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Error regenerating llms.txt:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
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
