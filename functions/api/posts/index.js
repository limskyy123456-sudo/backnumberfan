import { who, json, clean } from "../_auth.js";
// GET  /api/posts  → 올라온 글 전체 (누구나)
// POST /api/posts  → 새 글 (글쓴이 비밀번호 필요)
export async function onRequestGet({ env }){
  const { results } = await env.DB.prepare(
    "SELECT id, title, date, tag, summary, cover, body, author, updated_at FROM posts ORDER BY date DESC, created_at DESC"
  ).all();
  return json(results || []);
}
export async function onRequestPost({ request, env }){
  const u = who(request, env); if (!u) return json({ error: "비밀번호가 맞지 않아요" }, 401);
  let p; try { p = await request.json(); } catch(e){ return json({ error: "잘못된 요청" }, 400); }
  if (!clean(p.title, 200).trim()) return json({ error: "제목을 써 주세요" }, 400);
  let id = clean(p.id, 60).replace(/[^\w-]+/g, "-").replace(/^-|-$/g, "") || ("post-" + (clean(p.date, 20).replace(/\D/g, "") || Date.now().toString(36)));
  id = "u-" + id;
  // 같은 주소가 있으면 뒤에 숫자를 붙인다
  for (let n = 2; await env.DB.prepare("SELECT 1 FROM posts WHERE id = ?").bind(id).first(); n++) id = id.replace(/-\d+$/, "") + "-" + n;
  const now = Date.now();
  await env.DB.prepare(
    "INSERT INTO posts (id, title, date, tag, summary, cover, body, author, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
  ).bind(id, clean(p.title, 200), clean(p.date, 20), clean(p.tag, 40), clean(p.summary, 300), clean(p.cover, 300), clean(p.body, 200000), u.name, now, now).run();
  return json({ ok: true, id });
}
