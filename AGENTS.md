# AGENTS.md

## Status: GitHub Pages preview live (domain untouched)

This repo is a static rebuild of the Adobe Portfolio site **toberg.tv** as an Eleventy site.
It is **public** and deploys a preview to GitHub Pages on every push to `main`:

- Preview: <https://toberg-tv.github.io/toberg-site/>
- Repository: <https://github.com/Toberg-tv/toberg-site>

The live **toberg.tv** domain, DNS, Adobe account, and any custom domain are intentionally
**not** configured. Do not add `CNAME`, DNS records, custom-domain settings, or deploy
workflows for a custom domain until the user explicitly asks.

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

- `CNAME`, custom domain, Enforce HTTPS for a custom domain
- DNS changes (apex A / `www` CNAME), MX/TXT preservation
- Cancelling Adobe Portfolio
- Sitemap with absolute URLs (needs final domain)

## Next work

1. Replace the two Adobe video placeholders with re-hosted embeds.
2. Optional: preview-only `noindex` so the github.io URL isn't indexed while toberg.tv is canonical.
3. Only then and on explicit approval: custom domain + DNS cutover (the workflow reads
   `configure-pages` `base_path`, so the prefix drops to `/` automatically when a custom
   domain becomes the Pages root).
