// GET /file/files/… → 정보 글에 첨부한 파일 내려받기 (R2)
export async function onRequestGet({ env, params }){
  const key = (params.path || []).join("/");
  if (!key.startsWith("files/")) return new Response("Not found", { status: 404 });
  const obj = await env.BUCKET.get(key);
  if (!obj) return new Response("Not found", { status: 404 });
  const h = new Headers(); obj.writeHttpMetadata(h); h.set("etag", obj.httpEtag);
  // PDF·zip 말고는 내려받기 전용 형식으로 (예전에 text/plain 으로 올린 자막도 .ass.txt 로 안 바뀌게)
  if (!/\.(pdf|zip)$/i.test(key)) h.set("content-type", "application/octet-stream");
  if (!h.get("content-disposition")) h.set("content-disposition", "attachment");
  h.set("cache-control", "no-cache");   // 예전 응답(글자 파일 형식)이 휴대폰에 남지 않게
  h.set("x-content-type-options", "nosniff");
  return new Response(obj.body, { headers: h });
}
// HEAD /file/files/… → 있는지만 확인
export async function onRequestHead({ env, params }){
  const key = (params.path || []).join("/");
  const obj = key.startsWith("files/") ? await env.BUCKET.head(key) : null;
  return new Response(null, { status: obj ? 200 : 404, headers: obj ? { "content-type": "application/octet-stream" } : {} });
}
