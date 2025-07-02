/* eslint-disable @typescript-eslint/no-empty-interface */
type Runtime = import("@astrojs/cloudflare").Runtime<Env>;

declare namespace App {
  interface Locals extends Runtime {}
}

/// <reference types="astro/client" />
/// <reference types="@cloudflare/workers-types" />

interface ImportMetaEnv {
  readonly WEBFLOW_SITE_ID: string;
  readonly WEBFLOW_SITE_API_TOKEN: string;
  readonly BASE_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface Locals {
  KV: KVNamespace;
  webflowContent: MinimalKV;
  DB: D1Database;
  exposureSettings: MinimalKV;
}

interface MinimalKV {
  get: (key: string) => Promise<string | null>;
  put: (key: string, value: string) => Promise<void>;
  delete: (key: string) => Promise<void>;
  list: () => Promise<{
    keys: Array<{ name: string }>;
    list_complete: boolean;
    cursor: string;
  }>;
}

// Extend Astro's Locals interface to include our KV namespace
declare namespace App {
  interface Locals {
    webflowContent: MinimalKV;
    exposureSettings: MinimalKV;
    progressCallback?: (step: string) => void;
  }
}
