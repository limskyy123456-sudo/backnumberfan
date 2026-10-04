import { who, json } from "./_auth.js";
// 비밀번호 확인 → { name, admin }
export async function onRequestGet({ request, env }){
  const u = who(request, env);
  return u ? json(u) : json({ error: "비밀번호가 맞지 않아요" }, 401);
}
