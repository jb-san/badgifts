import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const remoteOrPublicImage = z
  .string()
  .trim()
  .refine(
    (value) => value.startsWith("https://") || (value.startsWith("/") && !value.startsWith("//")),
    "Use an https URL or a public path that starts with /.",
  );

const gifts = defineCollection({
  loader: glob({ base: "./src/content/gifts", pattern: "**/*.md" }),
  schema: ({ image }) =>
    z.object({
      title: z.string().trim().min(1).max(120),
      slug: z
        .string()
        .trim()
        .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase words separated by hyphens."),
      description: z.string().trim().min(20).max(200),
      image: z.union([remoteOrPublicImage, image()]),
      imageAlt: z.string().trim().min(1).max(180),
      priceNote: z.string().trim().min(1).max(80).optional(),
      affiliateUrl: z
        .url()
        .trim()
        .refine((value) => value.startsWith("https://"), "Use an https affiliate URL."),
      merchant: z.enum(["amazon", "etsy", "aliexpress", "other"]),
      tags: z
        .array(z.string().trim().min(1).max(40))
        .min(1)
        .transform((tags) => {
          const seen = new Set<string>();
          const unique: string[] = [];
          for (const tag of tags) {
            const key = tag.toLowerCase();
            if (seen.has(key)) continue;
            seen.add(key);
            unique.push(tag);
          }
          return unique;
        }),
      dateAdded: z.coerce.date(),
      // Unpublished until someone explicitly ships it.
      draft: z.boolean().default(true),
    }),
});

export const collections = { gifts };
