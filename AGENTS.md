# AGENTS.md

## Status: local static rebuild (domain untouched)

This repo is a local-only rebuild of the Adobe Portfolio site **toberg.tv** as a static
Eleventy site. The live domain, DNS, Adobe account, and GitHub Pages are intentionally
**not** configured yet. Do not add `CNAME`, DNS records, deploy workflows, or custom-domain
settings until the user explicitly asks.

## Commands

- `npm install`
- `npm run dev` — Eleventy dev server at http://localhost:8080
- `npm run build` — build to `_site/`
- `npm run preview` — serve the built `_site/` over HTTP at http://localhost:8081
- `npm run extract` — re-scrape Adobe pages into `src/_data/*.json` and download originals to `_raw/`
- `npm run images` — regenerate responsive images + `src/_data/images.json` (uses sharp)

## Architecture

- **Content pipeline:** `scripts/extract.mjs` parses `_source/*.html` (saved Adobe pages)
  into `src/_data/projects.json`, `site.json`, `info.json`, and downloads source images to `_raw/`.
  `scripts/images.mjs` reads those + raw images and emits `src/assets/img/**` plus
  `src/_data/images.json` (WebP + JPEG/PNG fallback at multiple widths).
- **Templates:** `src/_includes/base.njk` (shell/header), `modules.njk` (recursive module
  renderer), `gallery.njk`; pages: `src/index.njk`, `src/projects/index.njk`,
  `src/project.njk` (paginated over `projects`), `src/bio-2.njk`, `src/404.njk`,
  `src/robots.txt.njk`.
- **Image shortcode:** `{% picture key, alt, sizes, class, loading, fetchpriority %}` in
  `eleventy.config.js`, keyed by `src/_data/images.json`.
- **Assets:** `src/assets/{css,js,fonts,img}` passthrough-copied to `_site/assets`.
- **Generated vs source:** `_raw/` and `_source/` are gitignored. Committed generated
  artifacts are `src/assets/img/**` and `src/_data/{projects,site,info,images}.json`.

## Conventions / gotchas

- **Fonts are substitutes:** Montserrat replaces Proxima Nova, Zilla Slab replaces Adelle.
  They are self-hosted in `src/assets/fonts/`. Do not reintroduce the Adobe Typekit kit.
- **Adobe CCV videos are not portable:** `bufo` and `flail-wip` embed `www-ccv.adobe.io`
  clips that fail off Adobe. They currently render `.video-placeholder` (see
  `src/_includes/modules.njk`). Re-upload to Vimeo/YouTube, then either update the module
  data or remove the placeholder branch.
- **Vimeo/YouTube/framerate.tv** embeds stay external; they work on static hosting.
- **Layout targets (verified against live site):** background `#121212`, container max
  `1600px`, content `5%` side margins, gallery 4-up / 2-up ≤932px / 1-up ≤540px, cover
  aspect ratio `1.2785`, centered header cluster (nav two lines + 50px logo).
- **`.nojekyll`** exists for future GitHub Pages; keep it.
- **Never open `_site/index.html` via `file://`:** asset URLs are root-absolute, so CSS,
  images, and JS only load when served over HTTP (`npm run dev` or `npm run preview`).
- **URLs:** project pages are `/<slug>/`; keep slugs identical to Adobe for continuity.

## Deferred (do not do without explicit user approval)

- GitHub Pages repo/Actions setup
- `CNAME`, custom domain, Enforce HTTPS
- DNS changes (apex A / `www` CNAME), MX/TXT preservation
- Cancelling Adobe Portfolio
- Sitemap with absolute URLs (needs final domain)

## Next work

1. Replace the two Adobe video placeholders with re-hosted embeds.
2. QA: all pages, mobile nav, embeds, image loading, Lighthouse.
3. Only then: GitHub Pages deploy + domain cutover.
