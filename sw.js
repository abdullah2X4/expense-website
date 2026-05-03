self.addEventListener('install', e => {
  e.waitUntil(caches.open('v5.1-vip').then(c => c.addAll(['./', './index.html', './style.css', './script.js'])));
});
self.addEventListener('fetch', e => {
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
});
