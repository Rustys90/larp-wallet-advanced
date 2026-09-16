const CACHE = 'larp-wallet-v1';
const ASSETS = ['./', './index.html', './css/main.css', './css/phantom.css', './js/utils.js', './js/prices.js', './js/balances.js', './js/charts.js', './js/app.js', './manifest.json'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS))); self.skipWaiting(); });
self.addEventListener('activate', e => { e.waitUntil(self.clients.claim()); });
self.addEventListener('fetch', e => { e.respondWith(caches.match(e.request).then(r => r || fetch(e.request))); });
