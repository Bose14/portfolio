import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    category: z.string(),
    // Be honest about maturity: Product, Prototype, Experiment, Concept, Hardware project...
    status: z.string(),
    order: z.number(),
    featured: z.boolean().default(true),
    stack: z.array(z.string()).default([]),
    // false = feature list still to be confirmed by the author; shows a notice on the page.
    verified: z.boolean().default(false),
    links: z.array(z.object({ label: z.string(), href: z.string() })).default([]),
  }),
});

export const collections = { projects };
