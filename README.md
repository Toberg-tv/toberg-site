# TOBERG — local static rebuild

A local-only, static rebuild of the Adobe Portfolio site **toberg.tv**, built with
[Eleventy](https://www.11ty.dev/). The domain, DNS, Adobe account, and GitHub Pages are
intentionally not configured yet.

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

## Preview the production build

```powershell
npm run build
npm run preview
```

Open **http://localhost:8081**.

> Do **not** double-click `_site/index.html`. The site uses root-absolute paths
> (`/assets/...`), which only resolve when served over HTTP. Opening it via `file://`
> loads no CSS or images (and makes the Vimeo icon render huge).

## Commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server with live reload at http://localhost:8080 |
| `npm run build` | Build the static site into `_site/` |
| `npm run preview` | Serve the built `_site/` at http://localhost:8081 |
| `npm run extract` | Re-scrape Adobe pages into `src/_data/*.json` and `_raw/` |
| `npm run images` | Regenerate responsive images and the image manifest |

## What you should see

- **`/`** — dark gallery of 12 project covers (4-up, 2-up ≤932px, 1-up ≤540px).
- **`/projects/`** — same gallery on the legacy route.
- **`/bio-2/`** — the INFO page.
- **Each project page** — title, description, images, and external Vimeo/YouTube/framerate embeds.
- **`/bufo/` and `/flail-wip/`** — intentional "being migrated from Adobe" video placeholders.

## About npm

npm is the package manager that ships with Node.js. Think of `package.json` as a shopping
list and `npm install` as the trip to the shop: it fetches everything the site needs.
`npm run <name>` runs a shortcut defined in the `scripts` section of `package.json`, so
`npm run dev` is just a convenient way to launch Eleventy's dev server.
