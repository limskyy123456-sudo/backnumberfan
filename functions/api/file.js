import { who, json } from "./_auth.js";
// POST /api/file?name=원래파일이름  (본문 = 파일 그대로) → { url:"/file/files/…", name, size }
// 정보 글에 첨부하는 작은 파일 (PDF · 자막 · 텍스트 · zip). 받는 사람은 /file/… 로 내려받는다.
const BIN = "application/octet-stream";   // 자막·텍스트도 바이너리로 → 아이폰이 .txt 를 붙이거나 글자 화면으로 열지 않음
const TYPES = { pdf: "application/pdf", srt: BIN, vtt: BIN, ass: BIN, ssa: BIN, smi: BIN, sub: BIN, lrc: BIN, txt: BIN, zip: "application/zip" };
const MAX = 10 * 1024 * 1024;   // 한 파일 10MB 까지
export async function onRequestPost({ request, env }){
  const u = who(request, env); if (!u) return json({ error: "비밀번호가 맞지 않아요" }, 401);
  const name = (new URL(request.url).searchParams.get("name") || "file").replace(/[\\/:*?"<>|\u0000-\u001f]+/g, "_").slice(0, 120);
  const ext = (name.match(/\.([a-z0-9]+)$/i) || [])[1]?.toLowerCase() || "";
  if (!TYPES[ext]) return json({ error: `올릴 수 있는 파일: ${Object.keys(TYPES).join(", ")}` }, 400);
  const buf = await request.arrayBuffer();
  if (!buf.byteLength) return json({ error: "빈 파일이에요" }, 400);
  if (buf.byteLength > MAX) return json({ error: "파일은 10MB까지 올릴 수 있어요" }, 413);
  const d = new Date(), ym = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}`;
  const safe = name.replace(/\.[^.]+$/, "").replace(/[^\w-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40) || "file";
  const key = `files/${ym}/${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}-${safe}.${ext}`;
  const disp = `attachment; filename="${safe}.${ext}"; filename*=UTF-8''${encodeURIComponent(name)}`;
  await env.BUCKET.put(key, buf, { httpMetadata: { contentType: TYPES[ext], contentDisposition: disp, cacheControl: "public, max-age=31536000, immutable" } });
  return json({ ok: true, url: "/file/" + key, name, size: buf.byteLength });
}
