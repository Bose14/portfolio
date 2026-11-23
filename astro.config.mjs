import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

// Project repo on GitHub Pages: https://bose14.github.io/portfolio/
// For a user site (Bose14.github.io) or a custom domain, set base to '/'
// and update `site` to the new URL.
// Defaults target GitHub Pages. Netlify builds set SITE_URL / SITE_BASE (see netlify.toml).
export default defineConfig({
  site: process.env.SITE_URL || process.env.URL || 'https://bose14.github.io',
  base: process.env.SITE_BASE || '/portfolio',
  trailingSlash: 'always',
  integrations: [sitemap()],
  vite: { plugins: [tailwindcss()] },
});
