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

function slugify(value) {
  const slug = String(value || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return slug || `news-${Date.now()}`;
}

// 单字段最大长度，避免超大 payload 撑爆数据库
const LIMITS = {
  title: 300,
  slug: 200,
  category: 100,
  excerpt: 1000,
  content: 4194304,
  title_zh: 300,
  category_zh: 100,
  excerpt_zh: 1000,
  content_zh: 50000,
  title_en: 300,
  category_en: 100,
  excerpt_en: 1000,
  content_en: 50000,
  image_url: 2097152,
  published_at: 10
};

function newsPayload(body) {
  const s = (value, max) => String(value ?? "").trim().slice(0, max);
  return {
    title: s(body.title, LIMITS.title),
    slug: s(body.slug || slugify(body.title), LIMITS.slug),
    category: s(body.category, LIMITS.category),
    excerpt: s(body.excerpt, LIMITS.excerpt),
    content: s(body.content, LIMITS.content),
    title_zh: s(body.title_zh, LIMITS.title_zh),
    category_zh: s(body.category_zh, LIMITS.category_zh),
    excerpt_zh: s(body.excerpt_zh, LIMITS.excerpt_zh),
    content_zh: s(body.content_zh, LIMITS.content_zh),
    title_en: s(body.title_en, LIMITS.title_en),
    category_en: s(body.category_en, LIMITS.category_en),
    excerpt_en: s(body.excerpt_en, LIMITS.excerpt_en),
    content_en: s(body.content_en, LIMITS.content_en),
    image_url: s(body.image_url, LIMITS.image_url),
    published_at: s(body.published_at || new Date().toISOString().slice(0, 10), LIMITS.published_at),
    published: body.published === 0 || body.published === false ? 0 : 1
  };
}

function validate(payload) {
  const required = ["title", "slug", "category", "excerpt", "content", "image_url", "published_at"];
  for (const key of required) {
    if (!payload[key]) return `${key} is required.`;
  }
  return null;
}

export async function onRequestGet({ env }) {
  if (!env.DB) return json({ error: "D1 binding DB is not configured." }, 500);
  try {
    const { results } = await env.DB.prepare(
      "SELECT * FROM news_posts ORDER BY published_at DESC, id DESC"
    ).all();
    return json({ news: results });
  } catch (caught) {
    console.error("Failed to fetch news:", caught);
    return json({ error: "Failed to fetch news." }, 500);
  }
}

export async function onRequestPost({ request, env }) {
  if (!env.DB) return json({ error: "D1 binding DB is not configured." }, 500);
  const error = authError(request, env);
  if (error) return json({ error }, 401);

  const body = await request.json().catch(() => null);
  if (!body) return json({ error: "Invalid JSON body." }, 400);

  const payload = newsPayload(body);
  const validation = validate(payload);
  if (validation) return json({ error: validation }, 400);

  try {
    const result = await env.DB.prepare(
      `INSERT INTO news_posts
        (title, slug, category, excerpt, content, title_zh, category_zh, excerpt_zh, content_zh, title_en, category_en, excerpt_en, content_en, image_url, published_at, published, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(
        payload.title,
        payload.slug,
        payload.category,
        payload.excerpt,
        payload.content,
        payload.title_zh,
        payload.category_zh,
        payload.excerpt_zh,
        payload.content_zh,
        payload.title_en,
        payload.category_en,
        payload.excerpt_en,
        payload.content_en,
        payload.image_url,
        payload.published_at,
        payload.published,
        new Date().toISOString()
      )
      .run();

    const created = await env.DB.prepare("SELECT * FROM news_posts WHERE id = ?")
      .bind(result.meta.last_row_id)
      .first();
    return json({ news: created }, 201);
  } catch (caught) {
    console.error("Failed to create news post:", caught);
    if (String(caught && caught.message || "").includes("UNIQUE constraint failed")) {
      return json({ error: `A news post with slug "${payload.slug}" already exists.` }, 409);
    }
    return json({ error: "Failed to create news post." }, 500);
  }
}
