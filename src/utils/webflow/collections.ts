import type {
  WebflowCollection,
  WebflowCollectionItem,
  WebflowCollectionItemsResponse,
  WebflowCollectionSchema,
  WebflowCollectionField,
} from "../webflow-types";
import { webflow, withRateLimit, delay } from "./client";

// Cache for collections
let collectionsCache: Record<string, WebflowCollection[]> = {};
let collectionSchemasCache: Record<string, WebflowCollectionSchema> = {};
// Cache for resolved references to prevent circular references and improve performance
let referenceCache: Record<string, WebflowCollectionItem> = {};

interface Field {
  id: string;
  displayName: string;
  slug: string;
  type: string;
  required: boolean;
  editable: boolean;
  validations: Record<string, any>;
}

interface CollectionResponse {
  id: string;
  displayName: string;
  singularName?: string;
  slug?: string;
  lastUpdated: Date;
  createdOn: Date;
  fields: Field[];
}

/**
 * Fetches collection schema with field definitions
 * @param collectionId - The collection ID
 * @returns Promise resolving to collection schema
 */
export const fetchCollectionSchema = async (
  collectionId: string
): Promise<WebflowCollectionSchema> => {
  if (!collectionSchemasCache[collectionId]) {
    const apiResponse = (await withRateLimit(() =>
      webflow.collections.get(collectionId)
    )) as unknown as CollectionResponse;

    if (!apiResponse) {
      throw new Error("Failed to fetch collection schema");
    }

    const schema: WebflowCollectionSchema = {
      _id: apiResponse.id,
      lastUpdated: apiResponse.lastUpdated.toISOString(),
      createdOn: apiResponse.createdOn.toISOString(),
      name: apiResponse.displayName || apiResponse.id,
      slug: apiResponse.slug || "",
      singularName: apiResponse.singularName || "",
      fields: apiResponse.fields.map((field) => {
        // Check if the field is a multi-reference field
        const isMultiRef =
          field.type === "Reference" &&
          field.validations?.hasOwnProperty("maxCount") &&
          field.validations.maxCount !== 1;

        return {
          _id: field.id,
          name: field.slug,
          displayName: field.displayName,
          type: isMultiRef ? "MultiReference" : field.type,
          required: field.required,
          editable: field.editable,
          validations: field.validations || {},
        };
      }),
    };

    collectionSchemasCache[collectionId] = schema;
  }
  return collectionSchemasCache[collectionId];
};

/**
 * Fetches all collections for a site
 * @param siteId - The site ID
 * @returns Promise resolving to array of collections
 */
export const fetchCollections = async (
  siteId: string
): Promise<WebflowCollection[]> => {
  if (!collectionsCache[siteId]) {
    console.log("\nFetching collections for site:", siteId);

    // Call collections.list with siteId as direct parameter and cast to any to access raw response
    const response = (await withRateLimit(() =>
      webflow.collections.list(siteId)
    )) as any;

    console.log("\nCollections response:", JSON.stringify(response, null, 2));

    // Map API response to our collection type
    const mappedCollections = await Promise.all(
      (response?.collections || []).map(async (collection: any) => {
        console.log("\nProcessing collection:", collection.id);

        // Fetch schema for each collection to get fields
        const schema = await fetchCollectionSchema(collection.id);

        // Fetch first page of items to get total count
        console.log("\nFetching items count for collection:", collection.id);
        const itemsResponse = (await withRateLimit(() =>
          webflow.collections.items.listItemsLive(collection.id, { limit: 1 })
        )) as WebflowCollectionItemsResponse;

        console.log(
          "\nItems response:",
          JSON.stringify(itemsResponse, null, 2)
        );

        const itemCount = itemsResponse?.pagination?.total || 0;
        console.log("\nItem count:", itemCount);

        return {
          _id: collection.id,
          name: collection.displayName || collection.id,
          displayName: collection.displayName || collection.id,
          itemCount,
          fields: schema.fields,
        };
      })
    );

    collectionsCache[siteId] = mappedCollections;
  }
  return collectionsCache[siteId];
};

/**
 * Resolves a single reference field by fetching the referenced item
 * @param collectionId - The collection ID containing the referenced item
 * @param itemId - The ID of the referenced item
 * @returns Promise resolving to the referenced item data with collection info
 */
async function resolveReference(
  collectionId: string,
  itemId: string
): Promise<{
  id: string;
  collectionName: string;
  resolved: Record<string, any>;
} | null> {
  // Check cache first
  const cacheKey = `${collectionId}:${itemId}`;
  if (referenceCache[cacheKey]) {
    return {
      id: itemId,
      collectionName: referenceCache[cacheKey].collectionName!,
      resolved: referenceCache[cacheKey].fieldData,
    };
  }

  try {
    // Get collection info first
    const schema = await fetchCollectionSchema(collectionId);

    // Fetch the referenced item
    const response = (await withRateLimit(() =>
      webflow.collections.items.getItemLive(collectionId, itemId)
    )) as WebflowCollectionItem;

    if (!response) {
      console.warn(
        `Referenced item ${itemId} not found in collection ${collectionId}`
      );
      return null;
    }

    // Cache the result with collection info
    referenceCache[cacheKey] = {
      ...response,
      collectionName: schema.name,
    };

    return {
      id: itemId,
      collectionName: schema.name,
      resolved: response.fieldData,
    };
  } catch (error) {
    console.error(
      `Error resolving reference ${itemId} in collection ${collectionId}:`,
      error
    );
    return null;
  }
}

/**
 * Resolves all reference fields in an item's data
 * @param item - The collection item containing reference fields
 * @param schema - The collection schema defining field types
 * @returns Promise resolving to item data with resolved references
 */
export async function resolveReferenceFields(
  item: WebflowCollectionItem,
  schema: WebflowCollectionSchema
): Promise<WebflowCollectionItem> {
  const resolvedItem = { ...item };
  const referenceFields = schema.fields.filter(
    (field) => field.type === "Reference" || field.type === "MultiReference"
  );

  // No reference fields, return original item
  if (!referenceFields.length) {
    return resolvedItem;
  }

  // Process each reference field
  for (const field of referenceFields) {
    const fieldValue = item.fieldData[field.name];
    if (!fieldValue) continue;

    try {
      // Get the collection ID from the field validations
      const collectionId = field.validations?.collectionId;
      if (!collectionId) {
        console.warn(
          `No collection ID found for reference field ${field.name}`
        );
        continue;
      }

      if (field.type === "Reference") {
        // Single reference
        const referencedItem = await resolveReference(collectionId, fieldValue);
        if (referencedItem) {
          resolvedItem.fieldData[field.name] = referencedItem;
        }
      } else {
        // Multi-reference
        const resolvedItems = await Promise.all(
          (Array.isArray(fieldValue) ? fieldValue : [fieldValue]).map(
            async (refId) => {
              const referencedItem = await resolveReference(
                collectionId,
                refId
              );
              return referencedItem;
            }
          )
        );
        resolvedItem.fieldData[field.name] = resolvedItems.filter(Boolean);
      }
    } catch (error) {
      console.error(`Error resolving reference field ${field.name}:`, error);
    }
  }

  return resolvedItem;
}

/**
 * Fetches all published items from a collection using pagination
 * @param collectionId - The collection ID
 * @param pageSize - Number of items per page (default: 100, max: 100)
 * @returns Promise resolving to array of all published collection items
 */
export const fetchAllCollectionItems = async (
  collectionId: string,
  pageSize = 100
): Promise<WebflowCollectionItem[]> => {
  let allItems: WebflowCollectionItem[] = [];
  let currentOffset = 0;
  let hasMore = true;

  // Fetch schema first to identify reference fields
  const schema = await fetchCollectionSchema(collectionId);

  while (hasMore) {
    if (currentOffset > 0) {
      await delay(500);
    }

    console.log(
      `\nFetching items for collection ${collectionId} (offset: ${currentOffset})`
    );
    const response = (await withRateLimit(() =>
      webflow.collections.items.listItemsLive(collectionId, {
        limit: pageSize,
        offset: currentOffset,
      })
    )) as WebflowCollectionItemsResponse;

    console.log("\nAPI Response:", JSON.stringify(response, null, 2));

    if (!response?.items?.length) {
      break;
    }

    // Resolve references for each item
    const resolvedItems = await Promise.all(
      response.items.map((item) => resolveReferenceFields(item, schema))
    );

    allItems = [...allItems, ...resolvedItems];

    const { limit, total } = response.pagination;
    currentOffset += limit;
    hasMore = currentOffset < total;
  }

  return allItems;
};
