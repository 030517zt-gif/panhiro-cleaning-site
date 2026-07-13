function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json;charset=UTF-8",
      "cache-control": "no-store"
    }
  });
}

export async function onRequestPost({ request, env }) {
  const adminUser = env.ADMIN_USER;
  const adminPass = env.ADMIN_PASS;
  const adminToken = env.ADMIN_TOKEN;

  if (!adminUser || !adminPass || !adminToken) {
    return json({ error: "登录凭据未配置，请联系管理员。" }, 500);
  }

  const body = await request.json().catch(() => null);
  if (!body) return json({ error: "请求格式错误。" }, 400);

  const username = String(body.username || "").trim();
  const password = String(body.password || "");

  if (!username || !password) {
    return json({ error: "请输入用户名和密码。" }, 400);
  }

  if (username !== adminUser || password !== adminPass) {
    return json({ error: "用户名或密码错误。" }, 401);
  }

  return json({ ok: true, token: adminToken });
}
