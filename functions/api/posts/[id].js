import { who, json, clean } from "../_auth.js";
// PUT    /api/posts/글id → 수정 (쓴 사람 또는 관리자)
// DELETE /api/posts/글id → 삭제 (쓴 사람 또는 관리자)
async function mine(request, env, id){
  const u = who(request, env); if (!u) return [null, json({ error: "비밀번호가 맞지 않아요" }, 401)];
  const row = await env.DB.prepare("SELECT author FROM posts WHERE id = ?").bind(id).first();
  if (!row) return [null, json({ error: "글을 찾을 수 없어요" }, 404)];
  if (!u.admin && row.author !== u.name) return [null, json({ error: "다른 사람이 쓴 글은 고칠 수 없어요" }, 403)];
  return [u, null];
}
export async function onRequestPut({ request, env, params }){
  const [u, err] = await mine(request, env, params.id); if (err) return err;
  let p; try { p = await request.json(); } catch(e){ return json({ error: "잘못된 요청" }, 400); }
  if (!clean(p.title, 200).trim()) return json({ error: "제목을 써 주세요" }, 400);
  await env.DB.prepare(
    "UPDATE posts SET title = ?, date = ?, tag = ?, summary = ?, cover = ?, body = ?, updated_at = ? WHERE id = ?"
  ).bind(clean(p.title, 200), clean(p.date, 20), clean(p.tag, 40), clean(p.summary, 300), clean(p.cover, 300), clean(p.body, 200000), Date.now(), params.id).run();
  return json({ ok: true, id: params.id });
}
export async function onRequestDelete({ request, env, params }){
  const [u, err] = await mine(request, env, params.id); if (err) return err;
  await env.DB.prepare("DELETE FROM posts WHERE id = ?").bind(params.id).run();
  return json({ ok: true });
}
