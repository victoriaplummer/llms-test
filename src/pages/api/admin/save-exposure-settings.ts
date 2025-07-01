export const config = {
  runtime: "edge",
};

/**
 * @fileoverview API endpoint for saving collection exposure settings
 * This endpoint handles the persistence of collection and field visibility settings
 * to Cloudflare KV storage.
 */

import type { APIRoute } from "astro";
import type { ExposureConfig } from "../../../utils/webflow-types";

/**
 * POST handler for saving exposure settings
 *
 * @endpoint POST /api/admin/save-exposure-settings
 *
 * @description
 * Saves the collection exposure settings to Cloudflare KV storage. These settings
 * control which collections and fields are exposed through the public API.
 *
 * @requestBody {ExposureConfig} settings
 * ```typescript
 * {
 *   collections: {
 *     [collectionId: string]: {
 *       id: string;
 *       displayName?: string;
 *       description?: string;
 *       isVisible?: boolean;
 *       fields: {
 *         [fieldId: string]: {
 *           include: boolean;
 *           displayName?: string;
 *           description?: string;
 *         }
 *       }
 *     }
 *   }
 * }
 * ```
 *
 * @returns {Object} Response
 * ```typescript
 * {
 *   success: boolean;
 *   message?: string;
 *   error?: string;
 * }
 * ```
 *
 * @throws {400} Invalid settings format
 * @throws {500} Internal server error
 */
export const POST: APIRoute = async ({ request, locals }) => {
  const runtime = locals.runtime;

  try {
    const settings = (await request.json()) as ExposureConfig;

    // Validate settings structure
    if (!settings || typeof settings !== "object" || !settings.collections) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Invalid settings format",
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Save settings to KV
    await locals.exposureSettings.put("settings", JSON.stringify(settings));

    return new Response(
      JSON.stringify({
        success: true,
        message: "Settings saved successfully",
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error saving settings:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Failed to save settings",
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
