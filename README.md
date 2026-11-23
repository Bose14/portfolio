# Bose A S — Portfolio

Personal portfolio built with Astro, TypeScript and Tailwind CSS. Static, no backend, deployed to GitHub Pages with GitHub Actions.

A small illustrated guide ("Bo") moves around the page and explains each section.

## Develop

```bash
npm install
npm run dev      # http://localhost:4321/portfolio/
npm run build
npm run preview
```

## Edit content

- `src/config.ts`: name, email, social links, intro, experience, skills, education, and everything the assistant says.
- `src/content/projects/*.md`: one file per project case study. Frontmatter sets title, status, stack and links. Set `verified: true` once the case study is complete to remove the "being expanded" notice.
- `public/resume.pdf` + `hasResume: true` in `src/config.ts`: shows a Resume button.
- Own illustration for the guide: put an image in `public/images/` and set `assistant.avatarSrc` in `src/config.ts`.

## Deploy

1. In the GitHub repo: **Settings → Pages → Source: GitHub Actions**.
2. Push to `main`. The workflow in `.github/workflows/deploy.yml` builds and publishes.
3. Site URL: `https://bose14.github.io/portfolio/`.

For a user site (`Bose14.github.io`) or a custom domain, set `base: '/'` and update `site` in `astro.config.mjs`.
