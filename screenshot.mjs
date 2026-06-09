// Usage: node screenshot.mjs <url> [label]
// Saves auto-incremented PNGs to ./temporary screenshots/screenshot-N[-label].png
import puppeteer from 'puppeteer';
import { mkdir, readdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(ROOT, 'temporary screenshots');

const url = process.argv[2] || 'http://localhost:3000';
const label = process.argv[3] ? `-${process.argv[3]}` : '';

async function nextIndex() {
  try {
    const files = await readdir(OUT_DIR);
    let max = 0;
    for (const f of files) {
      const m = f.match(/^screenshot-(\d+)/);
      if (m) max = Math.max(max, parseInt(m[1], 10));
    }
    return max + 1;
  } catch {
    return 1;
  }
}

(async () => {
  await mkdir(OUT_DIR, { recursive: true });
  const n = await nextIndex();
  const outPath = join(OUT_DIR, `screenshot-${n}${label}.png`);

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 });
  await new Promise((r) => setTimeout(r, 800)); // let fonts/animations settle
  await page.screenshot({ path: outPath, fullPage: true });
  await browser.close();
  console.log(`Saved ${outPath}`);
})().catch((err) => {
  console.error('Screenshot failed:', err.message);
  process.exit(1);
});
