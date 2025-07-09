import { defineConfig } from "astro/config";
import cloudflare from "@astrojs/cloudflare";
import react from "@astrojs/react";
import tailwind from "@astrojs/tailwind";

// https://astro.build/config
export default defineConfig({
  base: "/llmstxt",
  output: "server",
  build: {
    assetsPrefix: "/llmstxt",
  },
  markdown: {
    syntaxHighlight: "prism",
    remarkPlugins: [],
    rehypePlugins: [],
  },
  adapter: cloudflare({
    platformProxy: {
      enabled: true,
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
