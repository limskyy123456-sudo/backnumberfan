// GET /api/views?ids=유튜브ID,유튜브ID,… (최대 50개) → { at, views:{ id: 조회수 } }
// Cloudflare 설정에 YT_API_KEY (YouTube Data API v3 키, Secret) 가 있어야 동작해요. 없으면 404 → 사이트는 저장된 숫자를 씀
// 같은 요청은 6시간 동안 저장해 뒀다가 그대로 돌려줘서 API 사용량이 거의 안 들어요
const TTL = 6 * 60 * 60;
export async function onRequestGet({ request, env, waitUntil }){
  if (!env.YT_API_KEY) return new Response(JSON.stringify({ error:"no key" }), { status:404, headers:{ "content-type":"application/json" } });
  const url = new URL(request.url);
  const ids = (url.searchParams.get("ids") || "").split(",").map(s => s.trim()).filter(s => /^[\w-]{11}$/.test(s)).slice(0, 50);
  if (!ids.length) return new Response(JSON.stringify({ error:"no ids" }), { status:400, headers:{ "content-type":"application/json" } });
  const key = new Request(url.origin + "/api/views?ids=" + ids.slice().sort().join(","));
  const cache = caches.default;
  const hit = await cache.match(key);
  if (hit) return hit;
  const r = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${ids.join(",")}&key=${env.YT_API_KEY}`);
  if (!r.ok) return new Response(JSON.stringify({ error:"youtube " + r.status }), { status:502, headers:{ "content-type":"application/json" } });
  const j = await r.json(), views = {};
  (j.items || []).forEach(it => { views[it.id] = Number(it.statistics && it.statistics.viewCount) || 0; });
  const res = new Response(JSON.stringify({ at:new Date().toISOString(), views }), {
    headers:{ "content-type":"application/json; charset=utf-8", "cache-control":`public, max-age=${TTL}` } });
  waitUntil(cache.put(key, res.clone()));
  return res;
}
