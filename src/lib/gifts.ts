import { getCollection, type CollectionEntry } from "astro:content";

export type Gift = CollectionEntry<"gifts">;
export type Merchant = Gift["data"]["merchant"];
export type GiftImage = Gift["data"]["image"];

const merchants: Record<Merchant, string> = {
  amazon: "Amazon",
  etsy: "Etsy",
  aliexpress: "AliExpress",
  other: "Other",
};

const buyLabels: Record<Merchant, string> = {
  amazon: "Buy on Amazon",
  etsy: "Buy on Etsy",
  aliexpress: "Buy on AliExpress",
  other: "Buy from the shop",
};

const placeholderHosts = new Set(["example.com", "example.org", "example.net", "localhost", "127.0.0.1"]);

export function merchantLabel(merchant: Merchant) {
  return merchants[merchant];
}

export function buyLabel(merchant: Merchant) {
  return buyLabels[merchant];
}

export function tagSlug(tag: string) {
  return tag
    .toLowerCase()
    .normalize("NFKD")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function imageSource(image: GiftImage) {
  return typeof image === "string" ? image : image.src;
}

export function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function isPlaceholderAffiliate(url: string) {
  const hostname = new URL(url).hostname.toLowerCase();
  if (placeholderHosts.has(hostname)) return true;
  return (
    hostname.endsWith(".example.com") ||
    hostname.endsWith(".example.org") ||
    hostname.endsWith(".example.net")
  );
}

export async function getGifts() {
  const gifts = await getCollection("gifts", ({ data }) => {
    return import.meta.env.PROD ? data.draft !== true : true;
  });

  const slugs = new Set<string>();
  for (const gift of gifts) {
    const fileSlug = gift.id.split("/").pop()?.replace(/\.md$/, "");
    if (fileSlug !== gift.data.slug) {
      throw new Error(`Rename ${gift.id}.md so the filename matches slug "${gift.data.slug}".`);
    }
    if (slugs.has(gift.data.slug)) {
      throw new Error(`Duplicate gift slug "${gift.data.slug}".`);
    }
    slugs.add(gift.data.slug);
    if (import.meta.env.PROD && isPlaceholderAffiliate(gift.data.affiliateUrl)) {
      throw new Error(
        `Gift "${gift.data.slug}" is set to publish, but its affiliate URL is still a placeholder.`,
      );
    }
  }

  return gifts.sort((a, b) => {
    const delta = b.data.dateAdded.valueOf() - a.data.dateAdded.valueOf();
    if (delta !== 0) return delta;
    return a.data.title.localeCompare(b.data.title);
  });
}

export async function getTags() {
  const gifts = await getGifts();
  const tags = new Map<string, { tag: string; slug: string; gifts: Gift[] }>();

  for (const gift of gifts) {
    for (const tag of gift.data.tags) {
      const slug = tagSlug(tag);
      const existing = tags.get(slug);
      if (existing) {
        existing.gifts.push(gift);
      } else {
        tags.set(slug, { tag, slug, gifts: [gift] });
      }
    }
  }

  return [...tags.values()].sort((a, b) => a.tag.localeCompare(b.tag));
}
