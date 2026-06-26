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
  newsFilter: "all",
  activePanel: "products",
  dirty: {
    products: false,
    news: false
  },
  lastSavedAt: ""
};

const isStaticPreview = location.protocol === "file:" || ["5173", "5174"].includes(location.port);

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
let toastTimer = null;
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
  if (box) {
    box.textContent = message;
    box.dataset.tone = tone;
  }
  updateCommandBar(message, tone);
  notify(message, tone);
}

function statusHTML(markup, tone = "info") {
  const box = $("[data-admin-status]");
  if (box) {
    box.innerHTML = markup;
    box.dataset.tone = tone;
  }
  const text = box ? box.textContent.trim() : markup.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  updateCommandBar(text, tone);
  notify(text, tone);
}

function relativeTime(value) {
  if (!value) return "尚未保存";
  const seconds = Math.max(0, Math.round((Date.now() - new Date(value).getTime()) / 1000));
  if (seconds < 10) return "刚刚";
  if (seconds < 60) return `${seconds} 秒前`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} 分钟前`;
  return new Date(value).toLocaleString("zh-CN", { hour12: false });
}

function currentPanelLabel() {
  return state.activePanel === "news" ? "新闻中心" : "产品中心";
}

function updateCommandBar(message = "", tone = "info") {
  const bar = $("[data-admin-command]");
  if (!bar) return;
  const mode = state.apiAvailable ? "D1 数据库" : "本地预览";
  const dirty = state.dirty[state.activePanel];
  bar.dataset.tone = dirty ? "warning" : tone;
  bar.innerHTML = `
    <div class="command-copy">
      <span>${currentPanelLabel()} / ${mode}</span>
      <strong>${dirty ? "有未保存修改" : message || "准备就绪"}</strong>
    </div>
    <div class="command-meta">
      <span>${state.lastSavedAt ? `上次保存 ${relativeTime(state.lastSavedAt)}` : "等待首次保存"}</span>
      <a href="/index.html" target="_blank" rel="noopener">预览官网</a>
    </div>
  `;
}

function setDirty(panel, dirty = true) {
  state.dirty[panel] = dirty;
  updateCommandBar();
}

function markSaved() {
  state.lastSavedAt = new Date().toISOString();
  setDirty(state.activePanel, false);
}

function notify(message, tone = "info") {
  if (!message) return;
  let toast = $("[data-admin-toast]");
  if (!toast) {
    toast = document.createElement("div");
    toast.className = "admin-toast";
    toast.setAttribute("data-admin-toast", "");
    toast.setAttribute("role", "status");
    toast.setAttribute("aria-live", "polite");
    document.body.append(toast);
  }
  toast.textContent = message;
  toast.dataset.tone = tone;
  toast.classList.add("is-visible");
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => {
    toast.classList.remove("is-visible");
  }, tone === "error" ? 6800 : 4200);
}

function friendlyError(error) {
  const message = String(error?.message || error || "");
  if (message.includes("ADMIN_TOKEN is not configured")) {
    return "后台管理员 Token 还没有在 Cloudflare 配置。请先设置 ADMIN_TOKEN，或者本地开发时在 .dev.vars 里配置 ADMIN_TOKEN。";
  }
  if (message.includes("Unauthorized")) {
    return "管理员 Token 不正确，内容没有保存。请重新输入正确 Token 后再提交。";
  }
  if (message.includes("Failed to fetch")) {
    return "请求没有发出去，请检查局域网服务是否还在运行。";
  }
  return message || "操作失败，请稍后再试。";
}

function setFormBusy(form, busy, label = "Saving...") {
  const button = form?.querySelector("button[type='submit']");
  if (!button) return;
  if (!button.dataset.idleLabel) button.dataset.idleLabel = button.textContent;
  button.disabled = busy;
  button.classList.toggle("is-busy", busy);
  button.textContent = busy ? label : button.dataset.idleLabel;
}

function recordUrl(item) {
  return `/subpage.html?page=${encodeURIComponent(item.slug || item.id)}`;
}

function showSavedStatus(type, item, isUpdate, isRemote) {
  const label = type === "product" ? "产品" : "文章";
  const action = isUpdate ? "已更新" : "已创建";
  const mode = isRemote ? "已写入 Cloudflare D1 数据库" : "已保存到当前浏览器预览";
  const href = recordUrl(item);
  markSaved();
  statusHTML(
    `<strong>${label}${action}，${mode}。</strong><a href="${escapeHTML(href)}" target="_blank" rel="noopener">打开详情页</a>`,
    "success"
  );
}

function readImageAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Image read failed. Please choose the file again."));
    reader.onload = () => resolve(String(reader.result || ""));
    reader.readAsDataURL(file);
  });
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
  const draftProducts = state.products.filter((item) => !item.published).length;
  const draftNews = state.news.filter((item) => !item.published).length;
  updateNavBadges({ totalProducts, totalNews });
  root.innerHTML = [
    overviewCard("内容总量", `${totalProducts + totalNews}`, "产品与动态合计"),
    overviewCard("产品数量", `${totalProducts}`, `${featuredProducts} 个首页展示 / ${draftProducts} 个草稿`),
    overviewCard("新闻数量", `${totalNews}`, `${publishedNews} 条已发布 / ${draftNews} 个草稿`),
    overviewCard("运行模式", state.apiAvailable ? "Cloudflare D1" : "Local Preview", state.apiAvailable ? "线上数据库已连接" : "浏览器本地存储")
  ].join("");
  updateCommandBar();
}

function productItem(item) {
  const updatedLabel = new Date(item.updated_at || Date.now()).toISOString().slice(0, 10);
  const href = recordUrl(item);
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
        <a href="${escapeHTML(href)}" target="_blank" rel="noopener">预览</a>
        <button type="button" class="danger" data-delete-product="${escapeHTML(item.id)}">删除</button>
      </div>
    </div>
  `;
}

function newsItem(item) {
  const updatedLabel = new Date(item.updated_at || item.published_at || Date.now()).toISOString().slice(0, 10);
  const href = recordUrl(item);
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
        <a href="${escapeHTML(href)}" target="_blank" rel="noopener">预览</a>
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

  const readFile = async (file) => {
    if (!file) return;
    syncUploadName(fileName, `Reading: ${file.name}`);
    try {
      const dataUrl = await readImageAsDataUrl(file);
      if (urlInput) urlInput.value = dataUrl;
      applyValue(dataUrl, file.name || fallbackLabel);
      status("图片已选择，预览已更新。点击保存后才会正式写入内容。", "success");
    } catch (error) {
      applyValue("", fallbackLabel);
      status(friendlyError(error), "error");
    }
  };

  if (urlInput) {
    urlInput.addEventListener("input", () => {
      applyValue(urlInput.value.trim(), urlInput.value.trim() ? "已使用图片链接" : fallbackLabel);
      if (fileInput) fileInput.value = "";
    });
  }

  if (fileInput) {
    fileInput.addEventListener("change", async () => {
      await readFile(fileInput.files?.[0]);
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
  dropzone?.addEventListener("drop", async (event) => {
    event.preventDefault();
    dropzone.classList.remove("is-dragover");
    await readFile(event.dataTransfer?.files?.[0]);
  });
}

function setupProductEditor() {
  const form = $("[data-product-form]");
  const specRows = $("[data-product-spec-rows]");
  const specSuggestions = $("[data-product-spec-suggestions]");
  const create = $("[data-product-create]");
  if (!form || !specRows) return;

  form.noValidate = true;
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
      status("产品没有保存：请补全产品名称、分类、卖点、详细介绍和图片。", "error");
      return;
    }

    const id = form.id.value;
    const isUpdate = Boolean(id);
    let savedProduct = null;
    setFormBusy(form, true);
    status(isUpdate ? "正在保存产品修改..." : "正在创建新产品...");
    try {
      if (state.apiAvailable) {
        if (!localStorage.getItem(keys.token)) throw new Error("请先输入管理员 Token，系统还没有发出保存请求。");
        const result = await api(id ? `/api/products/${id}` : "/api/products", {
          method: id ? "PUT" : "POST",
          body: JSON.stringify(payload)
        });
        savedProduct = normalizeProduct(result.product || { ...payload, id });
        await loadContent();
      } else {
        if (id) {
          state.products = state.products.map((item) => (String(item.id) === String(id) ? { ...item, ...payload } : item));
          savedProduct = state.products.find((item) => String(item.id) === String(id));
        } else {
          savedProduct = { ...payload, id: Date.now() };
          state.products.push(savedProduct);
        }
        persistLocal();
        render();
      }
      fillProductForm(null);
      showSavedStatus("product", savedProduct || { ...payload, id }, isUpdate, state.apiAvailable);
    } catch (error) {
      status(friendlyError(error), "error");
    } finally {
      setFormBusy(form, false);
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

  form.noValidate = true;
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
      status("文章没有保存：请补全标题、分类、正文、封面图和发布日期。", "error");
      return;
    }
    if (!payload.excerpt) {
      const plain = payload.content.replace(/\s+/g, " ").trim();
      payload.excerpt = plain.length > 180 ? `${plain.slice(0, 180).replace(/\s+\S*$/, "")}...` : plain;
    }

    const id = form.id.value;
    const isUpdate = Boolean(id);
    let savedNews = null;
    setFormBusy(form, true);
    status(isUpdate ? "正在保存文章修改..." : "正在创建新文章...");
    try {
      if (state.apiAvailable) {
        if (!localStorage.getItem(keys.token)) throw new Error("请先输入管理员 Token，系统还没有发出保存请求。");
        const result = await api(id ? `/api/news/${id}` : "/api/news", {
          method: id ? "PUT" : "POST",
          body: JSON.stringify(payload)
        });
        savedNews = normalizeNews(result.news || { ...payload, id });
        await loadContent();
      } else {
        if (id) {
          state.news = state.news.map((item) => (String(item.id) === String(id) ? { ...item, ...payload } : item));
          savedNews = state.news.find((item) => String(item.id) === String(id));
        } else {
          savedNews = { ...payload, id: Date.now() };
          state.news.push(savedNews);
        }
        persistLocal();
        render();
      }
      fillNewsForm(null);
      showSavedStatus("news", savedNews || { ...payload, id }, isUpdate, state.apiAvailable);
    } catch (error) {
      status(friendlyError(error), "error");
    } finally {
      setFormBusy(form, false);
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
      status(friendlyError(error), "error");
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
      status(friendlyError(error), "error");
    }
  })();
}

function setupProChrome() {
  document.body.classList.add("admin-pro");
  const main = $(".admin-main");
  if (main && !$("[data-admin-command]")) {
    const command = document.createElement("section");
    command.className = "admin-command";
    command.setAttribute("data-admin-command", "");
    main.insertBefore(command, main.firstElementChild?.nextSibling || main.firstChild);
  }
  updateCommandBar("准备就绪");
}

function updateNavBadges({ totalProducts, totalNews }) {
  const productTab = $("[data-admin-tab='products']");
  const newsTab = $("[data-admin-tab='news']");
  if (productTab) productTab.innerHTML = `<span>产品发布台</span><b>${totalProducts}</b>`;
  if (newsTab) newsTab.innerHTML = `<span>新闻发布台</span><b>${totalNews}</b>`;
}

function setupFormIntelligence() {
  const configs = [
    { panel: "products", formSelector: "[data-product-form]" },
    { panel: "news", formSelector: "[data-news-form]" }
  ];

  configs.forEach(({ panel, formSelector }) => {
    const form = $(formSelector);
    if (!form) return;
    form.addEventListener("input", (event) => {
      if (event.target.matches("[data-token-input]")) return;
      setDirty(panel, true);
    });
    form.addEventListener("change", () => setDirty(panel, true));

    $$("textarea", form).forEach((textarea) => {
      const counter = document.createElement("small");
      counter.className = "field-counter";
      textarea.insertAdjacentElement("afterend", counter);
      const update = () => {
        const length = textarea.value.trim().length;
        counter.textContent = length ? `${length} 字` : "等待输入";
      };
      textarea.addEventListener("input", update);
      update();
    });
  });

  window.addEventListener("beforeunload", (event) => {
    if (!state.dirty.products && !state.dirty.news) return;
    event.preventDefault();
    event.returnValue = "";
  });
}

function setupTabs() {
  $$("[data-admin-tab]").forEach((button) => {
    button.addEventListener("click", () => {
      state.activePanel = button.dataset.adminTab;
      $$("[data-admin-tab]").forEach((item) => item.classList.toggle("active", item === button));
      $$(".admin-panel").forEach((panel) => panel.classList.toggle("active", panel.dataset.panel === button.dataset.adminTab));
      updateCommandBar();
    });
  });
}

function setupToken() {
  const input = $("[data-token-input]");
  if (!input) return;
  let tokenStatus = $("[data-token-status]");
  if (!tokenStatus) {
    tokenStatus = document.createElement("p");
    tokenStatus.className = "token-status";
    tokenStatus.setAttribute("data-token-status", "");
    input.closest(".token-panel")?.append(tokenStatus);
  }
  let tokenTimer = null;
  const setTokenStatus = (message, tone = "info", shouldNotify = false) => {
    tokenStatus.textContent = message;
    tokenStatus.dataset.tone = tone;
    if (shouldNotify) notify(message, tone);
  };
  input.value = localStorage.getItem(keys.token) || "";
  setTokenStatus(input.value ? "管理员 Token 已保存在当前浏览器。" : "尚未填写管理员 Token，提交到 D1 时会被拦截。", input.value ? "success" : "error");
  input.addEventListener("input", () => {
    const value = input.value.trim();
    localStorage.setItem(keys.token, value);
    window.clearTimeout(tokenTimer);
    setTokenStatus(value ? "正在保存管理员 Token..." : "管理员 Token 已清空，提交会失败。", value ? "info" : "error");
    tokenTimer = window.setTimeout(() => {
      setTokenStatus(value ? "管理员 Token 已保存到当前浏览器。" : "管理员 Token 已清空，提交会失败。", value ? "success" : "error", true);
    }, 450);
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

setupProChrome();
setupTabs();
setupToken();
setupProductEditor();
setupNewsEditor();
setupFormIntelligence();
setupSearch();
setupFilters();
setupListActions();
initDefaults();
loadContent();
