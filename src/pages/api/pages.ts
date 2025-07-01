export const config = {
  runtime: "edge",
};

import type { APIRoute } from "astro";
import {
  webflow,
  delay,
  withRateLimit,
  fetchAllPages,
} from "../../utils/webflow-client";
import { processWebflowPage } from "../../services/webflow-content";
import type { ProcessedPage } from "../../utils/webflow-types";
import { updateLLMSSection } from "../../utils/kv-helpers";

export const GET: APIRoute = async ({ url, locals }) => {
  const runtime = locals.runtime;
  try {
    console.log("Starting pages API request");

    // Log environment variables (excluding sensitive data)
    console.log(
      "Attempting to fetch sites with Site ID:",
      import.meta.env.PUBLIC_WEBFLOW_SITE_ID
    );

    // Get Sites - with rate limit handling
    const sites = await withRateLimit(() => webflow.sites.list());
    console.log("Sites response:", JSON.stringify(sites, null, 2));

    // Get Site
    const site = sites?.sites?.find(
      (site) => site.id === import.meta.env.PUBLIC_WEBFLOW_SITE_ID
    );

    if (!site) {
      console.error(
        "Site not found with ID:",
        import.meta.env.PUBLIC_WEBFLOW_SITE_ID
      );
      return new Response(
        JSON.stringify({
          error: "Site not found",
          siteId: import.meta.env.PUBLIC_WEBFLOW_SITE_ID,
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Get all pages with pagination
    console.log("Found site:", site.id, "Fetching all pages...");
    const pages = await fetchAllPages(site.id);
    console.log("Retrieved pages:", pages.length);

    // Check if Pages are found
    if (!pages?.length) {
      console.error("No pages found for site:", site.id);
      return new Response(
        JSON.stringify({
          error: "Pages not found",
          siteId: site.id,
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Load exposure settings
    const settings = await locals.exposureSettings.get("settings");
    console.log("Loaded exposure settings:", settings);

    const pageSettings = settings ? JSON.parse(settings).pages || {} : {};
    console.log("Page settings:", JSON.stringify(pageSettings, null, 2));

    // Filter to only exposed pages
    const exposedPages = pages.filter((page) => {
      const pageConfig = pageSettings[page.id];
      const isVisible = pageConfig?.isVisible === true; // Explicitly check for true
      console.log(`Page ${page.id} (${page.title}) visibility:`, {
        hasConfig: !!pageConfig,
        configValue: pageConfig?.isVisible,
        isVisible,
      });
      return isVisible;
    });
    console.log(`${exposedPages.length} pages are configured for exposure`);

    // If no pages are exposed, return early
    if (exposedPages.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: "No pages are configured for exposure",
          pages: [],
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Process Pages with rate limiting and parallel batching
    const processedPages: ProcessedPage[] = [];
    const mainPages: string[] = [];
    const optionalPages: string[] = [];
    const pagesContent: string[] = [
      "The following pages are available in the Webflow site:",
      "",
    ];

    // Process each page sequentially
    for (const page of exposedPages) {
      locals.progressCallback?.(`Processing page ${page.id}...`);

      try {
        console.log(`Processing page ${page.id}...`);
        const processedPage = await processWebflowPage(page.id, locals);
        processedPages.push(processedPage);

        // Use custom display name and description if set
        const pageConfig = pageSettings[page.id];
        const title =
          pageConfig?.displayName ||
          processedPage.metadata?.title ||
          page.title ||
          "Untitled";
        const description =
          pageConfig?.description ||
          processedPage.metadata?.description ||
          page.seo?.description ||
          page.openGraph?.description ||
          "";
        const basePath = import.meta.env.BASE_URL;
        const pageEntry = `- [${title}](${basePath}/docs/${
          processedPage.fileName
        })${description ? ": " + description : ""}`;

        // Add to appropriate section based on importance
        if (pageConfig?.isOptional) {
          optionalPages.push(pageEntry);
        } else {
          mainPages.push(pageEntry);
        }
      } catch (error) {
        console.error(`Error processing page ${page.id}:`, error);
        continue;
      }

      // Add a small delay between pages
      await delay(500);
    }

    // Add main pages
    pagesContent.push(...mainPages, "");

    // Add optional pages if any exist
    if (optionalPages.length > 0) {
      pagesContent.push("## Optional Pages", "", ...optionalPages, "");
    }

    // Update Pages section in llms.txt
    console.log("Updating Pages section in llms.txt");
    locals.progressCallback?.("Updating pages section...");
    await updateLLMSSection(locals.webflowContent, "Pages", pagesContent);
    console.log("Successfully updated Pages section");

    return new Response(JSON.stringify(processedPages), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    // Log the full error
    console.error("API Error:", error);

    return new Response(
      JSON.stringify({
        error: "Failed to fetch page data",
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
