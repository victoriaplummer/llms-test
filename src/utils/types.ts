/**
 * Minimal KV interface for our KV operations
 */
export interface KVNamespaceListKey {
  name: string;
  expiration?: number;
  metadata?: object;
}

export interface KVNamespaceListResult {
  keys: KVNamespaceListKey[];
  list_complete: boolean;
  cursor?: string;
  cacheStatus?: string | null;
}

export interface MinimalKV {
  get(key: string): Promise<string | null>;
  put(key: string, value: string): Promise<void>;
  delete(key: string): Promise<void>;
  list(options?: {
    prefix?: string;
    limit?: number;
    cursor?: string;
  }): Promise<KVNamespaceListResult>;
}

// Extend the global namespace to include our runtime types
// Used for Astro's context.locals augmentation
declare global {
  interface Env {
    WEBFLOW_CONTENT: KVNamespace;
    EXPOSURE_SETTINGS: KVNamespace;
  }
  interface Locals {
    webflowContent: MinimalKV;
    exposureSettings: MinimalKV;
  }
}
