# Bose A S — Portfolio

Cinematic personal portfolio built with Astro, TypeScript and Tailwind CSS. A cut-out of Bose moves around the page like a personal assistant (spring physics, curved paths, head turn, breathing) and explains each section.

- Content: `src/config.ts` and `src/content/projects/*.md` (only confirmed information)
- Figure motion: `src/scripts/companion.ts` · Landing styles: `src/styles/landing.css`
- Photo: `public/images/bose.webp`

## Run
```
npm install
npm run dev
```

## Deploy
- **GitHub Pages**: push to `main` (Settings → Pages → Source: GitHub Actions). Served at `/portfolio/`.
- **Netlify**: link this repo; `netlify.toml` sets the root base path.
