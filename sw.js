// 吋讀 Tsundoku service worker：讓網站可以安裝到手機，並在離線時打開
const CACHE = 'tsundoku-shell-0.5.2';
const SHARE = 'tsundoku-share';
const RUNTIME = 'tsundoku-runtime';
const SHELL = ['./', './index.html', './manifest.webmanifest', './logo-mark.png', './favicon-64.png', './apple-touch-icon.png', './icon-192.png', './icon-512.png', './icon-maskable-512.png'];

self.addEventListener('install', e => {
  // cache: 'reload'：不要拿瀏覽器暫存的舊檔案
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL.map(u => new Request(u, { cache: 'reload' })))).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k.startsWith('tsundoku-') && k !== CACHE && k !== RUNTIME && k !== SHARE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  const url = new URL(req.url);

  // 從別的 App 分享圖片進來：先存起來，再打開吋讀去處理
  if (req.method === 'POST' && url.origin === location.origin && url.pathname.endsWith('/share-target')) {
    e.respondWith((async () => {
      const back = q => Response.redirect(new URL('./?share=' + q, self.registration.scope).href, 303);
      const info = { at: new Date().toISOString(), fields: [], texts: {} };
      let c = null;
      try {
        c = await caches.open(SHARE);
        const form = await req.formData();
        let file = null;
        // 不管欄位叫什麼，只要有檔案就收；有些 App 分享的圖片沒有標格式
        for (const [k, v] of form.entries()) {
          if (v && typeof v === 'object' && 'size' in v) {
            info.fields.push({ k, file: true, type: v.type || '', size: v.size, name: v.name || '' });
            if (!file && v.size > 0 && (!v.type || v.type.startsWith('image/') || v.type === 'application/octet-stream')) file = v;
          } else {
            const t = String(v || '');
            info.fields.push({ k, text: t.slice(0, 400) });
            if (t) info.texts[k] = t;
          }
        }
        await c.put('./share-info', new Response(JSON.stringify(info), { headers: { 'content-type': 'application/json' } }));
        if (file) {
          await c.put('./shared-image', new Response(file, { headers: { 'content-type': file.type || 'application/octet-stream' } }));
          return back('1');
        }
        return back(Object.keys(info.texts).length ? 'text' : 'none');
      } catch (err) {
        info.error = String((err && err.message) || err);
        try { if (c) await c.put('./share-info', new Response(JSON.stringify(info), { headers: { 'content-type': 'application/json' } })); } catch (e2) {}
        return back('error');
      }
    })());
    return;
  }
  if (req.method !== 'GET') return;

  if (url.origin === location.origin) {
    // App 設定檔：先上網拿最新版，不然 Chrome 安裝時會讀到舊的（例如沒有分享功能）
    if (url.pathname.endsWith('/manifest.webmanifest')) {
      e.respondWith(
        fetch(req, { cache: 'no-store' })
          .then(res => { const copy = res.clone(); caches.open(CACHE).then(c => c.put('./manifest.webmanifest', copy)); return res; })
          .catch(() => caches.match('./manifest.webmanifest'))
      );
      return;
    }
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
