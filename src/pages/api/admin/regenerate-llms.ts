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

export const OPTIONS: APIRoute = async () => {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Accept",
    },
  });
};

export const POST: APIRoute = async () => {
  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
};
