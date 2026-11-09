# TOBERG — static rebuild

A static rebuild of the Adobe Portfolio site **toberg.tv**, built with
[Eleventy](https://www.11ty.dev/).

The site is live at **<https://toberg.tv/>** on GitHub Pages (cut over from Adobe Portfolio
on 2026-11-09, with HTTPS enforced).

## GitHub Pages

- Repository: **<https://github.com/Toberg-tv/toberg-site>** (public).
- Every push to `main` builds and deploys via `.github/workflows/pages.yml`.
- Live at **`https://toberg.tv/`**; `www.toberg.tv` redirects to the apex; HTTPS is enforced.
- See [`docs/domain-cutover.md`](docs/domain-cutover.md) for the DNS runbook and rollback.

## Requirements

- **Node.js 18+** (includes npm) — install from <https://nodejs.org> if needed.
- Check your versions:

```powershell
node -v
npm -v
```

## First-time setup

```powershell
npm install
```

This downloads the project's dependencies (Eleventy, image tooling, fonts) into `node_modules/`.

## View the site locally (recommended)

```powershell
npm run dev
```

Open **http://localhost:8080**. The dev server watches for changes and reloads the page.
Press `Ctrl+C` in the terminal to stop it.

## Commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server with live reload at http://localhost:8080 |
| `npm run build` | Build the static site into `_site/` |
| `npm run extract` | Re-scrape Adobe pages into `src/_data/*.json` and `_raw/` |
| `npm run images` | Regenerate responsive images and the image manifest |

## What you should see

- **`/`** — dark gallery of 12 project covers (4-up, 2-up ≤932px, 1-up ≤540px).
- **`/projects/`** — same gallery on the legacy route.
- **`/bio-2/`** — the INFO page.
- **Each project page** — title, description, images, and external Vimeo/YouTube/framerate embeds.
- **`/bufo/` and `/flail-wip/`** — intentional "being migrated from Adobe" video placeholders.

The canonical site is **<https://toberg.tv/>**. Local dev keeps the root paths shown above.
