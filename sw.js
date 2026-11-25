// 吋讀 Tsundoku service worker：讓網站可以安裝到手機，並在離線時打開
const CACHE = 'tsundoku-shell-0.2.0';
const RUNTIME = 'tsundoku-runtime';
const SHELL = ['./', './index.html', './manifest.webmanifest', './logo-mark.png', './favicon-64.png', './apple-touch-icon.png', './icon-192.png', './icon-512.png', './icon-maskable-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k.startsWith('tsundoku-') && k !== CACHE && k !== RUNTIME).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  if (url.origin === location.origin) {
    // 網頁本身：先上網拿最新版，離線時用快取
    if (req.mode === 'navigate') {
      e.respondWith(
        fetch(req)
          .then(res => { const copy = res.clone(); caches.open(CACHE).then(c => c.put('./index.html', copy)); return res; })
          .catch(() => caches.match('./index.html'))
      );
      return;
    }
    // 圖示等檔案：先用快取
    e.respondWith(caches.match(req).then(hit => hit || fetch(req)));
    return;
  }

  // Firebase 程式庫與字型：第一次下載後存起來，離線也能啟動
  const cacheable = (url.hostname === 'www.gstatic.com' && url.pathname.startsWith('/firebasejs/')) ||
    url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';
  if (cacheable) {
    e.respondWith(caches.open(RUNTIME).then(async c => {
      const hit = await c.match(req);
      if (hit) return hit;
      const res = await fetch(req);
      if (res.ok || res.type === 'opaque') c.put(req, res.clone());
      return res;
    }));
  }
});
