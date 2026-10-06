// GET /file/files/… → 정보 글에 첨부한 파일 내려받기 (R2)
export async function onRequestGet({ env, params }){
  const key = (params.path || []).join("/");
  if (!key.startsWith("files/")) return new Response("Not found", { status: 404 });
  const obj = await env.BUCKET.get(key);
  if (!obj) return new Response("Not found", { status: 404 });
  const h = new Headers(); obj.writeHttpMetadata(h); h.set("etag", obj.httpEtag);
  if (!h.get("content-disposition")) h.set("content-disposition", "attachment");
  if (!h.get("cache-control")) h.set("cache-control", "public, max-age=31536000, immutable");
  h.set("x-content-type-options", "nosniff");
  return new Response(obj.body, { headers: h });
}
