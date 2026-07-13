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

function slugify(value) {
  const slug = String(value || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return slug || `product-${Date.now()}`;
}

function productPayload(body) {
  return {
    name: String(body.name || "").trim(),
    slug: String(body.slug || slugify(body.name)).trim(),
    category: String(body.category || "").trim(),
    tagline: String(body.tagline || "").trim(),
    description: String(body.description || "").trim(),
    name_zh: String(body.name_zh || "").trim(),
    category_zh: String(body.category_zh || "").trim(),
    tagline_zh: String(body.tagline_zh || "").trim(),
    description_zh: String(body.description_zh || "").trim(),
    image_url: String(body.image_url || "").trim(),
    specs: JSON.stringify(body.specs || {}),
    specs_zh: JSON.stringify(body.specs_zh || {}),
    sort_order: Number(body.sort_order || 0),
    is_featured: body.is_featured ? 1 : 0,
    show_in_marquee: body.show_in_marquee ? 1 : 0,
    published: body.published === 0 ? 0 : 1
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
  const { results } = await env.DB.prepare(
    "SELECT * FROM products ORDER BY sort_order ASC, id DESC"
  ).all();
  return json({ products: results });
}

export async function onRequestPost({ request, env }) {
  if (!env.DB) return json({ error: "D1 binding DB is not configured." }, 500);
  const error = authError(request, env);
  if (error) return json({ error }, error === "Unauthorized." ? 401 : 500);

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
    return json({ error: caught.message || "Failed to create product." }, 500);
  }
}
