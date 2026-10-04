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
