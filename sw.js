// 파일을 고쳐서 올릴 때마다 버전 숫자를 올려 주세요 (예: v2 → v3)
const CACHE = "backnumber-guide-v37";
const FILES = ["./", "./index.html", "./lyrics.js", "./manifest.json", "./icons/icon.svg", "./icons/icon-192.png", "./icons/icon-512.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
// 인터넷 되면 항상 최신 파일, 안 되면 저장해 둔 파일
self.addEventListener("fetch", e => {
  const u = new URL(e.request.url);
  if (e.request.method !== "GET" || u.origin !== location.origin) return;
  if (/^\/(file|api|img)\//.test(u.pathname)) return;   // 첨부 파일 · 서버 글 · 사진은 저장하지 않고 그대로

  e.respondWith(
    fetch(e.request).then(res => {
      const copy = res.clone();
      caches.open(CACHE).then(c => c.put(e.request, copy));
      return res;
    }).catch(() => caches.match(e.request).then(r => r || caches.match("./index.html")))
  );
});
