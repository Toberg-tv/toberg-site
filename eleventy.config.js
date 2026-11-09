import fs from 'node:fs';
import path from 'node:path';

const MANIFEST_PATH = path.join('src', '_data', 'images.json');

function loadManifest() {
  try {
    return JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
  } catch {
    return {};
  }
}

function escapeAttr(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export default function (eleventyConfig) {
  const images = loadManifest();

  eleventyConfig.addPassthroughCopy({ 'src/assets': 'assets' });
  if (fs.existsSync('.nojekyll')) {
    eleventyConfig.addPassthroughCopy({ '.nojekyll': '.nojekyll' });
  }

  eleventyConfig.addShortcode(
    'picture',
    function (key, alt = '', sizes = '100vw', className = '', loading = 'lazy', fetchpriority = '') {
      const entry = images[key];
      if (!entry) return '';

      const { webp, fallback, fallbackType } = entry.formats;
      const webpSet = webp.map((s) => `${s.src} ${s.width}w`).join(', ');
      const fallbackSet = fallback.map((s) => `${s.src} ${s.width}w`).join(', ');
      const largest = fallback[fallback.length - 1];
      const fallbackMime = fallbackType === 'png' ? 'image/png' : 'image/jpeg';

      return `<picture>` +
        `<source type="image/webp" srcset="${webpSet}" sizes="${escapeAttr(sizes)}">` +
        `<img src="${largest.src}" srcset="${fallbackSet}" sizes="${escapeAttr(sizes)}" ` +
        `width="${entry.width}" height="${entry.height}" alt="${escapeAttr(alt)}" ` +
        `class="${escapeAttr(className)}" loading="${loading}"` +
        (fetchpriority ? ` fetchpriority="${escapeAttr(fetchpriority)}"` : '') +
        ` decoding="async">` +
        `</picture>`;
    }
  );

  eleventyConfig.addFilter('escapeAttr', escapeAttr);

  return {
    dir: {
      input: 'src',
      output: '_site',
      includes: '_includes',
      data: '_data',
    },
    templateFormats: ['njk', 'md', 'html'],
    htmlTemplateEngine: 'njk',
    markdownTemplateEngine: 'njk',
  };
}
