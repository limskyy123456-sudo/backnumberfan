import { who, json } from "./_auth.js";
// POST /api/upload  (본문 = 사진 파일 그대로, content-type = image/…) → { url:"/img/info/…" }
const EXT = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif", "image/avif": "avif" };
export async function onRequestPost({ request, env }){
  const u = who(request, env); if (!u) return json({ error: "비밀번호가 맞지 않아요" }, 401);
  const type = (request.headers.get("content-type") || "").split(";")[0].trim();
  if (!EXT[type]) return json({ error: "사진 파일(jpg·png·webp·gif)만 올릴 수 있어요" }, 400);
  const buf = await request.arrayBuffer();
  if (buf.byteLength > 10 * 1024 * 1024) return json({ error: "사진은 10MB까지 올릴 수 있어요" }, 413);
  const d = new Date(), ym = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}`;
  const key = `info/${ym}/${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}.${EXT[type]}`;
  await env.BUCKET.put(key, buf, { httpMetadata: { contentType: type, cacheControl: "public, max-age=31536000, immutable" } });
  return json({ ok: true, url: "/img/" + key });
}
