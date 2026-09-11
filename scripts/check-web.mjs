// Drives the built web app in the real Chrome on this machine, because headless
// virtual-time screenshots never let IndexedDB callbacks fire and so always show
// the loading spinner. Usage: node scripts/check-web.mjs <url>
import puppeteer from 'puppeteer-core';

const URL_ = process.argv[2] ?? 'http://localhost:8098/skinlog/';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: ['--no-sandbox', '--hide-scrollbars'],
});

try {
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true });

  const problems = [];
  page.on('console', (m) => m.type() === 'error' && problems.push(`console: ${m.text()}`));
  page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`));

  await page.goto(URL_, { waitUntil: 'networkidle0', timeout: 30000 });
  await page.waitForFunction(() => document.body.innerText.includes('How does your skin look'), { timeout: 20000 });

  // Prove the storage layer round-trips through IndexedDB, not localStorage.
  await page.evaluate(() => {
    const chip = [...document.querySelectorAll('div,span')].find((e) => e.textContent?.trim() === '3');
    chip?.click();
  });
  await new Promise((r) => setTimeout(r, 1500));

  const storage = await page.evaluate(async () => {
    const dbs = await indexedDB.databases?.();
    const persisted = await navigator.storage?.persisted?.();
    const read = await new Promise((resolve) => {
      const req = indexedDB.open('skinlog', 1);
      req.onsuccess = () => {
        const tx = req.result.transaction('kv', 'readonly');
        const get = tx.objectStore('kv').get('skinlog:entries:v1');
        get.onsuccess = () => resolve(get.result ?? null);
        get.onerror = () => resolve('READ ERROR');
      };
      req.onerror = () => resolve('OPEN ERROR');
    });
    return {
      databases: (dbs ?? []).map((d) => d.name),
      persisted,
      entriesInIndexedDb: read,
      localStorageKeys: Object.keys(localStorage).filter((k) => k.startsWith('skinlog:')),
    };
  });

  await page.screenshot({ path: '/tmp/skinlog-check.png' });

  console.log('rendered:            yes');
  console.log('indexedDB databases:', storage.databases);
  console.log('storage.persisted(): ', storage.persisted);
  console.log('entries in IDB:      ', storage.entriesInIndexedDb ?? '(nothing yet)');
  console.log('localStorage keys:   ', storage.localStorageKeys);
  console.log('console errors:      ', problems.length ? problems : 'none');
} finally {
  await browser.close();
}
