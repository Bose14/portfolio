# Bose A S — Portfolio

Personal portfolio built with Astro, TypeScript and Tailwind CSS. Static, no backend, deployed to GitHub Pages with GitHub Actions.

The home page is a side-scrolling game world. Scroll, swipe or press → and an illustrated guide ("Bo") runs through the levels, jumps bugs, collects coins and skill tokens, and explains each section. There is a bonus mini-game (Debug Run) and an "Ask Bo" chat. Visitors with reduced-motion enabled get a plain, readable layout instead.

## Develop

```bash
npm install
npm run dev      # http://localhost:4321/portfolio/
npm run build
npm run preview
```

## Edit content

- `src/config.ts`: name, email, social links, intro, experience, skills, education, and what Bo says at each level (`levels`).
- `src/scripts/`: `world.ts` (scroll engine), `rig.ts` (character animation), `game.ts` (mini-game), `chat.ts`, `audio.ts`.
- `src/components/Character.astro`: the character illustration (each limb is a separate SVG group).
- `src/content/projects/*.md`: one file per project case study. Frontmatter sets title, status, stack and links. Set `verified: true` once the case study is complete to remove the "being expanded" notice.
- `public/resume.pdf` + `hasResume: true` in `src/config.ts`: shows a Resume button.
- Own illustration for the guide: put an image in `public/images/` and set `assistant.avatarSrc` in `src/config.ts`.

## Deploy

1. In the GitHub repo: **Settings → Pages → Source: GitHub Actions**.
2. Push to `main`. The workflow in `.github/workflows/deploy.yml` builds and publishes.
3. Site URL: `https://bose14.github.io/portfolio/`.

For a user site (`Bose14.github.io`) or a custom domain, set `base: '/'` and update `site` in `astro.config.mjs`.
