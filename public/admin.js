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
  inquiries: [],
  inquiriesLoaded: false,
  productQuery: "",
  newsQuery: "",
  inquiryQuery: "",
  productFilter: "all",
  newsFilter: "all",
  inquiryFilter: "all",
  productPage: 1,
  newsPage: 1,
  pageSize: 12,
  productView: "library",
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
    specs_zh: parseSpecs(item.specs_zh || {}),
    sort_order: Number(item.sort_order || 0),
    is_featured: Number(item.is_featured || 0),
    show_in_marquee: Number(item.show_in_marquee ?? 0),
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
  if (state.activePanel === "news") return "新闻中心";
  if (state.activePanel === "inquiries") return "客户询盘";
  return "产品中心";
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
  const mobileTitle = $("[data-mobile-panel-title]");
  const mobileState = $("[data-mobile-save-state]");
  if (mobileTitle) mobileTitle.textContent = currentPanelLabel();
  if (mobileState) mobileState.textContent = dirty ? "有未保存修改" : message || "准备就绪";
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
  renderHomepageControls();
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
  const marqueeProducts = state.products.filter((item) => item.show_in_marquee).length;
  const totalNews = state.news.length;
  const publishedNews = state.news.filter((item) => item.published).length;
  const draftProducts = state.products.filter((item) => !item.published).length;
  const draftNews = state.news.filter((item) => !item.published).length;
  updateNavBadges({ totalProducts, totalNews });
  root.innerHTML = [
    overviewCard("内容总量", `${totalProducts + totalNews}`, "产品与动态合计"),
    overviewCard("产品数量", `${totalProducts}`, `${featuredProducts} 个首页产品卡候选，前 4 个展示 / ${marqueeProducts} 个滚动产品 / ${draftProducts} 个草稿`),
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
          <span>${item.is_featured ? "首页产品卡" : "常规展示"}</span>
          ${item.show_in_marquee ? "<span>首页滚动</span>" : ""}
          <span>${item.published ? "已发布" : "草稿"}</span>
          <span>更新 ${escapeHTML(updatedLabel)}</span>
        </div>
        <h3>${escapeHTML(item.name)}</h3>
        <p>${escapeHTML(item.tagline || item.description || "")}</p>
      </div>
      <div class="admin-actions">
        <button type="button" data-edit-product="${escapeHTML(item.id)}">编辑</button>
        <a href="${escapeHTML(href)}" target="_blank" rel="noopener">预览</a>
        <details class="record-menu">
          <summary aria-label="更多产品操作">更多</summary>
          <div>
            <button type="button" data-toggle-featured-product="${escapeHTML(item.id)}">${item.is_featured ? "移出首页卡" : "加入首页卡"}</button>
            <button type="button" data-toggle-marquee-product="${escapeHTML(item.id)}">${item.show_in_marquee ? "移出滚动" : "加入滚动"}</button>
            <button type="button" class="danger" data-delete-product="${escapeHTML(item.id)}">删除产品</button>
          </div>
        </details>
      </div>
    </div>
  `;
}

function sortForHomepage(items) {
  return items.slice().sort((a, b) => a.sort_order - b.sort_order || sortDate(b.updated_at) - sortDate(a.updated_at));
}

function homepagePickMarkup(item, type) {
  const toggleAttr = type === "featured" ? "data-toggle-featured-product" : "data-toggle-marquee-product";
  const toggleLabel = type === "featured" ? "移出首页卡" : "移出滚动";
  return `
    <div class="homepage-pick-card">
      <img src="${escapeHTML(item.image_url)}" alt="${escapeHTML(item.name)}" />
      <div>
        <span>#${escapeHTML(item.sort_order)} / ${escapeHTML(item.category)}</span>
        <strong>${escapeHTML(item.name_zh || item.name)}</strong>
      </div>
      <button type="button" ${toggleAttr}="${escapeHTML(item.id)}">${toggleLabel}</button>
    </div>
  `;
}

function renderHomepageControls() {
  const featuredRoot = $("[data-home-featured-preview]");
  const marqueeRoot = $("[data-home-marquee-preview]");
  if (!featuredRoot && !marqueeRoot) return;

  const featured = sortForHomepage(state.products.filter((item) => item.published && item.is_featured));
  const marquee = sortForHomepage(state.products.filter((item) => item.published && item.show_in_marquee));
  const visibleFeatured = featured.slice(0, 4);
  const visibleMarquee = marquee.slice(0, 10);

  if (featuredRoot) {
    featuredRoot.innerHTML = visibleFeatured.length
      ? `${visibleFeatured.map((item) => homepagePickMarkup(item, "featured")).join("")}${featured.length > 4 ? `<p class="homepage-pick-note">还有 ${featured.length - 4} 个已勾选，但首页 All 只显示排序前 4 个。</p>` : ""}`
      : `<div class="admin-empty compact-empty">还没有选择首页 All 展示产品。</div>`;
  }
  if (marqueeRoot) {
    marqueeRoot.innerHTML = visibleMarquee.length
      ? `${visibleMarquee.map((item) => homepagePickMarkup(item, "marquee")).join("")}${marquee.length > 10 ? `<p class="homepage-pick-note">还有 ${marquee.length - 10} 个已勾选，但滚动条当前只取排序前 10 个。</p>` : ""}`
      : `<div class="admin-empty compact-empty">还没有选择首页滚动产品。</div>`;
  }
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
      [item.name, item.name_zh, item.category, item.category_zh, item.tagline, item.tagline_zh, item.description, item.description_zh, JSON.stringify(item.specs || {}), JSON.stringify(item.specs_zh || {})]
        .some((value) => matchesQuery(value, query))
    )
    .filter((item) => {
      if (state.productFilter === "published") return item.published;
      if (state.productFilter === "draft") return !item.published;
      if (state.productFilter === "featured") return item.is_featured;
      if (state.productFilter === "marquee") return item.show_in_marquee;
      return true;
    });
  if (count) {
    count.textContent = `${filtered.length} / ${state.products.length}`;
  }
  const sorted = filtered.slice().sort((a, b) => {
          if (["featured", "marquee"].includes(state.productFilter)) {
            return a.sort_order - b.sort_order || sortDate(b.updated_at) - sortDate(a.updated_at);
          }
          return sortDate(b.updated_at) - sortDate(a.updated_at) || a.sort_order - b.sort_order;
        });
  const totalPages = Math.max(1, Math.ceil(sorted.length / state.pageSize));
  state.productPage = Math.min(state.productPage, totalPages);
  const offset = (state.productPage - 1) * state.pageSize;
  list.innerHTML = sorted.length
    ? sorted.slice(offset, offset + state.pageSize).map(productItem).join("")
    : `<div class="admin-empty">没有匹配的产品，换个关键词试试。</div>`;
  renderPagination("product", state.productPage, totalPages, sorted.length);
}

function renderNews() {
  const list = $("[data-news-admin-list]");
  const count = $("[data-news-count]");
  if (!list) return;
  const query = state.newsQuery.trim();
  const filtered = state.news
    .filter((item) =>
      [item.title, item.title_zh, item.title_en, item.category, item.category_zh, item.category_en, item.excerpt, item.excerpt_zh, item.excerpt_en, item.content, item.content_zh, item.content_en, item.published_at]
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
  const sorted = filtered.slice().sort((a, b) => sortDate(b.updated_at || b.published_at) - sortDate(a.updated_at || a.published_at));
  const totalPages = Math.max(1, Math.ceil(sorted.length / state.pageSize));
  state.newsPage = Math.min(state.newsPage, totalPages);
  const offset = (state.newsPage - 1) * state.pageSize;
  list.innerHTML = sorted.length
    ? sorted.slice(offset, offset + state.pageSize).map(newsItem).join("")
    : `<div class="admin-empty">没有匹配的动态，换个关键词试试。</div>`;
  renderPagination("news", state.newsPage, totalPages, sorted.length);
}

function renderPagination(type, current, total, itemCount) {
  const root = $(`[data-${type}-pagination]`);
  if (!root) return;
  if (total <= 1) {
    root.innerHTML = itemCount ? `<span>共 ${itemCount} 条</span>` : "";
    return;
  }
  root.innerHTML = `
    <span>第 ${current} / ${total} 页，共 ${itemCount} 条</span>
    <div>
      <button type="button" data-page-type="${type}" data-page-value="${current - 1}" ${current === 1 ? "disabled" : ""}>上一页</button>
      <button type="button" data-page-type="${type}" data-page-value="${current + 1}" ${current === total ? "disabled" : ""}>下一页</button>
    </div>
  `;
}

function setProductView(view, options = {}) {
  state.productView = view;
  $$('[data-product-view]').forEach((button) => button.classList.toggle("active", button.dataset.productView === view));
  $$('[data-product-workspace]').forEach((section) => {
    section.hidden = section.dataset.productWorkspace !== view;
  });
  document.body.dataset.productView = view;
  if (options.scroll !== false) {
    $("[data-panel='products']")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }
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
  if (!container) return {};
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
  const specZhRows = $("[data-product-spec-zh-rows]");
  const specSuggestions = $("[data-product-spec-suggestions]");
  const imageName = $("[data-product-image-name]");
  if (!form) return;

  form.id.value = item?.id || "";
  form.name.value = item?.name || "";
  if (form.name_zh) form.name_zh.value = item?.name_zh || "";
  form.slug.value = item?.slug || "";
  form.category.value = item?.category || "";
  if (form.category_zh) form.category_zh.value = item?.category_zh || "";
  form.tagline.value = item?.tagline || "";
  if (form.tagline_zh) form.tagline_zh.value = item?.tagline_zh || "";
  form.description.value = item?.description || "";
  if (form.description_zh) form.description_zh.value = item?.description_zh || "";
  form.sort_order.value = item?.sort_order ?? 0;
  form.is_featured.checked = Boolean(item?.is_featured);
  if (form.show_in_marquee) form.show_in_marquee.checked = item ? Boolean(item.show_in_marquee) : false;
  form.published.checked = item ? Boolean(item.published) : false;

  if (urlInput) urlInput.value = item?.image_url || "";
  form.image_url.value = item?.image_url || "";
  setImagePreview(preview, item?.image_url || "", item?.name || "产品图片预览");
  renderSpecRows(specRows, item?.specs || {});
  renderSpecRows(specZhRows, item?.specs_zh || {});
  renderSpecSuggestions(specSuggestions, item?.category || form.category.value || "Washing Machine", item?.specs || {});
  syncUploadName(imageName, item?.image_url ? "已载入当前图片" : "");

  if (title) title.textContent = item ? "编辑产品" : "新建产品";
  if (subtitle) {
    subtitle.textContent = item
      ? "调整分类、图片、词条和发布状态后直接保存，系统会保留现有页面链接。"
      : "填写产品名称、分类、图片、规格词条和展示状态，系统会自动生成页面地址。";
  }
  setProductView("editor");
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
  if (form.title_zh) form.title_zh.value = item?.title_zh || "";
  if (form.title_en) form.title_en.value = item?.title_en || "";
  form.slug.value = item?.slug || "";
  form.category.value = item?.category || "";
  if (form.category_zh) form.category_zh.value = item?.category_zh || "";
  if (form.category_en) form.category_en.value = item?.category_en || "";
  form.published_at.value = item?.published_at || new Date().toISOString().slice(0, 10);
  form.excerpt.value = item?.excerpt || "";
  if (form.excerpt_zh) form.excerpt_zh.value = item?.excerpt_zh || "";
  if (form.excerpt_en) form.excerpt_en.value = item?.excerpt_en || "";
  form.content.value = item?.content || "";
  if (form.content_zh) form.content_zh.value = item?.content_zh || "";
  if (form.content_en) form.content_en.value = item?.content_en || "";
  form.published.checked = item ? Boolean(item.published) : false;

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

function stripArticleImageMarkers(value) {
  return String(value || "")
    .replace(/^\s*\[\[panhiro-image:\{.*\}\]\]\s*$/gm, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function insertTextAtCursor(textarea, text) {
  const start = textarea.selectionStart ?? textarea.value.length;
  const end = textarea.selectionEnd ?? textarea.value.length;
  const before = textarea.value.slice(0, start).replace(/\s*$/, "");
  const after = textarea.value.slice(end).replace(/^\s*/, "");
  const cleanText = text.trim();
  textarea.value = `${before}${before ? "\n\n" : ""}${cleanText}${after ? `\n\n${after}` : ""}`;
  const cursor = `${before}${before ? "\n\n" : ""}${cleanText}`.length;
  textarea.focus();
  textarea.setSelectionRange(cursor, cursor);
  textarea.dispatchEvent(new Event("input", { bubbles: true }));
}

function ensureNewsMediaWorkbench(form) {
  if ($("[data-news-inline-image-tool]", form)) return;
  const contentField = form.content?.closest("label");
  if (!contentField) return;
  const tool = document.createElement("div");
  tool.className = "article-image-tool field-span-2";
  tool.setAttribute("data-news-inline-image-tool", "");
  tool.innerHTML = `
    <div>
      <strong>正文图片</strong>
      <p>先把光标放在正文里想插入图片的位置，再选择图片大小并插入。图片会跟随文章一起保存。</p>
    </div>
    <input type="file" accept="image/*" data-news-inline-image-file />
    <div class="article-image-controls">
      <label>
        <span>图片链接或本地图片</span>
        <input type="url" data-news-inline-image-url placeholder="/assets/article-image.jpg 或 https://..." />
      </label>
      <label>
        <span>预设大小</span>
        <select data-news-inline-image-size>
          <option value="large">大图 90%</option>
          <option value="full">通栏 100%</option>
          <option value="medium">中图 70%</option>
          <option value="small">小图 45%</option>
        </select>
      </label>
      <label>
        <span>自定义宽度</span>
        <input type="number" min="25" max="100" step="5" data-news-inline-image-width placeholder="25-100，可留空" />
      </label>
      <label>
        <span>图片说明</span>
        <input type="text" data-news-inline-image-caption placeholder="可选，会显示在图片下方" />
      </label>
    </div>
    <div class="admin-inline-actions">
      <button type="button" class="admin-mini-button" data-news-inline-image-pick>选择正文图片</button>
      <button type="button" class="admin-mini-button primary-mini" data-news-inline-image-insert>插入到正文位置</button>
      <span class="upload-file-name" data-news-inline-image-name>还没有选择正文图片</span>
    </div>
  `;
  contentField.insertAdjacentElement("afterend", tool);
}

function setupNewsMediaWorkbench(form) {
  ensureNewsMediaWorkbench(form);
  const tool = $("[data-news-inline-image-tool]", form);
  const textarea = form.content;
  if (!tool || !textarea) return;

  const fileInput = $("[data-news-inline-image-file]", tool);
  const urlInput = $("[data-news-inline-image-url]", tool);
  const sizeInput = $("[data-news-inline-image-size]", tool);
  const widthInput = $("[data-news-inline-image-width]", tool);
  const captionInput = $("[data-news-inline-image-caption]", tool);
  const fileName = $("[data-news-inline-image-name]", tool);
  const allowedSizes = new Set(["small", "medium", "large", "full"]);

  $("[data-news-inline-image-pick]", tool)?.addEventListener("click", () => fileInput?.click());
  fileInput?.addEventListener("change", async () => {
    const file = fileInput.files?.[0];
    if (!file) return;
    syncUploadName(fileName, `Reading: ${file.name}`);
    try {
      const dataUrl = await readImageAsDataUrl(file);
      urlInput.value = dataUrl;
      syncUploadName(fileName, file.name);
      status("正文图片已准备好，点击“插入到正文位置”即可放入文章。", "success");
    } catch (error) {
      syncUploadName(fileName, "");
      status(friendlyError(error), "error");
    }
  });

  $("[data-news-inline-image-insert]", tool)?.addEventListener("click", () => {
    const src = urlInput.value.trim();
    if (!src) {
      status("请先选择正文图片，或填写图片链接。", "error");
      return;
    }
    const rawWidth = Number(widthInput.value || 0);
    const width = rawWidth ? Math.min(100, Math.max(25, rawWidth)) : "";
    const size = allowedSizes.has(sizeInput.value) ? sizeInput.value : "large";
    const marker = `[[panhiro-image:${JSON.stringify({
      src,
      size,
      width,
      caption: captionInput.value.trim()
    })}]]`;
    insertTextAtCursor(textarea, marker);
    urlInput.value = "";
    if (fileInput) fileInput.value = "";
    if (widthInput) widthInput.value = "";
    if (captionInput) captionInput.value = "";
    syncUploadName(fileName, "已插入正文");
    setDirty("news", true);
    status("正文图片已插入。保存文章后，详情页会按这个位置显示图片。", "success");
  });
}

function mediaId() {
  return `media-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function normalizeNewsMediaItem(item) {
  const allowedSizes = new Set(["small", "medium", "large", "full"]);
  const width = Number(item.width || 0);
  return {
    id: item.id || mediaId(),
    src: String(item.src || ""),
    name: String(item.name || "Article image"),
    size: allowedSizes.has(item.size) ? item.size : "large",
    width: width ? Math.min(100, Math.max(25, width)) : "",
    caption: String(item.caption || ""),
    position: String(item.position || "cursor")
  };
}

function getNewsMediaItems(form) {
  if (!form._newsMediaItems) form._newsMediaItems = [];
  return form._newsMediaItems;
}

function extractNewsImageMarkers(value) {
  const images = [];
  const pattern = /^\s*\[\[panhiro-image:(\{.*\})\]\]\s*$/gm;
  let match = pattern.exec(String(value || ""));
  while (match) {
    try {
      const parsed = JSON.parse(match[1]);
      if (parsed.src) images.push(normalizeNewsMediaItem(parsed));
    } catch {
      // Ignore manually edited or broken image markers.
    }
    match = pattern.exec(String(value || ""));
  }
  return images;
}

function pushNewsMediaItem(form, item) {
  const normalized = normalizeNewsMediaItem(item);
  if (!normalized.src) return null;
  const items = getNewsMediaItems(form);
  const existing = items.find((entry) => entry.src === normalized.src);
  if (existing) {
    Object.assign(existing, { ...normalized, id: existing.id });
    return existing;
  }
  items.push(normalized);
  return normalized;
}

function seedNewsMediaFromForm(form) {
  let changed = false;
  if (form.image_url?.value) {
    changed = Boolean(pushNewsMediaItem(form, {
      src: form.image_url.value,
      name: "Current cover image",
      size: "large"
    })) || changed;
  }
  extractNewsImageMarkers(form.content?.value).forEach((item) => {
    changed = Boolean(pushNewsMediaItem(form, item)) || changed;
  });
  if (changed) renderNewsMediaLibrary(form);
}

function setNewsCoverImage(form, src, label = "Article cover") {
  const urlInput = $("[data-news-image-url]", form);
  const preview = $("[data-news-image-preview]");
  const imageName = $("[data-news-image-name]");
  form.image_url.value = src || "";
  if (urlInput) urlInput.value = src || "";
  setImagePreview(preview, src || "", label);
  syncUploadName(imageName, src ? label : "");
  setDirty("news", true);
}

function mediaMarker(item) {
  return `[[panhiro-image:${JSON.stringify({
    src: item.src,
    size: item.size,
    width: item.width,
    caption: item.caption
  })}]]`;
}

function isArticleImageMarker(block) {
  return /^\s*\[\[panhiro-image:(\{.*\})\]\]\s*$/.test(String(block || ""));
}

function articleBlocks(value) {
  return String(value || "")
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);
}

function paragraphBlocks(value) {
  return articleBlocks(value).filter((block) => !isArticleImageMarker(block));
}

function mediaPositionOptions(value, selected = "cursor") {
  const paragraphCount = paragraphBlocks(value).length;
  const base = [
    ["cursor", "光标当前位置"],
    ["start", "文章开头"],
    ["end", "文章结尾"]
  ];
  for (let index = 1; index <= paragraphCount; index += 1) {
    base.push([`after-${index}`, `第 ${index} 段之后`]);
  }
  return base
    .map(([value, label]) => `<option value="${escapeHTML(value)}"${selected === value ? " selected" : ""}>${escapeHTML(label)}</option>`)
    .join("");
}

function insertMediaByPosition(form, item) {
  const marker = mediaMarker(item);
  const position = item.position || "cursor";
  if (position === "cursor") {
    insertTextAtCursor(form.content, marker);
    return;
  }

  const blocks = articleBlocks(form.content.value);
  if (position === "start") {
    blocks.unshift(marker);
  } else if (position === "end" || !blocks.length) {
    blocks.push(marker);
  } else {
    const afterMatch = position.match(/^after-(\d+)$/);
    const targetParagraph = afterMatch ? Number(afterMatch[1]) : 0;
    let seenParagraphs = 0;
    let insertIndex = blocks.length;
    for (let index = 0; index < blocks.length; index += 1) {
      if (isArticleImageMarker(blocks[index])) continue;
      seenParagraphs += 1;
      if (seenParagraphs === targetParagraph) {
        insertIndex = index + 1;
        break;
      }
    }
    blocks.splice(insertIndex, 0, marker);
  }

  form.content.value = blocks.join("\n\n");
  form.content.dispatchEvent(new Event("input", { bubbles: true }));
}

function ensureNewsImageTool(form) {
  if ($("[data-news-inline-image-tool]", form)) return;
  const contentField = form.content?.closest("label");
  if (!contentField) return;
  const tool = document.createElement("div");
  tool.className = "article-image-tool media-workbench field-span-2";
  tool.setAttribute("data-news-inline-image-tool", "");
  tool.innerHTML = `
    <div class="media-workbench-head">
      <div>
        <strong>文章图片工作台</strong>
        <p>一次上传多张图片。每张图都可以设为封面，也可以插入到正文光标所在位置，并单独设置显示大小。</p>
      </div>
      <button type="button" class="admin-mini-button primary-mini" data-news-media-pick>多图上传</button>
    </div>
    <input type="file" accept="image/*" multiple data-news-media-files />
    <div class="media-url-row">
      <label>
        <span>图片链接</span>
        <input type="url" data-news-media-url placeholder="/assets/article-image.jpg 或 https://..." />
      </label>
      <button type="button" class="admin-mini-button" data-news-media-add-url>加入图片库</button>
    </div>
    <div class="media-dropzone" data-news-media-dropzone>
      <span>拖入多张图片，或点击“多图上传”</span>
    </div>
    <div class="media-library" data-news-media-list></div>
  `;
  contentField.insertAdjacentElement("afterend", tool);
}

function mediaCardMarkup(item, isCover, positionOptions) {
  return `
    <article class="media-asset-card${isCover ? " is-cover" : ""}" data-media-id="${escapeHTML(item.id)}">
      <img src="${escapeHTML(item.src)}" alt="${escapeHTML(item.caption || item.name)}" />
      <div class="media-asset-body">
        <div class="media-asset-title">
          <strong>${escapeHTML(item.name)}</strong>
          ${isCover ? "<span>当前封面</span>" : ""}
        </div>
        <div class="media-asset-fields">
          <label>
            <span>插入位置</span>
            <select data-media-position>
              ${positionOptions}
            </select>
          </label>
          <label>
            <span>大小</span>
            <select data-media-size>
              <option value="large"${item.size === "large" ? " selected" : ""}>大图 90%</option>
              <option value="full"${item.size === "full" ? " selected" : ""}>通栏 100%</option>
              <option value="medium"${item.size === "medium" ? " selected" : ""}>中图 70%</option>
              <option value="small"${item.size === "small" ? " selected" : ""}>小图 45%</option>
            </select>
          </label>
          <label>
            <span>自定义宽度</span>
            <input type="number" min="25" max="100" step="5" data-media-width value="${escapeHTML(item.width)}" placeholder="25-100" />
          </label>
          <label>
            <span>说明</span>
            <input type="text" data-media-caption value="${escapeHTML(item.caption)}" placeholder="可选" />
          </label>
        </div>
        <div class="media-asset-actions">
          <button type="button" class="admin-mini-button" data-media-set-cover>设为封面</button>
          <button type="button" class="admin-mini-button primary-mini" data-media-insert>按位置插入正文</button>
          <button type="button" class="admin-mini-button danger-mini" data-media-remove>移除</button>
        </div>
      </div>
    </article>
  `;
}

function renderNewsMediaLibrary(form) {
  const list = $("[data-news-media-list]", form);
  if (!list) return;
  const items = getNewsMediaItems(form);
  list.innerHTML = items.length
    ? items.map((item) => mediaCardMarkup(item, item.src === form.image_url.value, mediaPositionOptions(form.content.value, item.position))).join("")
    : `<div class="media-empty">还没有图片。上传多张图片后，可以分别设为封面或插入正文。</div>`;
}

async function addNewsMediaFiles(form, files) {
  const list = Array.from(files || []).filter((file) => file?.type?.startsWith("image/"));
  if (!list.length) return;
  status(`正在读取 ${list.length} 张图片...`);
  for (const file of list) {
    const dataUrl = await readImageAsDataUrl(file);
    pushNewsMediaItem(form, { src: dataUrl, name: file.name, size: "large" });
  }
  renderNewsMediaLibrary(form);
  status(`${list.length} 张图片已加入图片库。`, "success");
}

function setupNewsInlineImageTool(form) {
  ensureNewsImageTool(form);
  const tool = $("[data-news-inline-image-tool]", form);
  if (!tool || !form.content) return;

  const fileInput = $("[data-news-media-files]", tool);
  const urlInput = $("[data-news-media-url]", tool);
  const dropzone = $("[data-news-media-dropzone]", tool);

  seedNewsMediaFromForm(form);
  renderNewsMediaLibrary(form);

  tool.addEventListener("pointerenter", () => seedNewsMediaFromForm(form));
  $("[data-news-media-pick]", tool)?.addEventListener("click", () => fileInput?.click());
  fileInput?.addEventListener("change", async () => {
    await addNewsMediaFiles(form, fileInput.files);
    fileInput.value = "";
  });

  $("[data-news-media-add-url]", tool)?.addEventListener("click", () => {
    const src = urlInput.value.trim();
    if (!src) {
      status("请先填写图片链接。", "error");
      return;
    }
    pushNewsMediaItem(form, { src, name: src.split("/").pop() || "Linked image", size: "large" });
    urlInput.value = "";
    renderNewsMediaLibrary(form);
    status("图片链接已加入图片库。", "success");
  });

  dropzone?.addEventListener("dragover", (event) => {
    event.preventDefault();
    dropzone.classList.add("is-dragover");
  });
  dropzone?.addEventListener("dragleave", () => dropzone.classList.remove("is-dragover"));
  dropzone?.addEventListener("drop", async (event) => {
    event.preventDefault();
    dropzone.classList.remove("is-dragover");
    await addNewsMediaFiles(form, event.dataTransfer?.files);
  });

  tool.addEventListener("input", (event) => {
    const card = event.target.closest("[data-media-id]");
    if (!card) return;
    const item = getNewsMediaItems(form).find((entry) => entry.id === card.dataset.mediaId);
    if (!item) return;
    if (event.target.matches("[data-media-size]")) item.size = event.target.value;
    if (event.target.matches("[data-media-position]")) item.position = event.target.value;
    if (event.target.matches("[data-media-width]")) {
      const rawWidth = Number(event.target.value || 0);
      item.width = rawWidth ? Math.min(100, Math.max(25, rawWidth)) : "";
    }
    if (event.target.matches("[data-media-caption]")) item.caption = event.target.value;
  });

  tool.addEventListener("click", (event) => {
    const card = event.target.closest("[data-media-id]");
    if (!card) return;
    const item = getNewsMediaItems(form).find((entry) => entry.id === card.dataset.mediaId);
    if (!item) return;

    if (event.target.closest("[data-media-set-cover]")) {
      setNewsCoverImage(form, item.src, item.name);
      renderNewsMediaLibrary(form);
      status("封面已更新，保存文章后生效。", "success");
    }
    if (event.target.closest("[data-media-insert]")) {
      insertMediaByPosition(form, item);
      setDirty("news", true);
      status("图片已按选择的位置插入正文，保存文章后生效。", "success");
    }
    if (event.target.closest("[data-media-remove]")) {
      form._newsMediaItems = getNewsMediaItems(form).filter((entry) => entry.id !== item.id);
      renderNewsMediaLibrary(form);
      status("图片已从本次图片库移除，已插入正文的标记不会自动删除。", "info");
    }
  });
}

function setupProductEditor() {
  const form = $("[data-product-form]");
  const specRows = $("[data-product-spec-rows]");
  const specZhRows = $("[data-product-spec-zh-rows]");
  const specSuggestions = $("[data-product-spec-suggestions]");
  const create = $("[data-product-create]");
  if (!form || !specRows) return;

  form.noValidate = true;
  form.dataset.slugPrefix = "product";
  renderSpecRows(specRows, {});
  renderSpecRows(specZhRows, {});
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

  const addSpecZh = $("[data-product-add-spec-zh]");
  addSpecZh?.addEventListener("click", () => {
    specZhRows?.insertAdjacentHTML("beforeend", specRowMarkup());
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
  specZhRows?.addEventListener("click", (event) => {
    const remove = event.target.closest(".spec-remove");
    if (!remove) return;
    remove.closest(".spec-row")?.remove();
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
      name_zh: form.name_zh?.value.trim() || "",
      category_zh: form.category_zh?.value.trim() || "",
      tagline_zh: form.tagline_zh?.value.trim() || "",
      description_zh: form.description_zh?.value.trim() || "",
      image_url: form.image_url.value.trim() || $("[data-product-image-url]", form)?.value.trim(),
      specs: readSpecRows(specRows),
      specs_zh: readSpecRows(specZhRows),
      sort_order: Number(form.sort_order.value || 0),
      is_featured: form.is_featured.checked ? 1 : 0,
      show_in_marquee: form.show_in_marquee?.checked ? 1 : 0,
      published: form.published.checked ? 1 : 0,
      updated_at: new Date().toISOString()
    };

    if (!payload.name || !payload.slug || !payload.category || !payload.tagline || !payload.description || !payload.image_url) {
      status("产品没有保存：请补全产品名称、分类、卖点、详细介绍和图片。", "error");
      return;
    }

    const id = form.id.value;
    const isUpdate = Boolean(id);
    const previous = state.products.find((item) => String(item.id) === String(id));
    if (payload.published && (!previous || !previous.published)) {
      const confirmed = confirm("确认现在发布这个产品吗？发布后会立即出现在官网对应页面。");
      if (!confirmed) return;
    }
    let savedProduct = null;
    setFormBusy(form, true);
    status(isUpdate ? "正在保存产品修改..." : "正在创建新产品...");
    try {
      if (state.apiAvailable) {
        if (!localStorage.getItem(keys.token)) throw new Error("登录已过期，请重新登录。");
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
      setProductView("library");
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
  setupNewsInlineImageTool(form);
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
    const content = stripArticleImageMarkers(form.content.value);
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
      title_zh: form.title_zh?.value.trim() || "",
      category_zh: form.category_zh?.value.trim() || "",
      excerpt_zh: form.excerpt_zh?.value.trim() || "",
      content_zh: form.content_zh?.value.trim() || "",
      title_en: form.title_en?.value.trim() || "",
      category_en: form.category_en?.value.trim() || "",
      excerpt_en: form.excerpt_en?.value.trim() || "",
      content_en: form.content_en?.value.trim() || "",
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
      const plain = stripArticleImageMarkers(payload.content).replace(/\s+/g, " ").trim();
      payload.excerpt = plain.length > 180 ? `${plain.slice(0, 180).replace(/\s+\S*$/, "")}...` : plain;
    }

    const id = form.id.value;
    const isUpdate = Boolean(id);
    const previous = state.news.find((item) => String(item.id) === String(id));
    if (payload.published && (!previous || !previous.published)) {
      const confirmed = confirm("确认现在发布这篇文章吗？发布后会立即出现在官网新闻页面。");
      if (!confirmed) return;
    }
    let savedNews = null;
    setFormBusy(form, true);
    status(isUpdate ? "正在保存文章修改..." : "正在创建新文章...");
    try {
      if (state.apiAvailable) {
        if (!localStorage.getItem(keys.token)) throw new Error("登录已过期，请重新登录。");
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
        if (!localStorage.getItem(keys.token)) throw new Error("登录已过期，请重新登录。");
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

async function toggleProductPlacement(id, field) {
  const current = state.products.find((product) => String(product.id) === String(id));
  if (!current) return;
  const nextValue = current[field] ? 0 : 1;
  const payload = {
    ...current,
    [field]: nextValue,
    is_featured: field === "is_featured" ? nextValue : current.is_featured ? 1 : 0,
    show_in_marquee: field === "show_in_marquee" ? nextValue : current.show_in_marquee ? 1 : 0,
    published: current.published ? 1 : 0,
    updated_at: new Date().toISOString()
  };

  try {
    if (state.apiAvailable) {
      if (!localStorage.getItem(keys.token)) throw new Error("登录已过期，请重新登录。");
      await api(`/api/products/${id}`, {
        method: "PUT",
        body: JSON.stringify(payload)
      });
      await loadContent();
    } else {
      state.products = state.products.map((item) => (String(item.id) === String(id) ? normalizeProduct(payload) : item));
      persistLocal();
      render();
    }
    const label = field === "is_featured" ? "首页 All 产品卡" : "首页滚动产品";
    status(`${current.name_zh || current.name} 已${nextValue ? "加入" : "移出"}${label}。`, "success");
  } catch (error) {
    status(friendlyError(error), "error");
  }
}

function deleteNews(id) {
  if (!confirm("确定删除这条文章吗？")) return;
  (async () => {
    try {
      if (state.apiAvailable) {
        if (!localStorage.getItem(keys.token)) throw new Error("登录已过期，请重新登录。");
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

const INQUIRY_STATUS_LABELS = {
  new: "待处理",
  handled: "已处理",
  archived: "已归档"
};

const INQUIRY_PREVIEW_KEY = "panhiro.inquiries.preview";

function normalizeInquiry(item) {
  return {
    id: item.id ?? `local-${item.created_at || Math.random().toString(36).slice(2)}`,
    name: item.name || "",
    company: item.company || "",
    contact: item.contact || "",
    region: item.region || "",
    product: item.product || "",
    intent: item.intent || "",
    message: item.message || "",
    lang: item.lang || "zh",
    source: item.source || "",
    status: INQUIRY_STATUS_LABELS[item.status] ? item.status : "new",
    created_at: item.created_at || new Date().toISOString(),
    isLocal: Boolean(item.isLocal)
  };
}

function updateInquiryBadge() {
  const badge = $("[data-inquiry-badge]");
  if (!badge) return;
  const pending = state.inquiries.filter((item) => item.status === "new").length;
  if (pending > 0) {
    badge.textContent = String(pending);
    badge.hidden = false;
  } else {
    badge.hidden = true;
  }
}

function inquiryCard(item) {
  const created = item.created_at ? new Date(item.created_at).toLocaleString("zh-CN", { hour12: false }) : "";
  const fields = [
    ["公司 / 门店", item.company],
    ["所在地区", item.region],
    ["产品意向", item.product],
    ["合作类型", item.intent]
  ]
    .filter(([, value]) => value)
    .map(([label, value]) => `<div><span>${escapeHTML(label)}</span><strong>${escapeHTML(value)}</strong></div>`)
    .join("");

  const message = item.message
    ? `<p class="inquiry-message">${escapeHTML(item.message)}</p>`
    : "";

  const localTag = item.isLocal ? '<span class="inquiry-tag local">本地预览</span>' : "";
  const actions = item.isLocal
    ? '<span class="inquiry-local-note">本地预览数据，部署上线后才会真正入库</span>'
    : `
        <button type="button" class="admin-mini-button" data-inquiry-status-set="new" data-inquiry-id="${escapeHTML(item.id)}">标记待处理</button>
        <button type="button" class="admin-mini-button" data-inquiry-status-set="handled" data-inquiry-id="${escapeHTML(item.id)}">标记已处理</button>
        <button type="button" class="admin-mini-button" data-inquiry-status-set="archived" data-inquiry-id="${escapeHTML(item.id)}">归档</button>
        <button type="button" class="admin-mini-button danger" data-inquiry-delete="${escapeHTML(item.id)}">删除</button>
      `;

  return `
    <article class="inquiry-card" data-status="${escapeHTML(item.status)}">
      <div class="inquiry-card-top">
        <div class="inquiry-identity">
          <strong>${escapeHTML(item.name || "（未填写姓名）")}</strong>
          <a href="tel:${escapeHTML(item.contact)}" class="inquiry-contact">${escapeHTML(item.contact || "")}</a>
        </div>
        <div class="inquiry-meta">
          <span class="inquiry-status inquiry-status-${escapeHTML(item.status)}">${escapeHTML(INQUIRY_STATUS_LABELS[item.status] || item.status)}</span>
          ${localTag}
          <time>${escapeHTML(created)}</time>
        </div>
      </div>
      ${fields ? `<div class="inquiry-fields">${fields}</div>` : ""}
      ${message}
      <div class="inquiry-actions">${actions}</div>
    </article>
  `;
}

function filteredInquiries() {
  const query = state.inquiryQuery.trim();
  return state.inquiries.filter((item) => {
    if (state.inquiryFilter !== "all" && item.status !== state.inquiryFilter) return false;
    if (!query) return true;
    return [item.name, item.company, item.contact, item.region, item.product, item.intent, item.message]
      .some((value) => matchesQuery(value, query));
  });
}

function renderInquiries() {
  const list = $("[data-inquiry-list]");
  if (!list) return;
  updateInquiryBadge();

  if (!state.inquiriesLoaded && !state.inquiries.length) {
    list.innerHTML = '<p class="inquiry-empty">正在读取询盘...</p>';
    return;
  }

  const items = filteredInquiries();
  if (!items.length) {
    list.innerHTML = state.inquiries.length
      ? '<p class="inquiry-empty">没有符合当前筛选条件的询盘。</p>'
      : '<p class="inquiry-empty">还没有收到客户询盘。官网“联系我们”页提交的咨询会出现在这里。</p>';
    return;
  }

  list.innerHTML = items.map(inquiryCard).join("");
}

async function loadInquiries(force = false) {
  if (state.inquiriesLoaded && !force) return;

  if (isStaticPreview) {
    const local = readLocal(INQUIRY_PREVIEW_KEY, []);
    state.inquiries = local.map((item) => normalizeInquiry({ ...item, isLocal: true }));
    state.inquiriesLoaded = true;
    renderInquiries();
    return;
  }

  const list = $("[data-inquiry-list]");
  if (list && !state.inquiries.length) list.innerHTML = '<p class="inquiry-empty">正在读取询盘...</p>';

  try {
    const data = await api("/api/inquiries");
    state.inquiries = (data.inquiries || []).map((item) => normalizeInquiry(item));
    state.inquiriesLoaded = true;
    renderInquiries();
  } catch (error) {
    state.inquiriesLoaded = false;
    if (list) {
      list.innerHTML = `<p class="inquiry-empty error">读取询盘失败：${escapeHTML(friendlyError(error))}</p>`;
    }
    notify(friendlyError(error), "error");
  }
}

async function setInquiryStatus(id, status) {
  try {
    await api(`/api/inquiries/${encodeURIComponent(id)}`, {
      method: "PUT",
      body: JSON.stringify({ status })
    });
    const item = state.inquiries.find((entry) => String(entry.id) === String(id));
    if (item) item.status = status;
    renderInquiries();
    notify(`已将询盘标记为「${INQUIRY_STATUS_LABELS[status] || status}」。`, "success");
  } catch (error) {
    notify(friendlyError(error), "error");
  }
}

async function deleteInquiry(id) {
  if (!window.confirm("确定删除这条询盘吗？删除后无法恢复。")) return;
  try {
    await api(`/api/inquiries/${encodeURIComponent(id)}`, { method: "DELETE" });
    state.inquiries = state.inquiries.filter((entry) => String(entry.id) !== String(id));
    renderInquiries();
    notify("询盘已删除。", "success");
  } catch (error) {
    notify(friendlyError(error), "error");
  }
}

function setupInquiries() {
  $("[data-inquiry-refresh]")?.addEventListener("click", () => loadInquiries(true));

  $("[data-inquiry-search]")?.addEventListener("input", (event) => {
    state.inquiryQuery = event.currentTarget.value;
    renderInquiries();
  });

  $("[data-inquiry-filters]")?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-inquiry-filter]");
    if (!button) return;
    state.inquiryFilter = button.dataset.inquiryFilter;
    $$("[data-inquiry-filter]").forEach((item) => item.classList.toggle("active", item === button));
    renderInquiries();
  });

  $("[data-inquiry-list]")?.addEventListener("click", (event) => {
    const statusButton = event.target.closest("[data-inquiry-status-set]");
    const deleteButton = event.target.closest("[data-inquiry-delete]");
    if (statusButton) {
      setInquiryStatus(statusButton.dataset.inquiryId, statusButton.dataset.inquiryStatusSet);
    }
    if (deleteButton) {
      deleteInquiry(deleteButton.dataset.inquiryDelete);
    }
  });
}

function setupTabs() {
  $$("[data-admin-tab]").forEach((button) => {
    button.addEventListener("click", () => {
      state.activePanel = button.dataset.adminTab;
      $$("[data-admin-tab]").forEach((item) => item.classList.toggle("active", item === button));
      $$(".admin-panel").forEach((panel) => panel.classList.toggle("active", panel.dataset.panel === button.dataset.adminTab));
      updateCommandBar();
      closeAdminMenu();
      if (button.dataset.adminTab === "inquiries") loadInquiries();
    });
  });
}

function setupLogin() {
  const overlay = $("[data-login-overlay]");
  const shell = $("[data-admin-shell]");
  const form = $("[data-login-form]");
  const errorEl = $("[data-login-error]");
  const logoutBtn = $("[data-logout]");
  const isLocal = location.protocol === "file:" || ["5173", "5174"].includes(location.port);

  function showAdmin() {
    overlay.hidden = true;
    shell.hidden = false;
  }

  function showLogin() {
    overlay.hidden = false;
    shell.hidden = true;
  }

  if (isLocal || localStorage.getItem(keys.token)) {
    showAdmin();
  } else {
    showLogin();
  }

  form?.addEventListener("submit", async (event) => {
    event.preventDefault();
    errorEl.textContent = "";
    const btn = form.querySelector("button[type='submit']");
    btn.disabled = true;
    btn.textContent = "登录中...";

    const username = form.username.value.trim();
    const password = form.password.value;

    if (isLocal) {
      localStorage.setItem(keys.token, "local-preview-token");
      showAdmin();
      loadContent();
      btn.disabled = false;
      btn.textContent = "登录";
      return;
    }

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "登录失败");
      localStorage.setItem(keys.token, data.token);
      showAdmin();
      loadContent();
    } catch (err) {
      errorEl.textContent = err.message;
    } finally {
      btn.disabled = false;
      btn.textContent = "登录";
    }
  });

  logoutBtn?.addEventListener("click", () => {
    localStorage.removeItem(keys.token);
    if (isLocal) {
      showAdmin();
    } else {
      showLogin();
      form.reset();
    }
  });
}

function setupSearch() {
  $("[data-product-search]")?.addEventListener("input", (event) => {
    state.productQuery = event.currentTarget.value;
    state.productPage = 1;
    renderProducts();
  });
  $("[data-news-search]")?.addEventListener("input", (event) => {
    state.newsQuery = event.currentTarget.value;
    state.newsPage = 1;
    renderNews();
  });
}

function setupFilters() {
  $("[data-product-filters]")?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-product-filter]");
    if (!button) return;
    state.productFilter = button.dataset.productFilter;
    state.productPage = 1;
    $$("[data-product-filter]").forEach((item) => item.classList.toggle("active", item === button));
    renderProducts();
  });

  $("[data-news-filters]")?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-news-filter]");
    if (!button) return;
    state.newsFilter = button.dataset.newsFilter;
    state.newsPage = 1;
    $$("[data-news-filter]").forEach((item) => item.classList.toggle("active", item === button));
    renderNews();
  });
}

function setupListActions() {
  document.addEventListener("click", (event) => {
    const editProduct = event.target.closest("[data-edit-product]");
    const deleteProductButton = event.target.closest("[data-delete-product]");
    const toggleFeaturedProduct = event.target.closest("[data-toggle-featured-product]");
    const toggleMarqueeProduct = event.target.closest("[data-toggle-marquee-product]");
    const editNews = event.target.closest("[data-edit-news]");
    const deleteNewsButton = event.target.closest("[data-delete-news]");

    if (editProduct) {
      const item = state.products.find((product) => String(product.id) === String(editProduct.dataset.editProduct));
      if (item) fillProductForm(item);
    }
    if (deleteProductButton) deleteProduct(deleteProductButton.dataset.deleteProduct);
    if (toggleFeaturedProduct) toggleProductPlacement(toggleFeaturedProduct.dataset.toggleFeaturedProduct, "is_featured");
    if (toggleMarqueeProduct) toggleProductPlacement(toggleMarqueeProduct.dataset.toggleMarqueeProduct, "show_in_marquee");
    if (editNews) {
      const item = state.news.find((post) => String(post.id) === String(editNews.dataset.editNews));
      if (item) fillNewsForm(item);
    }
    if (deleteNewsButton) deleteNews(deleteNewsButton.dataset.deleteNews);
  });
}

function closeAdminMenu() {
  document.body.classList.remove("admin-menu-open");
  $("[data-admin-menu-toggle]")?.setAttribute("aria-expanded", "false");
}

function setupWorkspaceNavigation() {
  $("[data-admin-menu-toggle]")?.addEventListener("click", () => {
    const open = document.body.classList.toggle("admin-menu-open");
    $("[data-admin-menu-toggle]")?.setAttribute("aria-expanded", String(open));
  });
  $("[data-admin-menu-close]")?.addEventListener("click", closeAdminMenu);
  $$('[data-product-view]').forEach((button) => {
    button.addEventListener("click", () => setProductView(button.dataset.productView));
  });
  document.addEventListener("click", (event) => {
    const pageButton = event.target.closest("[data-page-type]");
    if (!pageButton || pageButton.disabled) return;
    const page = Number(pageButton.dataset.pageValue || 1);
    if (pageButton.dataset.pageType === "product") {
      state.productPage = page;
      renderProducts();
    } else {
      state.newsPage = page;
      renderNews();
    }
    pageButton.closest(".content-library")?.scrollIntoView({ behavior: "smooth", block: "start" });
  });
  setProductView("library", { scroll: false });
}

function initDefaults() {
  const newsForm = $("[data-news-form]");
  if (newsForm && !newsForm.published_at.value) {
    newsForm.published_at.value = new Date().toISOString().slice(0, 10);
  }
  fillProductForm(null);
  setProductView("library", { scroll: false });
  fillNewsForm(null);
}

setupLogin();
setupProChrome();
setupTabs();
setupWorkspaceNavigation();
setupProductEditor();
setupNewsEditor();
setupFormIntelligence();
setupSearch();
setupFilters();
setupListActions();
setupInquiries();
initDefaults();
loadContent();
