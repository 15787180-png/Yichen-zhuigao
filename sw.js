/* 离线缓存：联网时永远拿最新，断网时用缓存兜底 */
const V = 'zhui-v8';
const SHELL = [
  './', 'index.html', 'css/app.css', 'manifest.webmanifest',
  'assets/fonts/fangyuan-var.woff2',
  'js/data-menu.js', 'js/data-sea.js', 'js/data.js', 'js/store.js', 'js/ui.js', 'js/sheets.js',
  'js/cloud.js', 'js/views-home.js', 'js/views-food.js', 'js/views-move.js',
  'js/views-growth.js', 'js/views-me.js', 'js/views-kb.js', 'js/app.js'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(V).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()).catch(() => {}));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== V).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return; // CDN 等跨域请求走网络

  const isDoc = req.mode === 'navigate' || /\.html?$/.test(url.pathname) || url.pathname.endsWith('/');
  e.respondWith(
    fetch(req)
      .then((res) => {
        const cp = res.clone();
        caches.open(V).then((c) => c.put(req, cp)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(req).then((r) => r || caches.match('index.html')))
  );
});
