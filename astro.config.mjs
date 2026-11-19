import cloudflare from "@astrojs/cloudflare";
import sitemap from "@astrojs/sitemap";
import { defineConfig } from "astro/config";

// Prerendered pages on the Cloudflare adapter. Sessions stay off so deploy
// does not provision a KV namespace. Images are plain <img> tags, so the
// image service does not need a Cloudflare Images binding.
export default defineConfig({
  site: "https://badgifts.shop",
  output: "static",
  trailingSlash: "always",
  session: false,
  adapter: cloudflare({
    imageService: "passthrough",
  }),
  integrations: [sitemap()],
});
