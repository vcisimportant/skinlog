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
  await page.waitForFunction(() => /how does your skin look/i.test(document.body.innerText), { timeout: 20000 });

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

  // react-native-web's Alert is a no-op, so every confirmation has to be driven
  // through the browser's own dialog to prove it actually fires.
  let dialogSeen = null;
  page.on('dialog', async (d) => {
    dialogSeen = d.message().split('\n')[0];
    await d.accept();
  });

  // A Pressable's containing row often reads as the same text (its input
  // contributes none), so anything wide enough to be a row is excluded and the
  // topmost of what is left is taken — that is the actual control.
  const tap = async (label) => {
    const box = await page.evaluate((text) => {
      const hits = [...document.querySelectorAll('div,span')]
        .filter((e) => e.textContent?.trim() === text)
        .map((e) => e.getBoundingClientRect())
        .filter((r) => r.width > 0 && r.height > 0 && r.width < 150)
        .sort((a, z) => a.y - z.y);
      if (!hits.length) return null;
      const r = hits[0];
      return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
    }, label);
    if (!box) throw new Error(`could not find a tappable "${label}"`);
    await page.mouse.click(box.x, box.y);
    await new Promise((r) => setTimeout(r, 700));
  };

  await tap('Setup');
  await page.waitForSelector('input');
  await page.type('input', 'Test Serum');
  await tap('Add');
  const added = (await page.evaluate(() => document.body.innerText)).includes('Test Serum');

  await tap('Remove');
  await new Promise((r) => setTimeout(r, 800));
  const stillThere = (await page.evaluate(() => document.body.innerText)).includes('Test Serum');

  console.log('product added:       ', added ? 'yes' : 'NO');
  console.log('confirm dialog:      ', dialogSeen ?? 'NONE SHOWN');
  console.log('removed after accept:', !stillThere ? 'yes' : 'NO - still listed');

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
