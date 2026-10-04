// 공통: 글쓴이 확인 (Cloudflare 환경 변수)
//  WRITERS   = "비밀번호1:이름1,비밀번호2:이름2"   ← 글쓴이 목록 (Secret 으로 저장)
//  ADMIN_KEY = "관리자비밀번호"                   ← 모든 글 수정·삭제 가능 (Secret)
export function who(request, env){
  const key = (request.headers.get("x-writer-key") || "").trim();
  if (!key) return null;
  if (env.ADMIN_KEY && key === env.ADMIN_KEY) return { name: env.ADMIN_NAME || "관리자", admin: true };
  for (const pair of String(env.WRITERS || "").split(",")){
    const i = pair.indexOf(":"); if (i < 1) continue;
    if (pair.slice(0, i).trim() === key) return { name: pair.slice(i + 1).trim() || "글쓴이", admin: false };
  }
  return null;
}
export const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" }
});
export const clean = (v, max) => String(v ?? "").slice(0, max);
