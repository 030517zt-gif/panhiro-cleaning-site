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

// 单字段最大长度，避免超大 payload 滥用
const LIMITS = {
  name: 120,
  company: 160,
  contact: 160,
  region: 160,
  product: 160,
  intent: 160,
  message: 4000,
  lang: 8,
  source: 120
};

function clean(value, max) {
  return String(value ?? "").trim().slice(0, max);
}

function inquiryPayload(body) {
  return {
    name: clean(body.name, LIMITS.name),
    company: clean(body.company, LIMITS.company),
    contact: clean(body.contact, LIMITS.contact),
    region: clean(body.region, LIMITS.region),
    product: clean(body.product, LIMITS.product),
    intent: clean(body.intent, LIMITS.intent),
    message: clean(body.message, LIMITS.message),
    lang: clean(body.lang, LIMITS.lang) || "zh",
    source: clean(body.source, LIMITS.source)
  };
}

function validate(payload) {
  if (!payload.name) return "name is required.";
  if (!payload.contact) return "contact is required.";
  return null;
}

// 公开提交：任何访客都可以投递询盘
export async function onRequestPost({ request, env }) {
  if (!env.DB) return json({ error: "D1 binding DB is not configured." }, 500);

  const body = await request.json().catch(() => null);
  if (!body) return json({ error: "Invalid JSON body." }, 400);

  const payload = inquiryPayload(body);
  const validation = validate(payload);
  if (validation) return json({ error: validation }, 400);

  // 简单蜜罐：如果带了 website 字段（机器人常填），静默丢弃但返回成功
  if (clean(body.website, 200)) {
    return json({ ok: true }, 201);
  }

  try {
    const result = await env.DB.prepare(
      `INSERT INTO inquiries
        (name, company, contact, region, product, intent, message, lang, source)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(
        payload.name,
        payload.company,
        payload.contact,
        payload.region,
        payload.product,
        payload.intent,
        payload.message,
        payload.lang,
        payload.source
      )
      .run();

    return json({ ok: true, id: result.meta.last_row_id }, 201);
  } catch (caught) {
    return json({ error: caught.message || "Failed to save inquiry." }, 500);
  }
}

// 后台读取：需要 ADMIN_TOKEN
export async function onRequestGet({ request, env }) {
  if (!env.DB) return json({ error: "D1 binding DB is not configured." }, 500);
  const error = authError(request, env);
  if (error) return json({ error }, error === "Unauthorized." ? 401 : 500);

  const { results } = await env.DB.prepare(
    "SELECT * FROM inquiries ORDER BY created_at DESC, id DESC"
  ).all();
  return json({ inquiries: results });
}
