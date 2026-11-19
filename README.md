# Bad Gifts

Affiliate shop for funny, weird, and gag gifts. The site is an Astro app, mostly prerendered, built for Cloudflare Workers. Pages are static HTML. There is no client-side framework and no view-transition script.

Production URL: `https://badgifts.shop`

## Requirements

- Node.js `>=22.23.4` (the Astro 7 engine range)
- npm 9.6.5 or newer

```bash
npm ci
npm run dev
```

`npm run dev` shows draft entries so you can proof them. `npm run build` omits every entry with `draft: true` (the default).

```bash
npm run build
npm run preview
```

## Add a gift

Create `src/content/gifts/<slug>.md`. The filename has to match `slug`.

```yaml
---
title: "Desk Goose"
slug: desk-goose
description: "A goose that lives next to the monitor and judges your calendar."
image: ./desk-goose.svg
imageAlt: "A small white goose standing on a desk."
# Optional. Omit unless you have checked a real price. Do not guess.
priceNote: "$18"
affiliateUrl: "https://www.amazon.com/dp/EXAMPLE?tag=your-associate-tag"
merchant: amazon # amazon | etsy | aliexpress | other
tags:
  - office
  - weird
  - "under $25"
dateAdded: 2026-11-19
draft: false
---

The goose does not honk. It just stands there, which is worse.
```

Fields:

| Field | Required | Notes |
| --- | --- | --- |
| `title` | yes | Card and page heading. |
| `slug` | yes | Lowercase hyphenated URL segment. Must match the filename. |
| `description` | yes | Short write-up used on the card, the meta description, and JSON-LD. 20–200 characters. |
| body | no | Longer joke under the card copy. Markdown. Keep the affiliate URL in frontmatter so the buy button stays the only outbound product link. |
| `image` | yes | A file next to the entry (`./photo.jpg`), a public path (`/images/photo.jpg`), or an `https://` URL. |
| `imageAlt` | yes | What the picture shows. |
| `priceNote` | no | A real price you verified, such as `$18`. Leave it out when you do not have one. It is never turned into structured price data. |
| `affiliateUrl` | yes | `https` link to the merchant. Placeholder hosts (`example.com`, `localhost`, and friends) fail the production build if `draft` is `false`. |
| `merchant` | yes | `amazon`, `etsy`, `aliexpress`, or `other`. |
| `tags` | yes | One or more labels. Each label gets a page at `/tags/<slug>/`. |
| `dateAdded` | yes | Sort order on the homepage. Newest first. |
| `draft` | no | Defaults to `true`. Set `false` only when the link is real and any price note was checked. |

Drafts render in `npm run dev` and are dropped from `npm run build`, including tag pages that would only have contained drafts. The three entries already in `src/content/gifts/` are example data (`EXAMPLE:` in the title, `draft: true`, `example.com` links). Do not publish them.

Buy buttons are generated from `affiliateUrl`. They use `rel="sponsored nofollow noopener"` and `target="_blank"`, with a short affiliate disclosure beside the button.

## Deploy to Cloudflare Workers

This repo does not deploy itself. From a machine logged into the right Cloudflare account:

```bash
npm run build
npx wrangler deploy
```

Wrangler config is `wrangler.jsonc`. The Worker name is `badgifts`. A static build writes HTML to `dist/client` and a deploy manifest to `.wrangler/deploy/config.json`. `wrangler deploy` reads that manifest, so run it after the build. The static output drops the Worker script and serves the files as assets, with `404.html` for unknown URLs. After the first deploy, attach `badgifts.shop` as a custom domain on that Worker in the Cloudflare dashboard.

Workers Builds can do the same on push:

- Build command: `npm run build`
- Deploy command: `npx wrangler deploy`

`npm run build` also checks that the production output does not contain the sample slugs, placeholder affiliate URLs, or JSON-LD ratings, reviews, or prices.

Preview the Worker locally without deploying:

```bash
npm run build
npx wrangler dev
```

## Project map

- `src/content.config.ts` — gift collection schema
- `src/content/gifts/` — entries
- `src/pages/` — homepage, gift pages, tag pages, about, disclosure, 404
- `astro.config.mjs` — static output, sitemap, Cloudflare adapter
- `wrangler.jsonc` — Worker name `badgifts`
- `dist/client/` — prerendered site `wrangler deploy` uploads
- `public/robots.txt` — allows crawling and points at the sitemap

Pages are prerendered (`output: "static"` plus `export const prerender = true`). The Cloudflare adapter is installed so the same project can serve the static build on Workers. `session: false` keeps deploy from provisioning a session KV namespace. The image service is `passthrough` because product art is a normal image element, not a Cloudflare Images binding.
