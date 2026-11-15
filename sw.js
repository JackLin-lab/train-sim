/* 臺鐵駕駛模擬器 Service Worker：首次開啟後快取，之後可離線遊玩。
   改版時請把 VER 的數字加 1，手機才會換成新版。 */
const VER = 'trainsim-v1';
const SHELL = ['./', 'index.html', 'manifest.webmanifest', 'train-icon-192.png', 'train-icon-512.png', 'train-icon-maskable.png'];

self.addEventListener('install', (e) => {
  e.waitUntil((async () => {
    const c = await caches.open(VER);
    await Promise.all(SHELL.map((u) => c.add(new Request(u, { cache: 'reload' })).catch(() => {})));
    self.skipWaiting();
  })());
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k !== VER).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

// 有網路時一律先抓最新檔案（不吃瀏覽器舊快取）；沒網路才用快取，所以不會再有新舊檔混用的問題
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  e.respondWith((async () => {
    const cache = await caches.open(VER);
    try {
      const res = await fetch(req, { cache: 'no-cache' });
      if (res && res.ok) cache.put(req, res.clone());
      return res;
    } catch (err) {
      const hit = await cache.match(req, { ignoreSearch: true }) || (req.mode === 'navigate' ? await cache.match('index.html') : null);
      if (hit) return hit;
      throw err;
    }
  })());
});
