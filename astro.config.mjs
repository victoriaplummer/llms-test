import { defineConfig } from "astro/config";

import cloudflare from "@astrojs/cloudflare";

import react from "@astrojs/react";

import tailwind from "@astrojs/tailwind";

// https://astro.build/config
export default defineConfig({
  base: "/llms",
  site: "http://localhost:4321",
  trailingSlash: "ignore",
  prefetch: true,
  output: "server",
  markdown: {
    syntaxHighlight: "prism",
    remarkPlugins: [],
    rehypePlugins: [],
  },
  adapter: cloudflare({
    platformProxy: {
      enabled: true,
    },
    mode: "directory",
    runtime: {
      mode: "local",
      type: "pages",
      bindings: {
        // This name must match the KV namespace name in wrangler.toml
        WEBFLOW_CONTENT: {
          type: "kv",
        },
      },
    },
  }),

  integrations: [react(), tailwind()],
  vite: {
    build: {
      commonjsOptions: {
        transformMixedEsModules: true,
      },
    },
    resolve: {
      alias: {
        ...(import.meta.env.PROD
          ? {
              "react-dom/server": "react-dom/server.edge",
            }
          : {}),
      },
    },
    optimizeDeps: {
      include: ["webflow-api"],
      exclude: ["jsdom"],
    },
  },
});
