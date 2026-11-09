import fs from 'node:fs';
import path from 'node:path';
import * as cheerio from 'cheerio';

const SOURCE_DIR = '_source';
const RAW_DIR = '_raw';
const DATA_DIR = path.join('src', '_data');

const rawJoin = (...parts) => parts.join('/');

const cssVarReplacements = (html) =>
  html
    .replace(/font-family:\s*vcsm/gi, 'font-family:var(--font-body)')
    .replace(/font-family:\s*gmsj/gi, 'font-family:var(--font-display)');

function styleProp(style, prop) {
  if (!style) return null;
  const re = new RegExp(`(?:^|;)\\s*${prop}\\s*:\\s*([^;]+)`, 'i');
  const m = style.match(re);
  return m ? m[1].trim() : null;
}

function pctToNumber(value) {
  if (!value) return null;
  const m = String(value).match(/(-?[\d.]+)\s*%/);
  return m ? Number(m[1]) : null;
}

function pxToNumber(value) {
  if (!value) return null;
  const m = String(value).match(/(-?[\d.]+)\s*px/);
  return m ? Number(m[1]) : null;
}

function firstSrc($img) {
  if (!$img || !$img.length) return null;
  return $img.attr('data-src') || $img.attr('src') || null;
}

function detectEmbed(src) {
  if (!src) return { provider: 'unknown', id: null };
  let m = src.match(/player\.vimeo\.com\/video\/(\d+)/);
  if (m) return { provider: 'vimeo', id: m[1] };
  m = src.match(/youtube(?:-nocookie)?\.com\/embed\/([\w-]+)/);
  if (m) return { provider: 'youtube', id: m[1] };
  m = src.match(/www-ccv\.adobe\.io\/v1\/player\/ccv\/([^/]+)\/embed/);
  if (m) return { provider: 'adobe', id: m[1] };
  if (/framerate\.tv\/embed\//.test(src)) return { provider: 'framerate', id: null };
  return { provider: 'external', id: null };
}

function parseModule($, $el) {
  const cls = $el.attr('class') || '';
  const style = $el.attr('style') || '';
  const width = pctToNumber(styleProp(style, 'width'));
  const float = styleProp(style, 'float');
  const paddingTop = pxToNumber(styleProp(style, 'padding-top'));
  const paddingBottom = pxToNumber(styleProp(style, 'padding-bottom'));

  if (/\btree\b/.test(cls)) {
    const wrapper = $el.children('.tree-wrapper').first();
    const valign = wrapper.hasClass('valign-center')
      ? 'center'
      : wrapper.hasClass('valign-bottom')
        ? 'bottom'
        : 'top';
    const children = [];
    wrapper.children('.tree-child-wrapper').each((_, cw) => {
      const $cw = $(cw);
      const flexRaw = styleProp($cw.attr('style') || '', 'flex');
      children.push({
        flex: flexRaw ? Number(flexRaw) : null,
        modules: collectModules($, $cw),
      });
    });
    return { type: 'row', valign, children };
  }

  if (/\bimage\b/.test(cls)) {
    const $img = $el.find('img').first();
    const src = firstSrc($img);
    const lightbox = $el.find('.js-lightbox').first().attr('data-src');
    if (!src) return null;
    return {
      type: 'image',
      src,
      full: lightbox || src,
      width,
      float,
      paddingTop,
      paddingBottom,
      alt: $img.attr('alt') || '',
      caption: $el.find('.module-caption').text().trim() || null,
    };
  }

  if (/\bmedia_collection\b/.test(cls)) {
    const items = [];
    $el.find('.grid__item-container').each((_, item) => {
      const $item = $(item);
      const $img = $item.find('img').first();
      const src = firstSrc($img);
      if (!src) return;
      items.push({
        src,
        w: Number($item.attr('data-width')) || null,
        h: Number($item.attr('data-height')) || null,
        flexGrow: Number($item.attr('data-flex-grow')) || null,
        alt: $img.attr('alt') || '',
        caption: $item.find('.grid__caption-text').text().trim() || null,
      });
    });
    return { type: 'media_collection', items, paddingTop, paddingBottom };
  }

  if (/\b(embed|video)\b/.test(cls)) {
    const $iframe = $el.find('iframe').first();
    const src = $iframe.attr('src');
    if (!src) return null;
    const $dims = $el.find('.embed-dimensions').first();
    const $ratio = $el.find('.embed-aspect-ratio').first();
    const detected = detectEmbed(src);
    return {
      type: 'embed',
      ...detected,
      src,
      aspect: pctToNumber(styleProp($ratio.attr('style') || '', 'padding-bottom')),
      maxWidth: pxToNumber(styleProp($dims.attr('style') || '', 'max-width')),
      width,
      paddingTop,
      paddingBottom,
    };
  }

  if (/\btext\b/.test(cls)) {
    const $rich = $el.find('.rich-text').first();
    if (!$rich.length) return null;
    return {
      type: 'text',
      html: cssVarReplacements($rich.html() || ''),
      width,
      maxWidth: pxToNumber(styleProp(style, 'max-width')),
      float,
      paddingTop,
      paddingBottom,
    };
  }

  if (/module-caption-container/.test(cls)) {
    const $caption = $el.find('.module-caption').first();
    return {
      type: 'caption',
      html: cssVarReplacements($caption.html() || $el.html() || ''),
    };
  }

  return null;
}

function collectModules($, container) {
  const out = [];
  container.children().each((_, el) => {
    const $el = $(el);
    if ($el.hasClass('project-module')) {
      const mod = parseModule($, $el);
      if (mod) out.push(mod);
    } else {
      out.push(...collectModules($, $el));
    }
  });
  return out;
}

function loadCoverMap() {
  const html = fs.readFileSync(path.join(SOURCE_DIR, 'projects.html'), 'utf8');
  const $ = cheerio.load(html);
  const map = [];
  $('a.project-cover').each((_, el) => {
    const $el = $(el);
    const href = $el.attr('href') || '';
    const slug = href.replace(/^\//, '');
    const $img = $el.find('img.cover__img').first();
    const title = $el.find('.title').text().trim();
    if (slug) {
      map.push({
        slug,
        coverSrc: firstSrc($img),
        coverAlt: $img.attr('alt') || '',
        coverTitle: title || null,
      });
    }
  });
  return map;
}

function loadLogo() {
  const html = fs.readFileSync(path.join(SOURCE_DIR, 'projects.html'), 'utf8');
  const $ = cheerio.load(html);
  const $img = $('img[alt="Toberg"]').first();
  return firstSrc($img);
}

const downloadCache = new Set();

async function download(url, dest) {
  if (!url) return null;
  if (fs.existsSync(dest)) return dest;
  if (downloadCache.has(dest)) return dest;
  downloadCache.add(dest);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, buf);
  return dest;
}

function extFromUrl(url) {
  try {
    const ext = path.extname(new URL(url).pathname).toLowerCase();
    return ext && ext.length <= 5 ? ext : '.jpg';
  } catch {
    return '.jpg';
  }
}

async function assignAndDownload(project, modules) {
  let imgIndex = 0;
  let mcIndex = 0;

  async function walk(list) {
    for (const mod of list) {
      if (mod.type === 'row') {
        for (const child of mod.children) {
          await walk(child.modules);
        }
      } else if (mod.type === 'image') {
        imgIndex += 1;
        const key = `img-${String(imgIndex).padStart(2, '0')}`;
        mod.key = `${project.slug}/${key}`;
        mod.raw = rawJoin(RAW_DIR, project.slug, `${key}${extFromUrl(mod.src)}`);
        await download(mod.src, mod.raw);
      } else if (mod.type === 'media_collection') {
        mcIndex += 1;
        let itemIndex = 0;
        for (const item of mod.items) {
          itemIndex += 1;
          const key = `mc-${String(mcIndex).padStart(2, '0')}-${String(itemIndex).padStart(2, '0')}`;
          item.key = `${project.slug}/${key}`;
          item.raw = rawJoin(RAW_DIR, project.slug, `${key}${extFromUrl(item.src)}`);
          await download(item.src, item.raw);
        }
      }
    }
  }

  await walk(modules);
}

async function main() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const covers = loadCoverMap();
  console.log(`Found ${covers.length} project covers`);

  const projects = [];

  for (const cover of covers) {
    const file = path.join(SOURCE_DIR, `${cover.slug}.html`);
    if (!fs.existsSync(file)) {
      console.warn(`Missing source for ${cover.slug}, skipping`);
      continue;
    }
    const html = fs.readFileSync(file, 'utf8');
    const $ = cheerio.load(html);

    const title =
      $('header.page-header h1.title').first().text().trim() ||
      cover.coverTitle ||
      cover.slug;
    const description = $('header.page-header p.description').first().text().trim();
    const modules = collectModules($, $('#project-modules'));

    const project = {
      slug: cover.slug,
      title,
      description,
      coverTitle: cover.coverTitle,
      coverSrc: cover.coverSrc,
      coverRaw: null,
      modules,
    };

    if (cover.coverSrc) {
      const ext = extFromUrl(cover.coverSrc);
      project.coverRaw = rawJoin(RAW_DIR, cover.slug, `cover${ext}`);
      try {
        await download(cover.coverSrc, project.coverRaw);
      } catch (e) {
        console.warn(`cover download failed for ${cover.slug}: ${e.message}`);
      }
    }

    await assignAndDownload(project, modules);
    projects.push(project);
    console.log(`Parsed ${cover.slug}: ${modules.length} top-level modules`);
  }

  const logoUrl = loadLogo();
  let logoRaw = null;
  if (logoUrl) {
    const ext = extFromUrl(logoUrl);
    logoRaw = rawJoin(RAW_DIR, 'site', `logo${ext}`);
    try {
      await download(logoUrl, logoRaw);
    } catch (e) {
      console.warn(`logo download failed: ${e.message}`);
    }
  }

  const infoFile = path.join(SOURCE_DIR, 'bio-2.html');
  let infoModules = [];
  if (fs.existsSync(infoFile)) {
    const $info = cheerio.load(fs.readFileSync(infoFile, 'utf8'));
    infoModules = collectModules($info, $info('#project-modules'));
    await assignAndDownload({ slug: 'bio-2' }, infoModules);
    console.log(`Parsed bio-2: ${infoModules.length} top-level modules`);
  }

  const site = {
    title: 'TOBERG',
    author: 'Toby Auberg',
    description:
      'Toberg is me, Toby Auberg, a London based 3D visual artist and animator person.',
    vimeo: 'https://vimeo.com/user4603386',
    logoRaw,
    logoUrl,
    nav: [
      { label: 'Projects', href: '/' },
      { label: 'INFO', href: '/bio-2/' },
    ],
  };

  fs.writeFileSync(path.join(DATA_DIR, 'site.json'), JSON.stringify(site, null, 2));
  fs.writeFileSync(path.join(DATA_DIR, 'projects.json'), JSON.stringify(projects, null, 2));
  fs.writeFileSync(
    path.join(DATA_DIR, 'info.json'),
    JSON.stringify({ title: 'INFO', modules: infoModules }, null, 2)
  );
  console.log(`Wrote ${projects.length} projects, site.json, and info.json`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
