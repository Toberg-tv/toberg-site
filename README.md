# TOBERG — static rebuild

A static rebuild of the Adobe Portfolio site **toberg.tv**, built with
[Eleventy](https://www.11ty.dev/).

The **toberg.tv domain still points to the Adobe site**. This repository publishes a
preview on GitHub Pages at **<https://toberg-tv.github.io/toberg-site/>**. No custom
domain, DNS, or Adobe settings have been changed.

## Live preview (GitHub Pages)

**<https://toberg-tv.github.io/toberg-site/>**

- The repository is **public**, which GitHub Free requires for Pages.
- Every push to `main` builds and deploys via `.github/workflows/pages.yml`.
- Project Pages serves from the `/toberg-site/` subpath, so CI builds with
  `PATH_PREFIX=/toberg-site/`. Local `npm run dev` still serves at `/`.
- Custom domain and toberg.tv cutover are intentionally deferred.

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
| `$env:PATH_PREFIX='/toberg-site/'; npm run build` | Build for the GitHub Pages subpath |
| `npm run extract` | Re-scrape Adobe pages into `src/_data/*.json` and `_raw/` |
| `npm run images` | Regenerate responsive images and the image manifest |

## What you should see

- **`/`** — dark gallery of 12 project covers (4-up, 2-up ≤932px, 1-up ≤540px).
- **`/projects/`** — same gallery on the legacy route.
- **`/bio-2/`** — the INFO page.
- **Each project page** — title, description, images, and external Vimeo/YouTube/framerate embeds.
- **`/bufo/` and `/flail-wip/`** — intentional "being migrated from Adobe" video placeholders.

On the **live preview**, every route is nested under `/toberg-site/` (for example
`/toberg-site/pile/`). Local dev keeps the root paths shown above.
