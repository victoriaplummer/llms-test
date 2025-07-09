import { defineConfig } from "astro/config";
import cloudflare from "@astrojs/cloudflare";
import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";

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

  integrations: [react(), tailwindcss()],
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
