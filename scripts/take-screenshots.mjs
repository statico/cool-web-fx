// Generate gallery thumbnails for each effect.
//
// Loads every public/effects/<slug>.html in a headless browser, waits for the
// effect to warm up, and captures public/thumbs/<slug>.png at 1200x750 @2x.
//
// Usage:
//   npm i -D playwright && npx playwright install chromium   # one-time
//   npm run thumbs
//
// Slugs are derived from src/demos/*.json so this stays in sync automatically.

import { createServer } from 'node:http';
import { readFile, readdir, mkdir } from 'node:fs/promises';
import { extname, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const publicDir = join(root, 'public');
const demosDir = join(root, 'src', 'demos');
const thumbsDir = join(publicDir, 'thumbs');

const VIEWPORT = { width: 1200, height: 750 };
const WARMUP_MS = 1800; // let the effect animate before capturing

const MIME = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.json': 'application/json',
};

async function staticServer(dir) {
  const server = createServer(async (req, res) => {
    try {
      const url = decodeURIComponent((req.url || '/').split('?')[0]);
      const filePath = join(dir, url);
      const data = await readFile(filePath);
      res.writeHead(200, { 'Content-Type': MIME[extname(filePath)] || 'application/octet-stream' });
      res.end(data);
    } catch {
      res.writeHead(404); res.end('not found');
    }
  });
  await new Promise((r) => server.listen(0, r));
  const { port } = server.address();
  return { server, port };
}

async function main() {
  const { chromium } = await import('playwright').catch(() => {
    console.error('\nPlaywright is not installed. Run:\n  npm i -D playwright && npx playwright install chromium\n');
    process.exit(1);
  });

  await mkdir(thumbsDir, { recursive: true });
  const slugs = (await readdir(demosDir))
    .filter((f) => f.endsWith('.json'))
    .map((f) => f.replace(/\.json$/, ''));

  const { server, port } = await staticServer(publicDir);
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: VIEWPORT, deviceScaleFactor: 2 });

  for (const slug of slugs) {
    const url = `http://localhost:${port}/effects/${slug}.html`;
    await page.goto(url, { waitUntil: 'load' });
    await page.waitForTimeout(WARMUP_MS);
    await page.screenshot({ path: join(thumbsDir, `${slug}.png`) });
    console.log(`✓ ${slug}.png`);
  }

  await browser.close();
  server.close();
  console.log(`\nDone — ${slugs.length} thumbnails in public/thumbs/`);
}

main().catch((e) => { console.error(e); process.exit(1); });
