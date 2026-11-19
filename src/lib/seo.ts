import { imageSource, tagSlug, type Gift } from "./gifts";

export const siteName = "Bad Gifts";

export function pageUrl(pathname: string, site: URL) {
  return new URL(pathname, site).href;
}

export function isSvg(src: string) {
  const path = src.split(/[?#]/)[0] ?? src;
  return path.toLowerCase().endsWith(".svg");
}

export function socialImage(image: string | undefined, site: URL) {
  if (!image || isSvg(image)) return new URL("/og.png", site).href;
  return new URL(image, site).href;
}

export function jsonLdScript(data: unknown) {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export function giftJsonLd(gift: Gift, site: URL, pathname: string) {
  const url = pageUrl(pathname, site);
  const primaryTag = gift.data.tags[0] ?? "gag gifts";
  const tagUrl = pageUrl(`/tags/${tagSlug(primaryTag)}/`, site);
  const image = new URL(imageSource(gift.data.image), site).href;
  const websiteId = new URL("/#website", site).href;

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": websiteId,
        name: siteName,
        url: new URL("/", site).href,
      },
      {
        "@type": "ItemPage",
        "@id": `${url}#webpage`,
        url,
        name: gift.data.title,
        description: gift.data.description,
        isPartOf: { "@id": websiteId },
        mainEntity: { "@id": `${url}#product` },
      },
      {
        "@type": "Product",
        "@id": `${url}#product`,
        name: gift.data.title,
        description: gift.data.description,
        image,
        url,
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "The aisle",
            item: new URL("/", site).href,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: primaryTag,
            item: tagUrl,
          },
          {
            "@type": "ListItem",
            position: 3,
            name: gift.data.title,
            item: url,
          },
        ],
      },
    ],
  };
}
