import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve('_site');
const port = Number(process.env.PORT || process.argv[2] || 8081);

const types = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.woff2': 'font/woff2',
  '.webp': 'image/webp',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
  '.ico': 'image/x-icon',
};

if (!fs.existsSync(root)) {
  console.error(`Missing ${root}. Run "npm run build" first.`);
  process.exit(1);
}

const server = http.createServer((req, res) => {
  let urlPath;
  try {
    urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
  } catch {
    res.writeHead(400).end('Bad request');
    return;
  }

  let file = path.resolve(root, '.' + urlPath);
  if (file !== root && !file.startsWith(root + path.sep)) {
    res.writeHead(403).end('Forbidden');
    return;
  }

  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) {
    file = path.join(file, 'index.html');
  }

  if (!fs.existsSync(file)) {
    const notFound = path.join(root, '404.html');
    res.writeHead(404, { 'content-type': types['.html'] });
    res.end(fs.existsSync(notFound) ? fs.readFileSync(notFound) : 'Not found');
    return;
  }

  res.writeHead(200, {
    'content-type': types[path.extname(file).toLowerCase()] || 'application/octet-stream',
    'cache-control': 'no-cache',
  });
  fs.createReadStream(file).pipe(res);
});

server.listen(port, () => {
  console.log(`Previewing _site/ at http://localhost:${port}`);
  console.log('Press Ctrl+C to stop.');
});
