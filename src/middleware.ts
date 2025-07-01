import type { MiddlewareHandler } from "astro";
import { defineMiddleware } from "astro:middleware";
import { initializeComponentsCache } from "./utils/webflow/components";
import { fetchAllAssetsWithCache } from "./utils/webflow/components";
import { fetchComponents } from "./utils/webflow/components";

// Global store for development
const globalStore = new Map<string, string>();

// Simple mock KV for development
const createMockKV = (): App.Locals["webflowContent"] => {
  console.log("Creating mock KV with global store");
  console.log("Initial store contents:", Array.from(globalStore.entries()));

  return {
    get: async (key: string) => {
      console.log(`[MockKV] Getting key: ${key}`);
      const value = globalStore.get(key) ?? null;
      console.log(
        `[MockKV] Store contents at get:`,
        Array.from(globalStore.entries())
      );
      console.log(`[MockKV] Value for ${key}:`, value);
      return value;
    },
    put: async (key: string, value: string) => {
      console.log(`[MockKV] Setting key: ${key}`);
      console.log(`[MockKV] Value:`, value);
      globalStore.set(key, value);
      // console.log(
      //   `[MockKV] Store contents after put:`,
      //   Array.from(globalStore.entries())
      // );
    },
    delete: async (key: string) => {
      console.log(`[MockKV] Deleting key: ${key}`);
      globalStore.delete(key);
      // console.log(
      //   `[MockKV] Store contents after delete:`,
      //   Array.from(globalStore.entries())
      // );
    },
    list: async () => {
      console.log(`[MockKV] Listing keys`);
      const keys = Array.from(globalStore.keys()).map((name) => ({ name }));
      console.log(`[MockKV] Found keys:`, keys);
      return {
        keys,
        list_complete: true,
        cursor: "",
      };
    },
  };
};

// Create a singleton instance of MockKV for development
const mockKV = createMockKV();

// Define the minimal KV interface we need
interface MinimalKV {
  get(key: string): Promise<string | null>;
  put(key: string, value: string): Promise<void>;
  delete(key: string): Promise<void>;
  list(): Promise<{
    keys: { name: string }[];
    list_complete: boolean;
    cursor: string;
  }>;
}

// Extend Astro's Locals interface
declare global {
  interface Locals {
    webflowContent: MinimalKV;
    exposureSettings: MinimalKV;
  }
}

interface Env {
  WEBFLOW_CONTENT: KVNamespace;
  EXPOSURE_SETTINGS: KVNamespace;
}

// Create mock KV namespace for development
class MockKVNamespace implements MinimalKV {
  private store = new Map<string, string>();

  async get(key: string): Promise<string | null> {
    return this.store.get(key) || null;
  }

  async put(key: string, value: string): Promise<void> {
    this.store.set(key, value);
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key);
  }

  async list(): Promise<{
    keys: { name: string }[];
    list_complete: boolean;
    cursor: string;
  }> {
    return {
      keys: Array.from(this.store.keys()).map((key) => ({ name: key })),
      list_complete: true,
      cursor: "",
    };
  }
}

// Create mock KV namespaces for development
const mockWebflowContent = new MockKVNamespace();
const mockExposureSettings = new MockKVNamespace();

export const onRequest = defineMiddleware(async ({ locals }, next) => {
  // Initialize components and assets cache if not already done
  const siteId = import.meta.env.PUBLIC_WEBFLOW_SITE_ID;
  if (siteId) {
    try {
      // Initialize components cache (now includes component content cache)
      await fetchComponents(siteId, locals);

      // Initialize assets cache
      await fetchAllAssetsWithCache(siteId, locals);
    } catch (error) {
      console.error("Error initializing caches:", error);
    }
  }

  // In development, use mock KV namespaces
  if (import.meta.env.DEV) {
    locals.webflowContent = mockWebflowContent;
    locals.exposureSettings = mockExposureSettings;
  } else {
    // In production, use real KV namespaces
    const environment = locals.runtime.env as unknown as Env;
    locals.webflowContent = environment.WEBFLOW_CONTENT as unknown as MinimalKV;
    locals.exposureSettings =
      environment.EXPOSURE_SETTINGS as unknown as MinimalKV;
  }

  // Log the current state of the KV store
  console.log(
    "[Middleware] Current KV store contents:",
    Array.from(globalStore.entries())
  );

  const response = await next();

  // Log the state after the request
  console.log(
    "[Middleware] KV store contents after request:",
    Array.from(globalStore.entries())
  );

  return response;
});
