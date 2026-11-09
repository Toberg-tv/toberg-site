# AGENTS.md

## Status: GitHub Pages live; custom-domain cutover in progress

This repo is a static rebuild of the Adobe Portfolio site **toberg.tv** as an Eleventy site.
It is **public** and deploys to GitHub Pages on every push to `main`:

- Old preview URL: <https://toberg-tv.github.io/toberg-site/> (now 301s to `toberg.tv`)
- Repository: <https://github.com/Toberg-tv/toberg-site>
- Target live URL: <https://toberg.tv/> (cutover in progress)

The user has approved the custom-domain cutover. Follow **`docs/domain-cutover.md`** for the
DNS baseline, target records, sequence, verification, and rollback. Until DNS is switched,
`toberg.tv` still serves the Adobe site. **Do not change MX/TXT/email records or cancel
Adobe** as part of the cutover.

**Current cutover state (2026-11-09):** the Pages custom domain `toberg.tv` is set and the
workflow builds root URLs (`configure-pages` `base_path` is empty). Waiting on the GoDaddy
DNS changes, then certificate/Enforce HTTPS, QA, and canonical/sitemap work.

## Commands

- `npm install`
- `npm run dev` — Eleventy dev server at http://localhost:8080
- `npm run build` — build to `_site/`
- `npm run preview` — serve the built `_site/` over HTTP at http://localhost:8081
- `npm run extract` — re-scrape Adobe pages into `src/_data/*.json` and download originals to `_raw/`
- `npm run images` — regenerate responsive images + `src/_data/images.json` (uses sharp)

## Git / GitHub

- Repo: <https://github.com/Toberg-tv/toberg-site> — **public** (GitHub Free requires this for Pages).
- Remote: `origin` over HTTPS; default branch `main`.
- Auth: GitHub CLI, signed in as `Toberg-tv`; credential helper configured.
- Commit identity: `Toby Auberg <hi@kinemus.com>`.
- Deploy: `.github/workflows/pages.yml` on every push to `main` (and manual dispatch).
- Preview URL: <https://toberg-tv.github.io/toberg-site/> (301s to `toberg.tv`; use the custom domain once DNS is live).

## Domain cutover

- Runbook: [`docs/domain-cutover.md`](docs/domain-cutover.md) — DNS baseline, target records, sequence, rollback.
- Canonical host: apex `toberg.tv`; `www` should redirect to apex.
- DNS/registrar: GoDaddy. Preserve all MX/TXT/SPF records and the GitHub challenge TXT.
- Do not cancel Adobe Portfolio until the new site is stable.

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
- **Pages deploy:** `.github/workflows/pages.yml` runs `npm ci` + `npm run build` on pushes
  to `main`, using `PATH_PREFIX` from `actions/configure-pages` output (`/toberg-site/` for
  project Pages), uploads `_site`, and deploys with `actions/deploy-pages`. Local dev/build
  uses `/`.
- **Path prefix:** `eleventy.config.js` reads `process.env.PATH_PREFIX`, registers
  `HtmlBasePlugin`, and returns `pathPrefix`. The plugin rewrites HTML URLs (`href`, `src`,
  `srcset`, etc.); CSS font URLs are relative (`../fonts/...`) because CSS is not processed.
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
- **Repo is public:** GitHub Free requires a public repo for Pages. The Pages site is also
  public; do not put secrets in the repo.
- **Subpath URLs:** project Pages live under `/toberg-site/`. Keep new HTML URLs
  root-absolute so `HtmlBasePlugin` can prefix them; use relative URLs inside CSS/JS.
- **URLs:** project pages are `/<slug>/`; keep slugs identical to Adobe for continuity.

## Deferred (do not do without explicit user approval)

- Cancelling Adobe Portfolio
- Removing or changing MX / TXT / email records

## Next work

1. Finish the domain cutover per `docs/domain-cutover.md` (GitHub challenge TXT, DNS,
   certificate, Enforce HTTPS, QA).
2. Replace the two Adobe video placeholders with re-hosted embeds.
3. After cutover: canonical tags, `sitemap.xml`, robots sitemap line, Search Console.
