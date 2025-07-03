// Astro middleware to attach KV namespaces to context.locals (Cloudflare in prod, in-memory mock in dev)
import type { MiddlewareHandler } from "astro";
import { defineMiddleware } from "astro:middleware";
import { MockKVNamespace } from "./utils/mock-kv";

// Create shared instances at the module level for dev
const devWebflowContent = new MockKVNamespace();
const devExposureSettings = new MockKVNamespace();

export const onRequest: MiddlewareHandler = defineMiddleware(
  async (context, next) => {
    console.log("context locals", context.locals);

    // Log asset requests in production
    if (import.meta.env.PROD) {
      const url = context.request.url;
      if (
        url.includes("/_astro/") ||
        url.match(/\.(css|js|svg|png|jpg|jpeg|woff2?)($|\?)/)
      ) {
        console.log("[PROD ASSET REQUEST]", url);
      }
    }
    if (import.meta.env.DEV) {
      (context.locals as any).webflowContent = (
        context as any
      ).locals.runtime.env.WEBFLOW_CONTENT;
      (context.locals as any).exposureSettings = (
        context as any
      ).locals.runtime.env.EXPOSURE_SETTINGS;
    } else {
      (context.locals as any).webflowContent = (
        context as any
      ).locals.runtime.env.WEBFLOW_CONTENT;
      (context.locals as any).exposureSettings = (
        context as any
      ).locals.runtime.env.EXPOSURE_SETTINGS;
    }
    return next();
  }
);
