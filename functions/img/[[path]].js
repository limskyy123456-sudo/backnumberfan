// GET /img/info/… → R2 에 올린 사진 보여 주기
export async function onRequestGet({ env, params }){
  const key = (params.path || []).join("/");
  if (!key) return new Response("Not found", { status: 404 });
  const obj = await env.BUCKET.get(key);
  if (!obj) return new Response("Not found", { status: 404 });
  const h = new Headers(); obj.writeHttpMetadata(h); h.set("etag", obj.httpEtag);
  if (!h.get("cache-control")) h.set("cache-control", "public, max-age=31536000, immutable");
  return new Response(obj.body, { headers: h });
}
// HEAD /img/info/… → 사진이 서버에 있는지만 확인 (글 올리기 전 '사진 준비 중' 검사용)
export async function onRequestHead({ env, params }){
  const key = (params.path || []).join("/");
  const obj = key ? await env.BUCKET.head(key) : null;
  if (!obj) return new Response(null, { status: 404 });
  const h = new Headers(); obj.writeHttpMetadata(h); h.set("etag", obj.httpEtag);
  return new Response(null, { headers: h });
}
