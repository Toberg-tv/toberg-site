import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const DATA_DIR = path.join('src', '_data');
const OUT_DIR = path.join('src', 'assets', 'img');
const WEBP_QUALITY = 82;
const JPEG_QUALITY = 82;

const data = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'projects.json'), 'utf8'));
const site = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'site.json'), 'utf8'));
const info = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'info.json'), 'utf8'));

function walk(mods, out) {
  for (const mod of mods) {
    if (mod.type === 'row') {
      for (const child of mod.children) walk(child.modules, out);
    } else if (mod.type === 'image' && mod.raw) {
      out.push({ key: mod.key, raw: mod.raw, kind: 'content' });
    } else if (mod.type === 'media_collection') {
      for (const item of mod.items) {
        if (item.raw) out.push({ key: item.key, raw: item.raw, kind: 'content' });
      }
    }
  }
  return out;
}

const entries = [];
for (const project of data) {
  if (project.coverRaw) entries.push({ key: `${project.slug}/cover`, raw: project.coverRaw, kind: 'cover' });
  walk(project.modules, entries);
}
walk(info.modules, entries);
if (site.logoRaw) entries.push({ key: 'site/logo', raw: site.logoRaw, kind: 'logo' });

const BASE_WIDTHS = {
  content: [480, 960, 1440, 1920],
  cover: [400, 800, 1200],
  logo: [120, 240, 400],
};
const MAX_WIDTH = { content: 1920, cover: 1200, logo: 400 };

function widthsFor(originalWidth, kind) {
  const base = BASE_WIDTHS[kind];
  const max = MAX_WIDTH[kind];
  const widths = base.filter((w) => w < originalWidth);
  const top = Math.min(originalWidth, max);
  if (!widths.includes(top)) widths.push(top);
  return [...new Set(widths)].sort((a, b) => a - b);
}

function publicPath(key, width, ext) {
  return `/assets/img/${key}-${width}.${ext}`;
}

async function processEntry({ key, raw, kind }) {
  if (!fs.existsSync(raw)) {
    console.warn(`missing raw: ${raw}`);
    return null;
  }
  const meta = await sharp(raw).rotate().metadata();
  if (!meta.width || !meta.height) {
    console.warn(`no dimensions: ${raw}`);
    return null;
  }
  const widths = widthsFor(meta.width, kind);
  const outDir = path.join(OUT_DIR, path.dirname(key));
  fs.mkdirSync(outDir, { recursive: true });

  const hasAlpha = Boolean(meta.hasAlpha);
  const fallbackType = hasAlpha ? 'png' : 'jpeg';
  const formats = { webp: [], fallbackType, fallback: [] };
  let largest = { width: 0, height: 0 };

  for (const width of widths) {
    const height = Math.round((meta.height * width) / meta.width);
    const baseName = `${path.basename(key)}-${width}`;

    await sharp(raw)
      .rotate()
      .resize({ width, withoutEnlargement: true })
      .webp({ quality: WEBP_QUALITY })
      .toFile(path.join(outDir, `${baseName}.webp`));

    const fallbackExt = hasAlpha ? 'png' : 'jpg';
    const fallbackPipeline = sharp(raw).rotate().resize({ width, withoutEnlargement: true });
    if (hasAlpha) {
      await fallbackPipeline.png({ compressionLevel: 9 }).toFile(path.join(outDir, `${baseName}.png`));
    } else {
      await fallbackPipeline
        .jpeg({ quality: JPEG_QUALITY, mozjpeg: true })
        .toFile(path.join(outDir, `${baseName}.jpg`));
    }

    formats.webp.push({ src: publicPath(key, width, 'webp'), width, height });
    formats.fallback.push({ src: publicPath(key, width, fallbackExt), width, height });
    if (width >= largest.width) largest = { width, height };
  }

  return {
    key,
    width: largest.width,
    height: largest.height,
    aspect: Number((largest.width / largest.height).toFixed(4)),
    formats,
  };
}

async function main() {
  fs.rmSync(OUT_DIR, { recursive: true, force: true });
  const manifest = {};
  let done = 0;
  for (const entry of entries) {
    try {
      const result = await processEntry(entry);
      if (result) manifest[result.key] = result;
    } catch (e) {
      console.warn(`failed ${entry.key}: ${e.message}`);
    }
    done += 1;
    if (done % 10 === 0) console.log(`processed ${done}/${entries.length}`);
  }
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(path.join(DATA_DIR, 'images.json'), JSON.stringify(manifest, null, 2));
  console.log(`Wrote ${Object.keys(manifest).length} image entries to src/_data/images.json`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
