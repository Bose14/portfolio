import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

// Project repo on GitHub Pages: https://bose14.github.io/portfolio/
// For a user site (Bose14.github.io) or a custom domain, set base to '/'
// and update `site` to the new URL.
export default defineConfig({
  site: 'https://bose14.github.io',
  base: '/portfolio',
  trailingSlash: 'always',
  integrations: [sitemap()],
  vite: { plugins: [tailwindcss()] },
});
