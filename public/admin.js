import { DEFAULT_NEWS, DEFAULT_PRODUCTS, PRODUCT_CATEGORIES } from "./content-seed.js";

const keys = {
  products: "panhiro.cnryce.products.v2",
  news: "panhiro.cnryce.news.v2",
  token: "panhiro.admin.token"
};

const state = {
  apiAvailable: false,
  products: [],
  news: [],
  productQuery: "",
  newsQuery: "",
  productFilter: "all",
  newsFilter: "all"
};

const isStaticPreview = location.protocol === "file:" || ["5173", "5174"].includes(location.port);

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
const PRODUCT_SPEC_TEMPLATES = {
  "Washing Machine": ["Model", "Power", "Pressure", "Flow", "Voltage", "Application"],
  "car washing series": ["Model", "Power", "Pressure", "Flow", "Hose Length", "Application"],
  "Car Washing T Series": ["Model", "Power", "Pressure", "Flow", "Portable Type", "Application"],
  "Industrial Series": ["Model", "Power", "Pressure", "Flow", "Pump", "Duty"],
  "Permanent Magnet Series": ["Model", "Power", "Pressure", "Flow", "Motor", "Application"],
  "Vacuum Cleaner": ["Model", "Power", "Capacity", "Voltage", "Application"],
  "Washer Plunger Pumps": ["Model", "Pump Head", "Pressure", "Flow", "Material"],
  "Washer Pressure Pipe": ["Model", "Length", "Pressure", "Material", "Connector"],
  "Spray Gun For Cleaning": ["Model", "Type", "Pressure", "Material", "Connector"],
  "Foam Gun": ["Model", "Bottle Capacity", "Pressure", "Material", "Connector"],
  "Washer Adapter": ["Model", "Thread", "Connector", "Material", "Application"]
};

function escapeHTML(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function slugify(value, fallbackPrefix = "item") {
  const slug = String(value || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return slug || `${fallbackPrefix}-${Date.now()}`;
}

function parseSpecs(value) {
  if (!value) return {};
  if (typeof value === "object") return value;
  try {
    return JSON.parse(value);
  } catch {
    return {};
  }
}

function readLocal(key, fallback) {
  const raw = localStorage.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function persistLocal() {
  localStorage.setItem(keys.products, JSON.stringify(state.products));
  localStorage.setItem(keys.news, JSON.stringify(state.news));
}

function normalizeProduct(item) {
  return {
    ...item,
    specs: parseSpecs(item.specs || {}),
    sort_order: Number(item.sort_order || 0),
    is_featured: Number(item.is_featured || 0),
    published: Number(item.published ?? 1),
    updated_at: item.updated_at || new Date().toISOString()
  };
}

function normalizeNews(item) {
  return {
    ...item,
    published: Number(item.published ?? 1),
    updated_at: item.updated_at || item.published_at || new Date().toISOString()
  };
}

function sortDate(value) {
  return new Date(value || 0).getTime() || 0;
}

function matchesQuery(value, query) {
  if (!query) return true;
  return String(value).toLowerCase().includes(query.toLowerCase());
}

function status(message, tone = "info") {
  const box = $("[data-admin-status]");
  if (!box) return;
  box.textContent = message;
  box.dataset.tone = tone;
}

async function api(path, options = {}) {
  const token = localStorage.getItem(keys.token) || "";
  const headers = new Headers(options.headers || {});
  headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const response = await fetch(path, { ...options, headers, cache: "no-store" });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }
  return response.json();
}

function render() {
  renderOverview();
  renderProducts();
  renderNews();
}

async function loadContent() {
  if (isStaticPreview) {
    state.products = readLocal(keys.products, DEFAULT_PRODUCTS).map(normalizeProduct);
    state.news = readLocal(keys.news, DEFAULT_NEWS).map(normalizeNews);
    state.apiAvailable = false;
    status("当前是本地静态预览模式。保存会写入浏览器 localStorage，部署后会写入 Cloudflare D1。");
    render();
    return;
  }

  try {
    const [products, news] = await Promise.all([api("/api/products"), api("/api/news")]);
    state.products = products.products.map(normalizeProduct);
    state.news = news.news.map(normalizeNews);
    state.apiAvailable = true;
    status("已连接 Cloudflare Functions。保存会写入 D1 数据库。");
  } catch {
    state.products = readLocal(keys.products, DEFAULT_PRODUCTS).map(normalizeProduct);
    state.news = readLocal(keys.news, DEFAULT_NEWS).map(normalizeNews);
    state.apiAvailable = false;
    status("当前是本地静态预览模式。保存会写入浏览器 localStorage，部署后会写入 Cloudflare D1。");
  }
  render();
}

function overviewCard(label, value, note) {
  return `
    <article class="overview-card">
      <span>${escapeHTML(label)}</span>
      <strong>${escapeHTML(value)}</strong>
      <p>${escapeHTML(note)}</p>
    </article>
  `;
}

function renderOverview() {
  const root = $("[data-admin-overview]");
  if (!root) return;
  const totalProducts = state.products.length;
  const featuredProducts = state.products.filter((item) => item.is_featured).length;
  const totalNews = state.news.length;
  const publishedNews = state.news.filter((item) => item.published).length;
  root.innerHTML = [
    overviewCard("内容总量", `${totalProducts + totalNews}`, "产品与动态合计"),
    overviewCard("产品数量", `${totalProducts}`, `${featuredProducts} 个首页展示`),
    overviewCard("新闻数量", `${totalNews}`, `${publishedNews} 条已发布`),
    overviewCard("运行模式", state.apiAvailable ? "Cloudflare D1" : "Local Preview", state.apiAvailable ? "线上数据库" : "浏览器本地存储")
  ].join("");
}

function productItem(item) {
  const updatedLabel = new Date(item.updated_at || Date.now()).toISOString().slice(0, 10);
  return `
    <div class="admin-item" data-record-id="${escapeHTML(item.id)}">
      <img src="${escapeHTML(item.image_url)}" alt="${escapeHTML(item.name)}" />
      <div class="admin-item-copy">
        <div class="admin-item-meta">
          <span>${escapeHTML(item.category)}</span>
          <span>#${escapeHTML(item.sort_order)}</span>
          <span>${item.is_featured ? "首页重点" : "常规展示"}</span>
          <span>${item.published ? "已发布" : "草稿"}</span>
          <span>更新 ${escapeHTML(updatedLabel)}</span>
        </div>
        <h3>${escapeHTML(item.name)}</h3>
        <p>${escapeHTML(item.tagline || item.description || "")}</p>
      </div>
      <div class="admin-actions">
        <button type="button" data-edit-product="${escapeHTML(item.id)}">继续编辑</button>
        <button type="button" class="danger" data-delete-product="${escapeHTML(item.id)}">删除</button>
      </div>
    </div>
  `;
}

function newsItem(item) {
  const updatedLabel = new Date(item.updated_at || item.published_at || Date.now()).toISOString().slice(0, 10);
  return `
    <div class="admin-item" data-record-id="${escapeHTML(item.id)}">
      <img src="${escapeHTML(item.image_url)}" alt="${escapeHTML(item.title)}" />
      <div class="admin-item-copy">
        <div class="admin-item-meta">
          <span>${escapeHTML(item.category)}</span>
          <span>${escapeHTML(item.published_at)}</span>
          <span>${item.published ? "已发布" : "草稿"}</span>
          <span>更新 ${escapeHTML(updatedLabel)}</span>
        </div>
        <h3>${escapeHTML(item.title)}</h3>
        <p>${escapeHTML(item.excerpt || item.content || "")}</p>
      </div>
      <div class="admin-actions">
        <button type="button" data-edit-news="${escapeHTML(item.id)}">继续编辑</button>
        <button type="button" class="danger" data-delete-news="${escapeHTML(item.id)}">删除</button>
      </div>
    </div>
  `;
}

function renderProducts() {
  const list = $("[data-product-admin-list]");
  const count = $("[data-product-count]");
  if (!list) return;
  const query = state.productQuery.trim();
  const filtered = state.products
    .filter((item) =>
      [item.name, item.category, item.tagline, item.description, JSON.stringify(item.specs || {})]
        .some((value) => matchesQuery(value, query))
    )
    .filter((item) => {
      if (state.productFilter === "published") return item.published;
      if (state.productFilter === "draft") return !item.published;
      if (state.productFilter === "featured") return item.is_featured;
      return true;
    });
  if (count) {
    count.textContent = `${filtered.length} / ${state.products.length}`;
  }
  list.innerHTML = filtered.length
    ? filtered
        .slice()
        .sort((a, b) => sortDate(b.updated_at) - sortDate(a.updated_at) || a.sort_order - b.sort_order)
        .map(productItem)
        .join("")
    : `<div class="admin-empty">没有匹配的产品，换个关键词试试。</div>`;
}

function renderNews() {
  const list = $("[data-news-admin-list]");
  const count = $("[data-news-count]");
  if (!list) return;
  const query = state.newsQuery.trim();
  const filtered = state.news
    .filter((item) =>
      [item.title, item.category, item.excerpt, item.content, item.published_at]
        .some((value) => matchesQuery(value, query))
    )
    .filter((item) => {
      if (state.newsFilter === "published") return item.published;
      if (state.newsFilter === "draft") return !item.published;
      return true;
    });
  if (count) {
    count.textContent = `${filtered.length} / ${state.news.length}`;
  }
  list.innerHTML = filtered.length
    ? filtered
        .slice()
        .sort((a, b) => sortDate(b.updated_at || b.published_at) - sortDate(a.updated_at || a.published_at))
        .map(newsItem)
        .join("")
    : `<div class="admin-empty">没有匹配的动态，换个关键词试试。</div>`;
}

function setImagePreview(img, src, alt) {
  if (!img) return;
  if (!src) {
    img.removeAttribute("src");
    img.alt = alt || "";
    img.closest(".image-preview-frame")?.classList.add("is-empty");
    return;
  }
  img.src = src;
  img.alt = alt || "";
  img.closest(".image-preview-frame")?.classList.remove("is-empty");
}

function readSpecRows(container) {
  const rows = $$(".spec-row", container);
  const specs = {};
  rows.forEach((row) => {
    const key = $(".spec-key", row)?.value.trim();
    const value = $(".spec-value", row)?.value.trim();
    if (!key || !value) return;
    specs[key] = value;
  });
  return specs;
}

function specRowMarkup(key = "", value = "") {
  return `
    <div class="spec-row">
      <input class="spec-key" type="text" placeholder="词条名，例如：Power" value="${escapeHTML(key)}" />
      <input class="spec-value" type="text" placeholder="词条值，例如：2200W" value="${escapeHTML(value)}" />
      <button type="button" class="spec-remove" aria-label="删除词条">×</button>
    </div>
  `;
}

function renderSpecRows(container, specs = {}) {
  if (!container) return;
  const entries = Object.entries(specs);
  const rows = entries.length ? entries : [["", ""], ["", ""], ["", ""]];
  container.innerHTML = rows.map(([key, value]) => specRowMarkup(key, value)).join("");
}

function renderSpecSuggestions(container, category, specs = {}) {
  if (!container) return;
  const template = PRODUCT_SPEC_TEMPLATES[category] || ["Model", "Power", "Pressure", "Flow"];
  const currentKeys = new Set(Object.keys(specs));
  container.innerHTML = template
    .map(
      (label) => `
        <button
          type="button"
          class="suggestion-chip ${currentKeys.has(label) ? "is-used" : ""}"
          data-spec-suggestion="${escapeHTML(label)}"
        >
          ${escapeHTML(label)}
        </button>
      `
    )
    .join("");
}

function syncUploadName(target, value) {
  if (!target) return;
  target.textContent = value || "还没有选择文件";
}

function fillProductForm(item) {
  const form = $("[data-product-form]");
  const title = $("[data-product-form-title]");
  const subtitle = $("[data-product-form-subtitle]");
  const urlInput = $("[data-product-image-url]");
  const preview = $("[data-product-image-preview]");
  const specRows = $("[data-product-spec-rows]");
  const specSuggestions = $("[data-product-spec-suggestions]");
  const imageName = $("[data-product-image-name]");
  if (!form) return;

  form.id.value = item?.id || "";
  form.name.value = item?.name || "";
  form.slug.value = item?.slug || "";
  form.category.value = item?.category || "";
  form.tagline.value = item?.tagline || "";
  form.description.value = item?.description || "";
  form.sort_order.value = item?.sort_order ?? 0;
  form.is_featured.checked = Boolean(item?.is_featured);
  form.published.checked = item ? Boolean(item.published) : true;

  if (urlInput) urlInput.value = item?.image_url || "";
  form.image_url.value = item?.image_url || "";
  setImagePreview(preview, item?.image_url || "", item?.name || "产品图片预览");
  renderSpecRows(specRows, item?.specs || {});
  renderSpecSuggestions(specSuggestions, item?.category || form.category.value || "Washing Machine", item?.specs || {});
  syncUploadName(imageName, item?.image_url ? "已载入当前图片" : "");

  if (title) title.textContent = item ? "编辑产品" : "新建产品";
  if (subtitle) {
    subtitle.textContent = item
      ? "调整分类、图片、词条和发布状态后直接保存，系统会保留现有页面链接。"
      : "填写产品名称、分类、图片、规格词条和展示状态，系统会自动生成页面地址。";
  }
  form.scrollIntoView({ behavior: "smooth", block: "start" });
}

function fillNewsForm(item) {
  const form = $("[data-news-form]");
  const title = $("[data-news-form-title]");
  const subtitle = $("[data-news-form-subtitle]");
  const urlInput = $("[data-news-image-url]");
  const preview = $("[data-news-image-preview]");
  const imageName = $("[data-news-image-name]");
  if (!form) return;

  form.id.value = item?.id || "";
  form.title.value = item?.title || "";
  form.slug.value = item?.slug || "";
  form.category.value = item?.category || "";
  form.published_at.value = item?.published_at || new Date().toISOString().slice(0, 10);
  form.excerpt.value = item?.excerpt || "";
  form.content.value = item?.content || "";
  form.published.checked = item ? Boolean(item.published) : true;

  if (urlInput) urlInput.value = item?.image_url || "";
  form.image_url.value = item?.image_url || "";
  setImagePreview(preview, item?.image_url || "", item?.title || "文章封面预览");
  syncUploadName(imageName, item?.image_url ? "已载入当前封面" : "");

  if (title) title.textContent = item ? "编辑文章" : "新建文章";
  if (subtitle) {
    subtitle.textContent = item
      ? "修改标题、摘要、正文、封面和分类后保存，文章会自动生成独立页面。"
      : "标题、分类、封面、摘要、正文都用自然语言填写，系统自动整理成文章页。";
  }
  form.scrollIntoView({ behavior: "smooth", block: "start" });
}

function attachAutoSlug(form, inputSelector, slugSelector) {
  const source = $(inputSelector, form);
  const slug = $(slugSelector, form);
  if (!source || !slug) return;
  source.addEventListener("input", () => {
    if (slug.value.trim()) return;
    slug.value = slugify(source.value, form.dataset.slugPrefix || "item");
  });
}

function syncImageInput(form, options) {
  const {
    fileSelector,
    urlSelector,
    hiddenSelector,
    previewSelector,
    fallbackLabel,
    pickSelector,
    clearSelector,
    dropzoneSelector,
    fileNameSelector
  } = options;
  const fileInput = $(fileSelector, form);
  const urlInput = $(urlSelector, form);
  const hidden = $(hiddenSelector, form);
  const preview = $(previewSelector, form);
  const picker = $(pickSelector, form);
  const clear = $(clearSelector, form);
  const dropzone = $(dropzoneSelector, form);
  const fileName = $(fileNameSelector, form);
  if (!hidden || !preview) return;

  const applyValue = (value, label = fallbackLabel) => {
    hidden.value = value || "";
    setImagePreview(preview, value, label);
    syncUploadName(fileName, value ? label : "");
  };

  const readFile = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result || "");
      if (urlInput) urlInput.value = dataUrl;
      applyValue(dataUrl, file.name || fallbackLabel);
    };
    reader.readAsDataURL(file);
  };

  if (urlInput) {
    urlInput.addEventListener("input", () => {
      applyValue(urlInput.value.trim(), urlInput.value.trim() ? "已使用图片链接" : fallbackLabel);
      if (fileInput) fileInput.value = "";
    });
  }

  if (fileInput) {
    fileInput.addEventListener("change", () => {
      readFile(fileInput.files?.[0]);
    });
  }

  picker?.addEventListener("click", () => fileInput?.click());
  clear?.addEventListener("click", () => {
    if (fileInput) fileInput.value = "";
    if (urlInput) urlInput.value = "";
    applyValue("", fallbackLabel);
  });

  dropzone?.addEventListener("dragover", (event) => {
    event.preventDefault();
    dropzone.classList.add("is-dragover");
  });
  dropzone?.addEventListener("dragleave", () => {
    dropzone.classList.remove("is-dragover");
  });
  dropzone?.addEventListener("drop", (event) => {
    event.preventDefault();
    dropzone.classList.remove("is-dragover");
    readFile(event.dataTransfer?.files?.[0]);
  });
}

function setupProductEditor() {
  const form = $("[data-product-form]");
  const specRows = $("[data-product-spec-rows]");
  const specSuggestions = $("[data-product-spec-suggestions]");
  const create = $("[data-product-create]");
  if (!form || !specRows) return;

  form.dataset.slugPrefix = "product";
  renderSpecRows(specRows, {});
  attachAutoSlug(form, "[name='name']", "[name='slug']");
  syncImageInput(form, {
    fileSelector: "[data-product-image-file]",
    urlSelector: "[data-product-image-url]",
    hiddenSelector: "[name='image_url']",
    previewSelector: "[data-product-image-preview]",
    fallbackLabel: "产品图片",
    pickSelector: "[data-product-image-pick]",
    clearSelector: "[data-product-image-clear]",
    dropzoneSelector: "[data-product-dropzone]",
    fileNameSelector: "[data-product-image-name]"
  });
  renderSpecSuggestions(specSuggestions, form.category.value || "Washing Machine");

  const addSpec = $("[data-product-add-spec]");
  addSpec?.addEventListener("click", () => {
    specRows.insertAdjacentHTML("beforeend", specRowMarkup());
  });

  specRows.addEventListener("click", (event) => {
    const remove = event.target.closest(".spec-remove");
    if (!remove) return;
    remove.closest(".spec-row")?.remove();
    renderSpecSuggestions(specSuggestions, form.category.value || "Washing Machine", readSpecRows(specRows));
  });
  specRows.addEventListener("input", () => {
    renderSpecSuggestions(specSuggestions, form.category.value || "Washing Machine", readSpecRows(specRows));
  });

  specSuggestions?.addEventListener("click", (event) => {
    const chip = event.target.closest("[data-spec-suggestion]");
    if (!chip) return;
    const key = chip.dataset.specSuggestion;
    const existing = readSpecRows(specRows);
    if (existing[key]) return;
    specRows.insertAdjacentHTML("beforeend", specRowMarkup(key, ""));
    renderSpecSuggestions(specSuggestions, form.category.value || "Washing Machine", readSpecRows(specRows));
  });

  form.category.addEventListener("input", () => {
    renderSpecSuggestions(specSuggestions, form.category.value || "Washing Machine", readSpecRows(specRows));
  });

  create?.addEventListener("click", () => fillProductForm(null));

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const payload = {
      name: form.name.value.trim(),
      slug: form.slug.value.trim() || slugify(form.name.value, "product"),
      category: form.category.value.trim(),
      tagline: form.tagline.value.trim(),
      description: form.description.value.trim(),
      image_url: form.image_url.value.trim() || $("[data-product-image-url]", form)?.value.trim(),
      specs: readSpecRows(specRows),
      sort_order: Number(form.sort_order.value || 0),
      is_featured: form.is_featured.checked ? 1 : 0,
      published: form.published.checked ? 1 : 0,
      updated_at: new Date().toISOString()
    };

    if (!payload.name || !payload.slug || !payload.category || !payload.tagline || !payload.description || !payload.image_url) {
      status("请先把产品名称、分类、卖点、描述和图片补完整。", "error");
      return;
    }

    const id = form.id.value;
    try {
      if (state.apiAvailable) {
        if (!localStorage.getItem(keys.token)) throw new Error("请先填写管理员 Token。");
        await api(id ? `/api/products/${id}` : "/api/products", {
          method: id ? "PUT" : "POST",
          body: JSON.stringify(payload)
        });
        await loadContent();
      } else {
        if (id) {
          state.products = state.products.map((item) => (String(item.id) === String(id) ? { ...item, ...payload } : item));
        } else {
          state.products.push({ ...payload, id: Date.now() });
        }
        persistLocal();
        render();
      }
      fillProductForm(null);
      status("产品已保存。");
    } catch (error) {
      status(error.message, "error");
    }
  });

  $("[data-product-reset]")?.addEventListener("click", () => {
    setTimeout(() => fillProductForm(null));
  });
}

function setupNewsEditor() {
  const form = $("[data-news-form]");
  const create = $("[data-news-create]");
  if (!form) return;

  form.dataset.slugPrefix = "news";
  attachAutoSlug(form, "[name='title']", "[name='slug']");
  syncImageInput(form, {
    fileSelector: "[data-news-image-file]",
    urlSelector: "[data-news-image-url]",
    hiddenSelector: "[name='image_url']",
    previewSelector: "[data-news-image-preview]",
    fallbackLabel: "文章封面",
    pickSelector: "[data-news-image-pick]",
    clearSelector: "[data-news-image-clear]",
    dropzoneSelector: "[data-news-dropzone]",
    fileNameSelector: "[data-news-image-name]"
  });

  create?.addEventListener("click", () => fillNewsForm(null));

  $("[data-generate-excerpt]")?.addEventListener("click", () => {
    const content = form.content.value.trim();
    if (!content) return;
    const paragraphs = content
      .split(/\n+/)
      .map((part) => part.trim())
      .filter(Boolean);
    const source = paragraphs.join(" ");
    form.excerpt.value = source.length > 180 ? `${source.slice(0, 180).replace(/\s+\S*$/, "")}...` : source;
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const payload = {
      title: form.title.value.trim(),
      slug: form.slug.value.trim() || slugify(form.title.value, "news"),
      category: form.category.value.trim(),
      excerpt: form.excerpt.value.trim(),
      content: form.content.value.trim(),
      image_url: form.image_url.value.trim() || $("[data-news-image-url]", form)?.value.trim(),
      published_at: form.published_at.value,
      published: form.published.checked ? 1 : 0,
      updated_at: new Date().toISOString()
    };

    if (!payload.title || !payload.slug || !payload.category || !payload.content || !payload.image_url || !payload.published_at) {
      status("请先把标题、分类、正文、封面和日期补完整。", "error");
      return;
    }
    if (!payload.excerpt) {
      const plain = payload.content.replace(/\s+/g, " ").trim();
      payload.excerpt = plain.length > 180 ? `${plain.slice(0, 180).replace(/\s+\S*$/, "")}...` : plain;
    }

    const id = form.id.value;
    try {
      if (state.apiAvailable) {
        if (!localStorage.getItem(keys.token)) throw new Error("请先填写管理员 Token。");
        await api(id ? `/api/news/${id}` : "/api/news", {
          method: id ? "PUT" : "POST",
          body: JSON.stringify(payload)
        });
        await loadContent();
      } else {
        if (id) {
          state.news = state.news.map((item) => (String(item.id) === String(id) ? { ...item, ...payload } : item));
        } else {
          state.news.push({ ...payload, id: Date.now() });
        }
        persistLocal();
        render();
      }
      fillNewsForm(null);
      status("文章已保存。");
    } catch (error) {
      status(error.message, "error");
    }
  });

  $("[data-news-reset]")?.addEventListener("click", () => {
    setTimeout(() => fillNewsForm(null));
  });
}

function deleteProduct(id) {
  if (!confirm("确定删除这个产品吗？")) return;
  (async () => {
    try {
      if (state.apiAvailable) {
        if (!localStorage.getItem(keys.token)) throw new Error("请先填写管理员 Token。");
        await api(`/api/products/${id}`, { method: "DELETE" });
        await loadContent();
      } else {
        state.products = state.products.filter((item) => String(item.id) !== String(id));
        persistLocal();
        render();
      }
      status("产品已删除。");
    } catch (error) {
      status(error.message, "error");
    }
  })();
}

function deleteNews(id) {
  if (!confirm("确定删除这条文章吗？")) return;
  (async () => {
    try {
      if (state.apiAvailable) {
        if (!localStorage.getItem(keys.token)) throw new Error("请先填写管理员 Token。");
        await api(`/api/news/${id}`, { method: "DELETE" });
        await loadContent();
      } else {
        state.news = state.news.filter((item) => String(item.id) !== String(id));
        persistLocal();
        render();
      }
      status("文章已删除。");
    } catch (error) {
      status(error.message, "error");
    }
  })();
}

function setupTabs() {
  $$("[data-admin-tab]").forEach((button) => {
    button.addEventListener("click", () => {
      $$("[data-admin-tab]").forEach((item) => item.classList.toggle("active", item === button));
      $$(".admin-panel").forEach((panel) => panel.classList.toggle("active", panel.dataset.panel === button.dataset.adminTab));
    });
  });
}

function setupToken() {
  const input = $("[data-token-input]");
  if (!input) return;
  input.value = localStorage.getItem(keys.token) || "";
  input.addEventListener("input", () => {
    localStorage.setItem(keys.token, input.value.trim());
  });
}

function setupSearch() {
  $("[data-product-search]")?.addEventListener("input", (event) => {
    state.productQuery = event.currentTarget.value;
    renderProducts();
  });
  $("[data-news-search]")?.addEventListener("input", (event) => {
    state.newsQuery = event.currentTarget.value;
    renderNews();
  });
}

function setupFilters() {
  $("[data-product-filters]")?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-product-filter]");
    if (!button) return;
    state.productFilter = button.dataset.productFilter;
    $$("[data-product-filter]").forEach((item) => item.classList.toggle("active", item === button));
    renderProducts();
  });

  $("[data-news-filters]")?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-news-filter]");
    if (!button) return;
    state.newsFilter = button.dataset.newsFilter;
    $$("[data-news-filter]").forEach((item) => item.classList.toggle("active", item === button));
    renderNews();
  });
}

function setupListActions() {
  document.addEventListener("click", (event) => {
    const editProduct = event.target.closest("[data-edit-product]");
    const deleteProductButton = event.target.closest("[data-delete-product]");
    const editNews = event.target.closest("[data-edit-news]");
    const deleteNewsButton = event.target.closest("[data-delete-news]");

    if (editProduct) {
      const item = state.products.find((product) => String(product.id) === String(editProduct.dataset.editProduct));
      if (item) fillProductForm(item);
    }
    if (deleteProductButton) deleteProduct(deleteProductButton.dataset.deleteProduct);
    if (editNews) {
      const item = state.news.find((post) => String(post.id) === String(editNews.dataset.editNews));
      if (item) fillNewsForm(item);
    }
    if (deleteNewsButton) deleteNews(deleteNewsButton.dataset.deleteNews);
  });
}

function initDefaults() {
  const newsForm = $("[data-news-form]");
  if (newsForm && !newsForm.published_at.value) {
    newsForm.published_at.value = new Date().toISOString().slice(0, 10);
  }
  fillProductForm(null);
  fillNewsForm(null);
}

setupTabs();
setupToken();
setupProductEditor();
setupNewsEditor();
setupSearch();
setupFilters();
setupListActions();
initDefaults();
loadContent();
