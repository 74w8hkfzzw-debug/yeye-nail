// 椰椰Nail Service Worker - 离线缓存
const CACHE_NAME = 'yeye-nail-v2'; // 升版本号强制清旧缓存
const BASE = '/yeye-nail/';
const ASSETS = [
  BASE,
  BASE + 'index.html',
  BASE + 'manifest.json',
  BASE + 'icons/icon-192.png',
  BASE + 'icons/icon-512.png',
  BASE + 'icons/apple-touch-icon.png',
  BASE + 'icons/favicon-32.png'
];

// 安装：预缓存核心资源
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

// 激活：清理旧缓存
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
    )).then(() => self.clients.claim())
  );
});

// 请求拦截：网络优先，失败回退缓存（保证离线可用 + 数据实时）
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  // 只缓存同源请求
  const url = new URL(e.request.url);
  if (url.origin !== self.location.origin) return;

  e.respondWith(
    fetch(e.request).then(res => {
      // HTML 请求只走网络，不缓存（保证新版本能立即生效）
      const isHtml = e.request.mode === 'navigate' || e.request.headers.get('accept')?.includes('text/html');
      if (res.ok && !isHtml && /\.(png|json|css|js|svg)$/.test(url.pathname)) {
        const copy = res.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(e.request, copy));
      }
      return res;
    }).catch(() => {
      // 离线时回退缓存
      return caches.match(e.request).then(cached => cached || caches.match(BASE + 'index.html'));
    })
  );
});
