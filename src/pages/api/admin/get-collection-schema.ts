export const config = {
  runtime: "edge",
};

import type { APIRoute } from "astro";
import { fetchCollectionSchema } from "../../../utils/webflow/collections";

export const GET: APIRoute = async ({ params, request, locals }) => {
  const runtime = locals.runtime;

  try {
    const url = new URL(request.url);
    const collectionId = url.searchParams.get("id");

    if (!collectionId) {
      return new Response("Collection ID is required", { status: 400 });
    }

    const schema = await fetchCollectionSchema(collectionId);
    return new Response(JSON.stringify(schema), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching collection schema:", error);
    return new Response("Failed to fetch collection schema", { status: 500 });
  }
};
