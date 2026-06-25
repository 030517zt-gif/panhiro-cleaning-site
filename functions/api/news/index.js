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
  return slug || `news-${Date.now()}`;
}

function newsPayload(body) {
  return {
    title: String(body.title || "").trim(),
    slug: String(body.slug || slugify(body.title)).trim(),
    category: String(body.category || "").trim(),
    excerpt: String(body.excerpt || "").trim(),
    content: String(body.content || "").trim(),
    image_url: String(body.image_url || "").trim(),
    published_at: String(body.published_at || new Date().toISOString().slice(0, 10)).trim(),
    published: body.published === 0 ? 0 : 1
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
  const { results } = await env.DB.prepare(
    "SELECT * FROM news_posts ORDER BY published_at DESC, id DESC"
  ).all();
  return json({ news: results });
}

export async function onRequestPost({ request, env }) {
  if (!env.DB) return json({ error: "D1 binding DB is not configured." }, 500);
  const error = authError(request, env);
  if (error) return json({ error }, error === "Unauthorized." ? 401 : 500);

  const body = await request.json().catch(() => null);
  if (!body) return json({ error: "Invalid JSON body." }, 400);

  const payload = newsPayload(body);
  const validation = validate(payload);
  if (validation) return json({ error: validation }, 400);

  try {
    const result = await env.DB.prepare(
      `INSERT INTO news_posts
        (title, slug, category, excerpt, content, image_url, published_at, published, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(
        payload.title,
        payload.slug,
        payload.category,
        payload.excerpt,
        payload.content,
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
    return json({ error: caught.message || "Failed to create news post." }, 500);
  }
}
