function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json;charset=UTF-8",
      "cache-control": "no-store"
    }
  });
}

// 恒定时间字符串比较，避免时序侧信道泄露 token 信息
function safeEqual(a, b) {
  const left = String(a || "");
  const right = String(b || "");
  if (left.length !== right.length) return false;
  let diff = 0;
  for (let i = 0; i < left.length; i++) {
    diff |= left.charCodeAt(i) ^ right.charCodeAt(i);
  }
  return diff === 0;
}

function authError(request, env) {
  const token = env.ADMIN_TOKEN;
  const header = request.headers.get("Authorization") || "";
  if (!token) return "Unauthorized.";
  if (!header.startsWith("Bearer ")) return "Unauthorized.";
  if (!safeEqual(header.slice(7), token)) return "Unauthorized.";
  return null;
}

// 严格正整数校验：拒绝空串、小数、十六进制、负数
function parseId(raw) {
  if (!/^\d+$/.test(String(raw || ""))) return null;
  const id = Number(raw);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

const ALLOWED_STATUS = new Set(["new", "handled", "archived"]);

export async function onRequestGet({ request, env, params }) {
  if (!env.DB) return json({ error: "D1 binding DB is not configured." }, 500);
  const error = authError(request, env);
  if (error) return json({ error }, 401);

  const id = parseId(params.id);
  if (id === null) return json({ error: "Invalid inquiry id." }, 400);

  try {
    const inquiry = await env.DB.prepare("SELECT * FROM inquiries WHERE id = ?").bind(id).first();
    if (!inquiry) return json({ error: "Inquiry not found." }, 404);
    return json({ inquiry });
  } catch (caught) {
    console.error("Failed to fetch inquiry:", caught);
    return json({ error: "Failed to fetch inquiry." }, 500);
  }
}

// 更新询盘处理状态（new / handled / archived）
export async function onRequestPut({ request, env, params }) {
  if (!env.DB) return json({ error: "D1 binding DB is not configured." }, 500);
  const error = authError(request, env);
  if (error) return json({ error }, 401);

  const id = parseId(params.id);
  if (id === null) return json({ error: "Invalid inquiry id." }, 400);

  const body = await request.json().catch(() => null);
  if (!body) return json({ error: "Invalid JSON body." }, 400);

  const status = String(body.status || "").trim();
  if (!ALLOWED_STATUS.has(status)) return json({ error: "Invalid status." }, 400);

  try {
    await env.DB.prepare("UPDATE inquiries SET status = ? WHERE id = ?").bind(status, id).run();
    const updated = await env.DB.prepare("SELECT * FROM inquiries WHERE id = ?").bind(id).first();
    if (!updated) return json({ error: "Inquiry not found." }, 404);
    return json({ inquiry: updated });
  } catch (caught) {
    console.error("Failed to update inquiry:", caught);
    return json({ error: "Failed to update inquiry." }, 500);
  }
}

export async function onRequestDelete({ request, env, params }) {
  if (!env.DB) return json({ error: "D1 binding DB is not configured." }, 500);
  const error = authError(request, env);
  if (error) return json({ error }, 401);

  const id = parseId(params.id);
  if (id === null) return json({ error: "Invalid inquiry id." }, 400);

  try {
    const result = await env.DB.prepare("DELETE FROM inquiries WHERE id = ?").bind(id).run();
    if (!result.meta.changes) return json({ error: "Inquiry not found." }, 404);
    return json({ ok: true });
  } catch (caught) {
    console.error("Failed to delete inquiry:", caught);
    return json({ error: "Failed to delete inquiry." }, 500);
  }
}
