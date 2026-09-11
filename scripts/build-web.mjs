// Turns the Expo web export into something that works as a GitHub Pages subpath
// and as an offline home-screen app:
//   - absolute /_expo/ asset paths become relative, so /<repo>/ hosting works
//   - PWA manifest, Apple icons and safe-area padding are injected
//   - a service worker precaches the shell so it opens without a connection
import { execSync } from 'node:child_process';
import { copyFileSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const OUT = 'dist-web';

rmSync(OUT, { recursive: true, force: true });
execSync(`npx expo export --platform web --output-dir ${OUT}`, { stdio: 'inherit' });

// --- icons ---
for (const name of ['icon-192.png', 'icon-512.png', 'apple-touch-icon.png']) {
  copyFileSync(join('assets', name), join(OUT, name));
}

// --- manifest ---
writeFileSync(
  join(OUT, 'manifest.webmanifest'),
  JSON.stringify(
    {
      name: 'Skinlog',
      short_name: 'Skinlog',
      description: 'A one-minute-a-day skin diary',
      start_url: './',
      scope: './',
      display: 'standalone',
      orientation: 'portrait',
      background_color: '#EDF1EA',
      theme_color: '#1E3127',
      icons: [
        { src: './icon-192.png', sizes: '192x192', type: 'image/png' },
        { src: './icon-512.png', sizes: '512x512', type: 'image/png' },
        { src: './icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      ],
    },
    null,
    2,
  ),
);

// --- index.html ---
const indexPath = join(OUT, 'index.html');
let html = readFileSync(indexPath, 'utf8');

// Relative paths so the app works at / or at /skinlog/ without being rebuilt.
html = html.replace(/(src|href)="\/(?!\/)/g, '$1="./');

html = html.replace(
  '<meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />',
  '<meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover" />',
);

html = html.replace(
  '</head>',
  `  <link rel="manifest" href="./manifest.webmanifest" />
    <link rel="icon" type="image/png" href="./icon-192.png" />
    <link rel="apple-touch-icon" href="./apple-touch-icon.png" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-title" content="Skinlog" />
    <meta name="mobile-web-app-capable" content="yes" />
    <meta name="theme-color" content="#EDF1EA" media="(prefers-color-scheme: light)" />
    <meta name="theme-color" content="#141A16" media="(prefers-color-scheme: dark)" />
    <style id="skinlog-shell">
      /* Standalone mode draws under the notch and the home indicator, and
         react-native-web's SafeAreaView does not pad for either. */
      body { background: #EDF1EA; }
      /* expo-reset leaves #root as a flex ROW with no width bound, so the app
         lays itself out wider than the screen and the last tab falls off. */
      #root {
        flex-direction: column;
        width: 100%;
        max-width: 100vw;
        overflow-x: hidden;
        padding-top: env(safe-area-inset-top);
        padding-bottom: env(safe-area-inset-bottom);
        box-sizing: border-box;
      }
      @media (prefers-color-scheme: dark) { body { background: #141A16; } }
    </style>
  </head>`,
);

html = html.replace(
  '</body>',
  `  <script>
      // Cache-first means a relaunch is served the old copy while the new worker
      // installs behind it, so an update would otherwise only appear on the
      // launch after next. Reloading once when the new worker takes over makes
      // it land immediately.
      if ('serviceWorker' in navigator) {
        window.addEventListener('load', function () {
          navigator.serviceWorker.register('./sw.js').catch(function () {});
          var reloaded = false;
          navigator.serviceWorker.addEventListener('controllerchange', function () {
            if (reloaded) return;
            reloaded = true;
            window.location.reload();
          });
        });
      }
    </script>
  </body>`,
);
writeFileSync(indexPath, html);

// --- service worker, precaching whatever the export actually produced ---
const bundles = readdirSync(join(OUT, '_expo/static/js/web')).filter((f) => f.endsWith('.js'));
const assets = ['./', './index.html', './manifest.webmanifest', './apple-touch-icon.png', './icon-192.png', './icon-512.png']
  .concat(bundles.map((f) => `./_expo/static/js/web/${f}`));
const version = bundles[0] ?? String(Date.now());

writeFileSync(
  join(OUT, 'sw.js'),
  `const CACHE = 'skinlog-${version}';
const ASSETS = ${JSON.stringify(assets, null, 2)};

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

// Cache first: the diary must open with no connection at all. A new build lands
// under a new cache name, so updates still arrive on the next launch.
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== self.location.origin) return;
  e.respondWith(
    caches.match(e.request).then(
      (hit) =>
        hit ||
        fetch(e.request)
          .then((res) => {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(e.request, copy)).catch(() => {});
            return res;
          })
          .catch(() => caches.match('./index.html')),
    ),
  );
});
`,
);

console.log(`\nWeb build ready in ${OUT}/ — ${assets.length} files precached for offline use.`);
