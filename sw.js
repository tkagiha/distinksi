/* Distinksi service worker v2 — 更新反映＋オフライン両立 */
const CACHE = "distinksi-v56";
const SHELL = [
  "./", "./index.html", "./data.js", "./gloss.js", "./cards.js", "./extra.js",
  "./manifest.webmanifest", "./icon-192.png", "./icon-512.png", "./favicon.png", "./archipelago.png", "./news.js",
  "./packs.js", "./cities.js"
];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

async function cacheFirst(req) {
  const hit = await caches.match(req);
  if (hit) return hit;
  try {
    const res = await fetch(req);
    if (res && res.status === 200) { const c = res.clone(); const cache = await caches.open(CACHE); cache.put(req, c); }
    return res;
  } catch (e) { return hit; }
}
async function networkFirst(req) {
  try {
    const res = await fetch(req);
    if (res && res.status === 200) { const c = res.clone(); const cache = await caches.open(CACHE); cache.put(req, c); }
    return res;
  } catch (e) {
    const hit = await caches.match(req);
    return hit || caches.match("./index.html");
  }
}

/* 音声(mp3)・画像はキャッシュ優先（オフライン再生）。HTML/JSはネットワーク優先（更新をすぐ反映） */
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;
  const isAsset = /\.(mp3|png|jpg|jpeg|svg|ico)$/i.test(url.pathname) || url.pathname.includes("/audio/");
  e.respondWith(isAsset ? cacheFirst(req) : networkFirst(req));
});
