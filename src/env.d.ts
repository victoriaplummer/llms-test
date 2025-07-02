/* eslint-disable @typescript-eslint/no-empty-interface */
type Runtime = import("@astrojs/cloudflare").Runtime<Env>;

declare namespace App {
  interface Locals extends Runtime {
    progressCallback?: (step: string) => void;
  }
}

/// <reference types="astro/client" />
/// <reference types="@cloudflare/workers-types" />

interface ImportMetaEnv {
  readonly PUBLIC_WEBFLOW_SITE_ID: string;
  readonly WEBFLOW_SITE_API_TOKEN: string;
  readonly BASE_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
