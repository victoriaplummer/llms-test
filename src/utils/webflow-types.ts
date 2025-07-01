/**
 * @fileoverview Type definitions for Webflow API integration
 *
 * This file contains TypeScript type definitions for working with the Webflow API
 * and managing collection exposure settings. It includes types for:
 * - Webflow API responses
 * - Collection and field configurations
 * - Page content and metadata
 * - Component data structures
 *
 * @example Basic usage with collections
 * ```typescript
 * const collection: WebflowCollection = {
 *   _id: "123",
 *   name: "blog-posts",
 *   displayName: "Blog Posts",
 *   itemCount: 10,
 *   fields: []
 * };
 *
 * const exposureConfig: ExposureConfig = {
 *   collections: {
 *     "123": {
 *       id: "123",
 *       displayName: "Blog Posts",
 *       description: "Our blog posts collection",
 *       fields: {
 *         "title": {
 *           include: true,
 *           displayName: "Post Title",
 *           description: "The title of the blog post"
 *         }
 *       }
 *     }
 *   }
 * };
 * ```
 */

/**
 * Represents a Webflow node with its various possible types and properties
 * Can be a text node, image, form element, or component instance
 */
export interface WebflowNode {
  id: string;
  type: string;
  text?: {
    html: string | null;
    text: string | null;
  };
  image?: {
    alt: string;
    assetId: string | null;
  };
  choices?: Array<{ value: string; text: string }>;
  placeholder?: string;
  value?: string;
  waitingText?: string;
  attributes?: Record<string, string>;
  componentId?: string;
  propertyOverrides?: Array<{
    propertyId: string;
    type: string;
    label: string;
    text?: {
      html: string | null;
      text: string | null;
    };
  }>;
  [key: string]: any;
}

/**
 * Response structure from Webflow's getContent API for components
 */
export interface ComponentData {
  nodes: WebflowNode[];
  pagination?: WebflowPagination;
}

/**
 * Page metadata from Webflow
 */
export interface PageMetadata {
  id: string;
  title: string;
  slug: string;
  description: string;
  last_updated: string;
}

/**
 * Webflow pagination metadata
 */
export interface WebflowPagination {
  limit: number;
  offset: number;
  total: number;
}

/**
 * Webflow page data
 */
export interface WebflowPage {
  id: string;
  siteId: string;
  title: string;
  slug: string;
  draft: boolean;
  archived: boolean;
  lastUpdated: string;
  createdOn: string;
  publishedPath?: string;
  seo?: {
    title?: string;
    description?: string;
  };
  openGraph?: {
    title?: string;
    description?: string;
  };
}

/**
 * Webflow pages list response
 */
export interface WebflowPagesResponse {
  pages: WebflowPage[];
  pagination: {
    limit: number;
    offset: number;
    total: number;
  };
}

/**
 * Processed page data structure
 */
export interface ProcessedPage {
  id: string;
  content: string[];
  fileName: string;
  metadata?: PageMetadata;
}

/**
 * Webflow page content response
 */
export interface WebflowPageContentResponse {
  nodes: WebflowNode[];
  pagination: WebflowPagination;
}

/**
 * Webflow collection data
 */
export interface WebflowCollection {
  _id: string;
  name: string;
  displayName: string;
  itemCount: number;
  fields: WebflowCollectionField[];
}

/**
 * Webflow collection item data
 */
export interface WebflowCollectionItem {
  id: string;
  lastPublished: string;
  lastUpdated: string;
  createdOn: string;
  fieldData: Record<string, any>;
  cmsLocaleId: string;
  isArchived: boolean;
  isDraft: boolean;
  collectionName?: string;
}

/**
 * Webflow collection items response
 */
export interface WebflowCollectionItemsResponse {
  items: WebflowCollectionItem[];
  pagination: {
    limit: number;
    offset: number;
    total: number;
  };
}

/**
 * Webflow collection schema field
 */
export interface WebflowCollectionField {
  _id: string;
  name: string;
  displayName: string;
  type: string;
  required: boolean;
  editable: boolean;
  validations: Record<string, any>;
}

/**
 * Webflow collection schema
 */
export interface WebflowCollectionSchema {
  _id: string;
  lastUpdated: string;
  createdOn: string;
  name: string;
  slug: string;
  singularName: string;
  fields: WebflowCollectionField[];
}

/**
 * Webflow collections response
 */
export interface WebflowCollectionsResponse {
  collections: WebflowCollection[];
}

/**
 * Configuration for exposed collection fields
 * This type is used to control how collection fields are exposed in the public API
 * and documentation.
 *
 * @example
 * ```typescript
 * const fieldConfig: CollectionFieldExposure = {
 *   displayName: "Author Name",
 *   include: true,
 *   description: "The full name of the post author"
 * };
 * ```
 */
export interface CollectionFieldExposure {
  /** Display name to use in the documentation */
  displayName?: string;
  /** Whether to include this field in the documentation */
  include: boolean;
  /** Optional description of the field */
  description?: string;
}

/**
 * Configuration for an exposed collection
 */
export interface ExposedCollection {
  /** Collection ID from Webflow */
  id: string;
  /** Override the collection name in documentation */
  displayName?: string;
  /** Collection description */
  description?: string;
  /** Fields to expose and their configuration */
  fields: Record<string, CollectionFieldExposure>;
}

/**
 * Configuration for all exposed collections
 */
export interface ExposureConfig {
  collections: Record<
    string,
    {
      id: string;
      displayName?: string;
      description?: string;
      fields: Record<
        string,
        {
          include: boolean;
          displayName?: string;
          description?: string;
        }
      >;
    }
  >;
}

export interface WebflowSite {
  id: string;
  displayName?: string;
  shortName?: string;
  previewUrl?: string;
  timezone?: string;
  createdOn: string;
  lastPublished?: string;
  database?: string;
}
