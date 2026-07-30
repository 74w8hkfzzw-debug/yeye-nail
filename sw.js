// 椰椰Nail Service Worker - 离线缓存
const CACHE_NAME = 'yeye-nail-v1';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png',
  './icons/favicon-32.png'
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
      // 成功则更新缓存（仅 html/静态资源）
      if (res.ok && (e.request.mode === 'navigate' || /\.(png|json|css|js)$/.test(url.pathname))) {
        const copy = res.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(e.request, copy));
      }
      return res;
    }).catch(() => {
      // 离线时回退缓存
      return caches.match(e.request).then(cached => cached || caches.match('./index.html'));
    })
  );
});
