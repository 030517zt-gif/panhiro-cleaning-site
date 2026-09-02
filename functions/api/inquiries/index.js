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

  // 简单蜜罐：机器人常填的隐藏字段，命中即静默成功、不落库（在校验前判断，保持蜜罐静默性）
  if (clean(body.website, 200)) {
    return json({ ok: true }, 201);
  }

  const payload = inquiryPayload(body);
  const validation = validate(payload);
  if (validation) return json({ error: validation }, 400);

  try {
    const result = await env.DB.prepare(
      `INSERT INTO inquiries
        (name, company, contact, region, product, intent, message, lang, source, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
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
        payload.source,
        new Date().toISOString()
      )
      .run();

    return json({ ok: true, id: result.meta.last_row_id }, 201);
  } catch (caught) {
    console.error("Failed to save inquiry:", caught);
    return json({ error: "Failed to save inquiry." }, 500);
  }
}

// 后台读取：需要 ADMIN_TOKEN
export async function onRequestGet({ request, env }) {
  if (!env.DB) return json({ error: "D1 binding DB is not configured." }, 500);
  const error = authError(request, env);
  if (error) return json({ error }, 401);

  // 分页保护：默认最近 200 条，避免全表拖出导致响应膨胀
  const requested = Number(new URL(request.url).searchParams.get("limit"));
  const parsed = Number.isFinite(requested) ? Math.floor(requested) : 0;
  const limit = parsed > 0 ? Math.min(parsed, 500) : 200;

  try {
    const { results } = await env.DB.prepare(
      "SELECT * FROM inquiries ORDER BY id DESC LIMIT ?"
    ).bind(limit).all();
    // 新旧时间格式混存（旧数据无时区标记的 UTC，新数据 ISO 带时区），
    // 字符串排序会错位，统一解析为时间戳后再排序
    results.sort((a, b) => parseCreatedAt(b.created_at) - parseCreatedAt(a.created_at));
    return json({ inquiries: results });
  } catch (caught) {
    console.error("Failed to fetch inquiries:", caught);
    return json({ error: "Failed to fetch inquiries." }, 500);
  }
}

// 兼容 SQLite CURRENT_TIMESTAMP（"YYYY-MM-DD HH:MM:SS"，UTC 无时区标记）与 ISO 带时区两种格式
function parseCreatedAt(value) {
  const raw = String(value || "");
  const normalized = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(raw)
    ? `${raw.replace(" ", "T")}Z`
    : raw;
  const t = new Date(normalized).getTime();
  return Number.isNaN(t) ? 0 : t;
}
