function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json;charset=UTF-8",
      "cache-control": "no-store"
    }
  });
}

function authError(request, env) {
  const token = env.ADMIN_TOKEN;
  const header = request.headers.get("Authorization") || "";
  if (!token) return "ADMIN_TOKEN is not configured.";
  if (header !== `Bearer ${token}`) return "Unauthorized.";
  return null;
}

const ALLOWED_STATUS = new Set(["new", "handled", "archived"]);

// 更新询盘处理状态（new / handled / archived）
export async function onRequestPut({ request, env, params }) {
  if (!env.DB) return json({ error: "D1 binding DB is not configured." }, 500);
  const error = authError(request, env);
  if (error) return json({ error }, error === "Unauthorized." ? 401 : 500);

  const id = Number(params.id);
  if (!Number.isFinite(id)) return json({ error: "Invalid inquiry id." }, 400);

  const body = await request.json().catch(() => null);
  if (!body) return json({ error: "Invalid JSON body." }, 400);

  const status = String(body.status || "").trim();
  if (!ALLOWED_STATUS.has(status)) return json({ error: "Invalid status." }, 400);

  await env.DB.prepare("UPDATE inquiries SET status = ? WHERE id = ?").bind(status, id).run();
  const updated = await env.DB.prepare("SELECT * FROM inquiries WHERE id = ?").bind(id).first();
  if (!updated) return json({ error: "Inquiry not found." }, 404);
  return json({ inquiry: updated });
}

export async function onRequestDelete({ request, env, params }) {
  if (!env.DB) return json({ error: "D1 binding DB is not configured." }, 500);
  const error = authError(request, env);
  if (error) return json({ error }, error === "Unauthorized." ? 401 : 500);

  const id = Number(params.id);
  if (!Number.isFinite(id)) return json({ error: "Invalid inquiry id." }, 400);

  await env.DB.prepare("DELETE FROM inquiries WHERE id = ?").bind(id).run();
  return json({ ok: true });
}
