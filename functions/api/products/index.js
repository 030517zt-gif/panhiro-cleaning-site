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
  return slug || `product-${Date.now()}`;
}

// 单字段最大长度，避免超大 payload 撑爆数据库
const LIMITS = {
  name: 200,
  slug: 200,
  category: 100,
  tagline: 300,
  description: 8000,
  name_zh: 200,
  category_zh: 100,
  tagline_zh: 300,
  description_zh: 8000,
  image_url: 2097152
};

function productPayload(body) {
  const s = (value, max) => String(value ?? "").trim().slice(0, max);
  let sort_order = Number(body.sort_order);
  if (!Number.isFinite(sort_order)) sort_order = 0;
  return {
    name: s(body.name, LIMITS.name),
    slug: s(body.slug || slugify(body.name), LIMITS.slug),
    category: s(body.category, LIMITS.category),
    tagline: s(body.tagline, LIMITS.tagline),
    description: s(body.description, LIMITS.description),
    name_zh: s(body.name_zh, LIMITS.name_zh),
    category_zh: s(body.category_zh, LIMITS.category_zh),
    tagline_zh: s(body.tagline_zh, LIMITS.tagline_zh),
    description_zh: s(body.description_zh, LIMITS.description_zh),
    image_url: s(body.image_url, LIMITS.image_url),
    specs: JSON.stringify(body.specs || {}).slice(0, 200 * 1024),
    specs_zh: JSON.stringify(body.specs_zh || {}).slice(0, 200 * 1024),
    sort_order,
    is_featured: body.is_featured ? 1 : 0,
    show_in_marquee: body.show_in_marquee ? 1 : 0,
    published: body.published === 0 || body.published === false ? 0 : 1
  };
}

function validate(payload) {
  const required = ["name", "slug", "category", "tagline", "description", "image_url"];
  for (const key of required) {
    if (!payload[key]) return `${key} is required.`;
  }
  return null;
}

export async function onRequestGet({ env }) {
  if (!env.DB) return json({ error: "D1 binding DB is not configured." }, 500);
  try {
    const { results } = await env.DB.prepare(
      "SELECT * FROM products ORDER BY sort_order ASC, id DESC"
    ).all();
    return json({ products: results });
  } catch (caught) {
    console.error("Failed to fetch products:", caught);
    return json({ error: "Failed to fetch products." }, 500);
  }
}

export async function onRequestPost({ request, env }) {
  if (!env.DB) return json({ error: "D1 binding DB is not configured." }, 500);
  const error = authError(request, env);
  if (error) return json({ error }, 401);

  const body = await request.json().catch(() => null);
  if (!body) return json({ error: "Invalid JSON body." }, 400);

  const payload = productPayload(body);
  const validation = validate(payload);
  if (validation) return json({ error: validation }, 400);

  try {
    const result = await env.DB.prepare(
      `INSERT INTO products
        (name, slug, category, tagline, description, name_zh, category_zh, tagline_zh, description_zh, image_url, specs, specs_zh, sort_order, is_featured, show_in_marquee, published, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(
        payload.name,
        payload.slug,
        payload.category,
        payload.tagline,
        payload.description,
        payload.name_zh,
        payload.category_zh,
        payload.tagline_zh,
        payload.description_zh,
        payload.image_url,
        payload.specs,
        payload.specs_zh,
        payload.sort_order,
        payload.is_featured,
        payload.show_in_marquee,
        payload.published,
        new Date().toISOString()
      )
      .run();

    const created = await env.DB.prepare("SELECT * FROM products WHERE id = ?")
      .bind(result.meta.last_row_id)
      .first();
    return json({ product: created }, 201);
  } catch (caught) {
    console.error("Failed to create product:", caught);
    if (String(caught && caught.message || "").includes("UNIQUE constraint failed")) {
      return json({ error: `A product with slug "${payload.slug}" already exists.` }, 409);
    }
    return json({ error: "Failed to create product." }, 500);
  }
}
