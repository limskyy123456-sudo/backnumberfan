// 오프라인 저장 (버전 숫자를 올리지 않아도 돼요)
// · 페이지·스크립트: 인터넷이 되면 항상 서버에서 최신인지 확인해서 받고, 안 되면 저장해 둔 것
// · 사진·영상(images/·icons/): 저장해 둔 걸 바로 보여주고, 뒤에서 새 파일로 바꿔 둠
// · 사진 저장은 최근 150개까지만 (폰 저장 공간 절약)
const CACHE = "backnumber-site", IMG = "backnumber-img", IMG_MAX = 150;
const FILES = ["./", "./index.html", "./lyrics.js", "./manifest.json", "./icons/icon.svg", "./icons/icon-192.png", "./icons/icon-512.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES.map(f => new Request(f, { cache:"no-cache" })))).catch(() => {}).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  // 예전 방식(버전 붙은 이름)으로 저장된 것은 지운다
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE && k !== IMG).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
async function trimImages(){
  const c = await caches.open(IMG), keys = await c.keys();
  for (let i = 0; i < keys.length - IMG_MAX; i++) await c.delete(keys[i]);
}
self.addEventListener("fetch", e => {
  const u = new URL(e.request.url);
  if (e.request.method !== "GET" || u.origin !== location.origin) return;
  if (/^\/(file|api|img)\//.test(u.pathname)) return;   // 첨부 파일 · 서버 글 · 사진은 저장하지 않고 그대로
  if (e.request.headers.has("range")) return;            // 영상 부분 요청은 그대로

  // 사진 · 영상: 저장본 먼저, 뒤에서 새로 받아 바꿔 둠
  if (/^\/(images|icons)\//.test(u.pathname)){
    e.respondWith(caches.open(IMG).then(async c => {
      const hit = await c.match(e.request);
      const net = fetch(e.request).then(res => { if (res.ok) { c.put(e.request, res.clone()); trimImages(); } return res; }).catch(() => hit);
      return hit || net;
    }));
    return;
  }
  // 페이지 · 스크립트: 항상 서버에 최신인지 물어봄 (안 바뀌었으면 304라서 빠름)
  e.respondWith(
    fetch(e.request, { cache:"no-cache" }).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); }
      return res;
    }).catch(() => caches.match(e.request).then(r => r || (e.request.mode === "navigate" ? caches.match("./index.html") : undefined)))
  );
});
