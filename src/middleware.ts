import type { MiddlewareHandler } from "astro";
import { defineMiddleware } from "astro:middleware";
import { initializeComponentsCache } from "./utils/webflow/components";
import { fetchAllAssetsWithCache } from "./utils/webflow/components";
import { fetchComponents } from "./utils/webflow/components";
import type { MinimalKV, KVNamespaceListResult } from "./utils/types";

// Global store for development
const globalStore = new Map<string, string>();

interface Env {
  WEBFLOW_CONTENT: KVNamespace;
  EXPOSURE_SETTINGS: KVNamespace;
}

// Create mock KV namespace for development
class MockKVNamespace implements MinimalKV {
  constructor(private store: Map<string, string>) {}

  async get(key: string): Promise<string | null> {
    console.log(`[MockKV] Getting key: ${key}`);
    const value = this.store.get(key) ?? null;
    console.log(`[MockKV] Value for ${key}:`, value);
    return value;
  }

  async put(key: string, value: string): Promise<void> {
    console.log(`[MockKV] Setting key: ${key}`);
    console.log(`[MockKV] Value:`, value);
    this.store.set(key, value);
  }

  async delete(key: string): Promise<void> {
    console.log(`[MockKV] Deleting key: ${key}`);
    this.store.delete(key);
  }

  async list(options?: {
    prefix?: string;
    limit?: number;
    cursor?: string;
  }): Promise<KVNamespaceListResult> {
    console.log(`[MockKV] Listing keys`);
    const allKeys = Array.from(this.store.keys()).filter(
      (key) => !options?.prefix || key.startsWith(options.prefix)
    );

    const limit = options?.limit || 1000;
    const startIndex = options?.cursor ? parseInt(options.cursor) : 0;
    const endIndex = Math.min(startIndex + limit, allKeys.length);

    const keys = allKeys
      .slice(startIndex, endIndex)
      .map((key) => ({ name: key }));

    console.log(`[MockKV] Found keys:`, keys);
    return {
      keys,
      list_complete: endIndex >= allKeys.length,
      cursor: endIndex < allKeys.length ? endIndex.toString() : undefined,
      cacheStatus: null,
    };
  }
}

// Create mock KV namespaces for development using the same global store
const mockWebflowContent = new MockKVNamespace(globalStore);
const mockExposureSettings = new MockKVNamespace(globalStore);

// Fallback KV implementation for when bindings are not available
class FallbackKVNamespace implements MinimalKV {
  async get(key: string): Promise<string | null> {
    console.warn(
      `[FallbackKV] Attempted to get key: ${key} but KV binding is not available`
    );
    return null;
  }

  async put(key: string, value: string): Promise<void> {
    console.warn(
      `[FallbackKV] Attempted to put key: ${key} but KV binding is not available`
    );
  }

  async delete(key: string): Promise<void> {
    console.warn(
      `[FallbackKV] Attempted to delete key: ${key} but KV binding is not available`
    );
  }

  async list(options?: {
    prefix?: string;
    limit?: number;
    cursor?: string;
  }): Promise<KVNamespaceListResult> {
    console.warn(
      `[FallbackKV] Attempted to list keys but KV binding is not available`
    );
    return {
      keys: [],
      list_complete: true,
      cursor: undefined,
      cacheStatus: null,
    };
  }
}

// Helper function to wrap KVNamespace as MinimalKV
function wrapKVNamespace(kv: KVNamespace): MinimalKV {
  return {
    get: (key: string) => kv.get(key),
    put: (key: string, value: string) => kv.put(key, value),
    delete: (key: string) => kv.delete(key),
    list: (options?: { prefix?: string; limit?: number; cursor?: string }) =>
      kv.list(options),
  };
}

// Add runtime directive for edge
export const onRequest: MiddlewareHandler = defineMiddleware(
  async (context, next) => {
    // Initialize components and assets cache if not already done
    const siteId = import.meta.env.WEBFLOW_SITE_ID;
    if (siteId) {
      try {
        // Initialize components cache (now includes component content cache)
        await fetchComponents(siteId, context.locals);

        // Initialize assets cache
        await fetchAllAssetsWithCache(siteId, context.locals);
      } catch (error) {
        console.error("Error initializing caches:", error);
      }
    }

    // In development, use mock KV namespaces
    if (import.meta.env.DEV) {
      context.locals.webflowContent = mockWebflowContent;
      context.locals.exposureSettings = mockExposureSettings;
    } else {
      // In production, use real KV namespaces or fallback
      try {
        // Access runtime environment through context.locals.runtime
        const runtime = context.locals.runtime;

        // Enhanced debugging for runtime environment
        console.log("[Middleware] Debug Info:", {
          isDev: import.meta.env.DEV,
          hasRuntime: !!runtime,
          runtimeType: typeof runtime,
          runtimeKeys: runtime ? Object.keys(runtime) : [],
          runtimeEnv: runtime?.env ? Object.keys(runtime.env) : [],
          contextLocals: Object.keys(context.locals),
          envVars: {
            hasWebflowSiteId: !!import.meta.env.WEBFLOW_SITE_ID,
            hasBaseUrl: !!import.meta.env.BASE_URL,
          },
          runtimeEnvVars: runtime?.env
            ? {
                hasWebflowSiteId: !!runtime.env.WEBFLOW_SITE_ID,
                hasBaseUrl: !!runtime.env.BASE_URL,
              }
            : undefined,
        });

        // Try different ways to access KV bindings
        const env = (runtime?.env ??
          runtime ??
          context.locals) as unknown as Env;

        // Log available bindings
        console.log("[Middleware] KV Bindings Debug:", {
          hasWebflowContent: !!env?.WEBFLOW_CONTENT,
          webflowContentType: env?.WEBFLOW_CONTENT
            ? typeof env.WEBFLOW_CONTENT
            : "undefined",
          webflowContentMethods: env?.WEBFLOW_CONTENT
            ? Object.keys(env.WEBFLOW_CONTENT)
            : [],
          hasExposureSettings: !!env?.EXPOSURE_SETTINGS,
          exposureSettingsType: env?.EXPOSURE_SETTINGS
            ? typeof env.EXPOSURE_SETTINGS
            : "undefined",
          exposureSettingsMethods: env?.EXPOSURE_SETTINGS
            ? Object.keys(env.EXPOSURE_SETTINGS)
            : [],
        });

        // Verify KV bindings exist and are accessible
        if (
          !env?.WEBFLOW_CONTENT ||
          typeof env.WEBFLOW_CONTENT.get !== "function"
        ) {
          console.error("[Middleware] WEBFLOW_CONTENT KV binding details:", {
            binding: env?.WEBFLOW_CONTENT,
            type: typeof env?.WEBFLOW_CONTENT,
            methods: env?.WEBFLOW_CONTENT
              ? Object.keys(env.WEBFLOW_CONTENT)
              : [],
          });
          throw new Error("WEBFLOW_CONTENT KV binding not found or invalid");
        }

        if (
          !env?.EXPOSURE_SETTINGS ||
          typeof env.EXPOSURE_SETTINGS.get !== "function"
        ) {
          console.error("[Middleware] EXPOSURE_SETTINGS KV binding details:", {
            binding: env?.EXPOSURE_SETTINGS,
            type: typeof env?.EXPOSURE_SETTINGS,
            methods: env?.EXPOSURE_SETTINGS
              ? Object.keys(env.EXPOSURE_SETTINGS)
              : [],
          });
          throw new Error("EXPOSURE_SETTINGS KV binding not found or invalid");
        }

        // Assign KV bindings to context.locals using wrapper
        context.locals.webflowContent = wrapKVNamespace(env.WEBFLOW_CONTENT);
        context.locals.exposureSettings = wrapKVNamespace(
          env.EXPOSURE_SETTINGS
        );

        // Verify bindings are working by attempting a test read
        try {
          const testKey = "__test_key__";
          await context.locals.webflowContent.get(testKey);
          await context.locals.exposureSettings.get(testKey);
          console.log("[Middleware] KV bindings verified working");
        } catch (error) {
          console.error("[Middleware] KV binding test failed:", error);
          throw error;
        }
      } catch (error) {
        console.error("[Middleware] Error initializing KV namespaces:", error);
        // Use fallback implementations
        context.locals.webflowContent = new FallbackKVNamespace();
        context.locals.exposureSettings = new FallbackKVNamespace();
      }
    }

    // Log the current state of the KV store in development
    if (import.meta.env.DEV) {
      console.log(
        "[Middleware] Current KV store contents:",
        Array.from(globalStore.entries())
      );
    }

    const response = await next();

    // Log the state after the request in development
    if (import.meta.env.DEV) {
      console.log(
        "[Middleware] KV store contents after request:",
        Array.from(globalStore.entries())
      );
    }

    return response;
  }
);
