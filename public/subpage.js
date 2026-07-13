import { FALLBACK_PAGE, PRODUCT_DETAILS, SUBPAGES } from "./subpage-data.js";
import { DEFAULT_NEWS, DEFAULT_PRODUCTS } from "./content-seed.js";
import CONTACT from "./contact-config.js";

const params = new URLSearchParams(window.location.search);
const lang = localStorage.getItem("panhiro.site.lang.v2") || localStorage.getItem("panhiro.site.lang") || "zh";
const storeKeys = {
  products: "panhiro.cnryce.products.v2",
  news: "panhiro.cnryce.news.v2"
};
const aliases = {
  ph0995: "ph-0995"
};
const requested = aliases[params.get("page")] || params.get("page") || FALLBACK_PAGE;
const legacyProductPages = new Set(["products", "vk-y1", "vk-1010-p4", "vk-1011", "ph-0885", "ph-0995", "p4-p5"]);
const PRODUCT_CATEGORY_ZH = {
  "Washing Machine": "清洗机",
  "car washing series": "洗车机系列",
  "Car Washing T Series": "T 系列洗车机",
  "Industrial Series": "工业系列",
  "Permanent Magnet Series": "永磁系列",
  "RY Series": "工业系列",
  "PW Series": "永磁系列",
  "Vacuum Cleaner": "吸尘器",
  "Washer Plunger Pumps": "清洗机柱塞泵",
  "Washer Pressure Pipe": "清洗机高压管",
  "Spray Gun For Cleaning": "清洗喷枪",
  "Foam Gun": "泡沫枪",
  "Washer Adapter": "清洗机转接头"
};
const PRODUCT_TERM_TRANSLATIONS = [
  ["high pressure drain pipe cleaner machine", "高压管道疏通清洗机"],
  ["high pressure car washer machine", "高压洗车机"],
  ["high pressure cleaning machine", "高压清洗机"],
  ["high pressure washer pump head", "高压清洗机泵头"],
  ["washer plunger pump", "清洗机柱塞泵"],
  ["triplex plunger pump", "三缸柱塞泵"],
  ["commercial pressure washer", "商用高压清洗机"],
  ["industrial pressure washer", "工业高压清洗机"],
  ["portable commercial high pressure washer", "便携商用高压清洗机"],
  ["portable household high pressure washer", "便携家用高压清洗机"],
  ["handheld commercial high pressure washer", "手持商用高压清洗机"],
  ["handheld high pressure jet spray cleaner", "手持高压喷射清洗机"],
  ["handheld high power industrial vacuum cleaner", "手持大功率工业吸尘器"],
  ["industrial vacuum cleaner", "工业吸尘器"],
  ["vacuum cleaner", "吸尘器"],
  ["woodworking dust collector", "木工集尘器"],
  ["dust collector", "集尘器"],
  ["foam blaster", "泡沫喷壶"],
  ["foam spray gun", "泡沫喷枪"],
  ["foam gun", "泡沫枪"],
  ["water spray gun", "水枪"],
  ["spray gun", "喷枪"],
  ["high pressure gun", "高压喷枪"],
  ["high pressure hose", "高压软管"],
  ["sewer cleaning hose", "管道疏通软管"],
  ["hydraulic hose", "液压软管"],
  ["garden hose", "花园水管"],
  ["quick connector", "快接头"],
  ["threaded pipe fittings", "螺纹管件"],
  ["hose adapter", "软管转接头"],
  ["washer adapter", "清洗机转接头"],
  ["connector", "接头"],
  ["adapter", "转接头"],
  ["pump head", "泵头"],
  ["pump", "泵"],
  ["high pressure washer", "高压清洗机"],
  ["pressure washer", "高压清洗机"],
  ["car washer", "洗车机"],
  ["high pressure", "高压"],
  ["cleaning machine", "清洗机"],
  ["cleaner machine", "清洗机"],
  ["cleaner", "清洁设备"],
  ["washing equipment", "清洗设备"],
  ["washing machine", "清洗机"],
  ["portable", "便携式"],
  ["handheld", "手持式"],
  ["hand-held", "手持式"],
  ["commercial", "商用"],
  ["industrial", "工业"],
  ["household", "家用"],
  ["electric", "电动"],
  ["gasoline", "汽油"],
  ["diesel", "柴油"],
  ["automatic", "自动"],
  ["permanent magnet", "永磁"],
  ["induction motor", "感应电机"],
  ["copper winding", "铜线电机"],
  ["brass", "黄铜"],
  ["stainless steel", "不锈钢"],
  ["flexible", "柔性"],
  ["heavy duty", "重型"],
  ["heavy-duty", "重型"],
  ["new design", "新款设计"],
  ["new model", "新款"],
  ["professional", "专业"],
  ["small size", "小型"],
  ["multi-functional", "多功能"],
  ["fully automatic shutdown", "全自动停机"],
  ["automatic shutdown", "自动停机"],
  ["pure copper", "纯铜"],
  ["cold water", "冷水"],
  ["water cleaning", "水清洁"],
  ["cleaning washer", "清洗机"],
  ["taizhou factory", "台州工厂"]
];
const SPEC_LABELS_ZH = {
  Category: "分类",
  Power: "功率",
  Pressure: "压力",
  Flow: "流量"
};

if (legacyProductPages.has(requested)) {
  window.location.replace("/product.html");
}

const $ = (selector, root = document) => root.querySelector(selector);

function escapeHTML(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function parseSpecs(specs) {
  if (!specs) return {};
  if (typeof specs === "object") return specs;
  try {
    return JSON.parse(specs);
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

async function readJson(path) {
  const response = await fetch(path, { cache: "no-store" });
  if (!response.ok) throw new Error(`Request failed: ${response.status}`);
  return response.json();
}

async function loadManagedContent() {
  const isStaticPreview = location.protocol === "file:" || ["5173", "5174"].includes(location.port);
  const [productsResult, newsResult] = isStaticPreview
    ? [{ status: "rejected" }, { status: "rejected" }]
    : await Promise.allSettled([readJson("/api/products"), readJson("/api/news")]);

  return {
    products: productsResult.status === "fulfilled"
      ? productsResult.value.products
      : readLocal(storeKeys.products, DEFAULT_PRODUCTS),
    news: newsResult.status === "fulfilled"
      ? newsResult.value.news
      : readLocal(storeKeys.news, DEFAULT_NEWS)
  };
}

function categoryLabel(category) {
  return {
    "RY Series": "Industrial Series",
    "PW Series": "Permanent Magnet Series"
  }[category] || category;
}

function hasChinese(value) {
  return /[\u4e00-\u9fff]/.test(String(value || ""));
}

function productCategoryLabel(category) {
  if (lang !== "zh") return categoryLabel(category);
  return PRODUCT_CATEGORY_ZH[category] || PRODUCT_CATEGORY_ZH[categoryLabel(category)] || category;
}

function translateProductCopy(value) {
  let text = String(value || "");
  if (!text || hasChinese(text)) return text;
  PRODUCT_TERM_TRANSLATIONS.forEach(([source, target]) => {
    text = text.replace(new RegExp(source.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi"), target);
  });
  return text
    .replace(/\bfor\b/gi, "适用于")
    .replace(/\bwith\b/gi, "配备")
    .replace(/\band\b/gi, "和")
    .replace(/\bnew\b/gi, "新款")
    .replace(/\s+/g, " ")
    .replace(/\s*([，。；：、])\s*/g, "$1")
    .trim();
}

function localizeSpecs(specs) {
  if (lang !== "zh") return specs;
  return Object.fromEntries(Object.entries(specs).map(([key, value]) => [
    SPEC_LABELS_ZH[key] || translateProductCopy(key),
    translateProductCopy(value)
  ]));
}

function localizedField(item, field, fallback = "") {
  const value = item?.[field] ?? fallback;
  if (lang === "zh") {
    const zhValue = item?.[`${field}_zh`];
    if (zhValue) return zhValue;
    return hasChinese(value) ? value : translateProductCopy(value);
  }
  return item?.[`${field}_en`] || value || item?.[`${field}_zh`] || fallback;
}

function localizeProduct(product) {
  if (lang !== "zh") {
    return {
      ...product,
      category: categoryLabel(product.category),
      tagline: displayTagline(product),
      specs: product.specs
    };
  }
  return {
    ...product,
    name: localizedField(product, "name"),
    category: product.category_zh || productCategoryLabel(product.category),
    tagline: /CNRYCE product catalog/i.test(product.tagline || "")
      ? (product.tagline_zh || categoryTagline(product.category))
      : localizedField(product, "tagline", categoryTagline(product.category)),
    description: localizedField(product, "description"),
    specs: Object.keys(product.specs_zh || {}).length ? product.specs_zh : localizeSpecs(product.specs)
  };
}

function categoryTagline(category) {
  const lines = {
    en: {
      "car washing series": "Suitable for vehicle washing, yard cleaning, retail cleaning and daily high pressure cleaning tasks.",
      "Car Washing T Series": "Portable high pressure cleaning equipment for home, shop and mobile cleaning needs.",
      "RY Series": "Industrial Series for frequent use with balanced pressure output and operating convenience.",
      "PW Series": "Permanent Magnet Series for commercial cleaning and heavier-duty washing tasks.",
      "Vacuum Cleaner": "Suitable for workshops, stores, woodworking dust and floor cleaning tasks.",
      "Washer Plunger Pumps": "Core plunger pump components for maintenance, assembly and bulk supporting supply.",
      "Washer Pressure Pipe": "High pressure hose and extension pipe accessories for washing, unclogging and connection work.",
      "Spray Gun For Cleaning": "Spray gun and lance accessories that improve angle coverage and cleaning efficiency.",
      "Foam Gun": "Foam spraying accessories for car washing, pre-wash and even detergent coverage.",
      "Washer Adapter": "Adapters and connectors for matching different hoses, spray guns and washer units."
    },
    zh: {
      "car washing series": "适用于车辆清洗、庭院冲洗、门店保洁和日常高压清洁场景。",
      "Car Washing T Series": "便携高压清洗设备，适合家庭、门店和移动清洗需求。",
      "RY Series": "Industrial Series 面向高频使用的清洗机系列，兼顾压力表现与操作便利性。",
      "PW Series": "Permanent Magnet Series 面向商用清洗与重污冲洗场景，适合更高强度的清洁任务。",
      "Vacuum Cleaner": "适用于车间、门店、木工粉尘和地面清洁等吸尘需求。",
      "Washer Plunger Pumps": "清洗机核心泵类配件，适合维修、装配与批量配套。",
      "Washer Pressure Pipe": "高压管路与延长管配件，覆盖冲洗、疏通和连接场景。",
      "Spray Gun For Cleaning": "喷枪与喷杆配件，提升冲洗角度、覆盖范围和操作效率。",
      "Foam Gun": "泡沫喷洒配件，适合洗车、预洗和清洁剂均匀覆盖。",
      "Washer Adapter": "转接头与连接件，便于不同软管、喷枪和清洗机配套。"
    }
  };
  return lines[lang]?.[category] || (lang === "en"
    ? "Cleaning equipment and supporting products for channel sales, bulk purchase and custom cooperation."
    : "清洗设备与配套产品，适合渠道销售、批量采购和定制合作。");
}

function displayTagline(product) {
  return /CNRYCE product catalog/i.test(product.tagline || "")
    ? categoryTagline(product.category)
    : product.tagline || categoryTagline(product.category);
}

function counterMarkup(value) {
  const text = String(value ?? "");
  const match = text.match(/^(\d+)(.*)$/);
  if (!match || /-/.test(text)) return `<strong>${escapeHTML(text)}</strong>`;
  return `<strong data-counter="${escapeHTML(match[1])}" data-counter-suffix="${escapeHTML(match[2])}">${escapeHTML(text)}</strong>`;
}

function setText(selector, value) {
  document.querySelectorAll(selector).forEach((element) => {
    element.textContent = value;
  });
}

function setMeta(selector, value) {
  const element = $(selector);
  if (element && value) element.setAttribute("content", value);
}

const managedContent = await loadManagedContent();
const products = managedContent.products.map((product) => ({
  ...product,
  specs: parseSpecs(product.specs),
  specs_zh: parseSpecs(product.specs_zh),
  published: Number(product.published ?? 1)
})).filter((product) => product.published);
const newsPosts = managedContent.news
  .map((post) => ({
    ...post,
    published: Number(post.published ?? 1)
  }))
  .filter((post) => post.published);
const currentProduct = products.find((product) => product.slug === requested || String(product.id) === requested);
const currentArticle = newsPosts.find((post) => post.slug === requested || String(post.id) === requested);

const newsTranslations = {
  "panhiro-company-profile": {
    title: "Taizhou Panhiro Electromechanical Co., Ltd. Founded in 2009",
    category: "Company News",
    excerpt: "Panhiro is a professional manufacturer focused on R&D, production and sales of cleaning equipment.",
    content: "Founded in 2009, Taizhou Panhiro Electromechanical Co., Ltd. is located in Wenling, Taizhou, Zhejiang. Leveraging the local pump and motor supply chain, the company continues to strengthen professional manufacturing, standardized quality control and digital operations."
  },
  "panhiro-cnryce-product-catalog": {
    title: "Panhiro Product Catalog Has Been Systematically Organized",
    category: "Product Updates",
    excerpt: "The Panhiro catalog covers high pressure washers, vacuum cleaners, pumps, hoses, spray guns, foam guns and adapters for fast sourcing decisions.",
    content: "Panhiro continues to improve its product materials by organizing complete machines, accessories and consumables by application scenario and product type, helping distributors, bulk buyers and brand clients quickly understand available products, configuration directions and key cooperation points."
  },
  "panhiro-factory-strength": {
    title: "Building Long-Term Delivery Capability on Wenling's Pump and Motor Supply Chain",
    category: "Company Strength",
    excerpt: "Panhiro is based in the core pump and motor cluster of Daxi Town, where upstream and downstream support is complete.",
    content: "This industrial ecosystem makes sourcing key components, developing samples, assembling, testing and batch delivery easier to coordinate. Panhiro keeps strengthening quality management and response capability while improving modern operations and digital management."
  }
};
const defaultNewsBySlug = new Map(DEFAULT_NEWS.map((post) => [post.slug, post]));

const subpageTranslations = {
  "company-profile": {
    group: "About Us",
    title: "Company Profile",
    summary: "Founded in 2009, Taizhou Panhiro Electromechanical Co., Ltd. is a professional manufacturer focused on the development, production and sales of cleaning equipment.",
    sectionTitle: "Rooted in the Wenling pump and motor cluster, focused on cleaning equipment manufacturing",
    description: "Located in Wenling, Taizhou, Zhejiang, Panhiro benefits from a mature local pump and motor supply chain. With high pressure washers at the core, we serve home, industrial and car washing markets with stable product supply and cooperation support for more than 60 countries and regions.",
    points: [
      "Founded in 2009 with a long-term focus on cleaning equipment manufacturing",
      "Core products include household washers, industrial washers, high pressure washers and car wash equipment",
      "Built on the principles of quality first, integrity and long-term reputation"
    ],
    cards: [
      ["01", "Cleaning Equipment Focus", "High pressure washers are the core product line, supported by home, industrial and car washing applications."],
      ["02", "Industrial Supply Support", "Panhiro is based in the core Wenling pump and motor cluster with complete upstream and downstream support."],
      ["03", "Long-Term Cooperation", "We value quality management, customer support and product documentation for channel, bulk and overseas business."]
    ]
  },
  "company-strength": {
    group: "About Us",
    title: "Company Strength",
    summary: "Supported by the Wenling pump and motor industry cluster, Panhiro continues to strengthen R&D, manufacturing, quality control and delivery capability around cleaning equipment.",
    sectionTitle: "Industrial coordination, product range and dependable delivery capability",
    description: "Panhiro is based in the core pump and motor industrial zone of Wenling, Zhejiang. Centered on high pressure washing machines, the product range extends to home and industrial cleaning, motors, pumps and related equipment, forming a complete chain from development to production and sales support.",
    points: [
      "Complete local pump and motor supply support for development, sourcing, assembly and delivery",
      "Product coverage includes household washers, industrial washers, car wash equipment, motors and pumps",
      "Quality management, service response and digital operations are developed together"
    ],
    cards: [
      ["01", "Industrial Foundation", "Located in the Wenling pump and motor cluster, Panhiro has strong support for product development and batch delivery."],
      ["02", "Product Matrix", "High pressure washers are supported by car wash equipment, motors, pumps and related cleaning products."],
      ["03", "Quality Operation", "The company builds long-term trust through standardized management, product iteration and customer support."]
    ]
  },
  products: {
    group: "Product Center",
    title: "Product Overview",
    summary: "Panhiro follows the reference site category structure directly, presenting complete machines, pumps, hoses and accessories in a clearer catalog.",
    sectionTitle: "Complete machines and accessories presented by reference categories",
    description: "Instead of relying on self-defined categories, Panhiro organizes the catalog directly by the reference site structure so buyers can evaluate product lines, scenarios and supporting accessories faster.",
    points: [
      "Complete machine categories include Washing Machine, car washing series, Car Washing T Series, Industrial Series and Permanent Magnet Series",
      "Accessory categories include Vacuum Cleaner, Washer Plunger Pumps, Washer Pressure Pipe, Spray Gun For Cleaning, Foam Gun and Washer Adapter",
      "Buyers can filter by category for channel selection, replenishment and quotation preparation"
    ],
    cards: [
      ["01", "Complete Machines", "Product lines are presented by the reference site structure so buyers can locate target models quickly."],
      ["02", "Accessories", "Pumps, hoses, spray guns, foam guns and adapters are organized separately for supporting purchase."],
      ["03", "Bulk Inquiry", "The catalog is built for distributor selection, bulk purchase and customized cooperation."]
    ]
  },
  service: {
    group: "Service Support",
    title: "Service Overview",
    summary: "Panhiro provides product files, installation guidance, after-sales videos, download materials and fast response support.",
    sectionTitle: "Help customers buy with clarity and use with confidence",
    description: "Service support follows the real customer journey: files before purchase, installation and maintenance after delivery, and spare parts or troubleshooting during long-term use.",
    points: [
      "Product catalogs, specification sheets and promotional materials can be prepared for sales communication",
      "Installation, maintenance and FAQ content helps reduce service communication cost",
      "Spare parts, repair notes and distributor support can be coordinated by region and order"
    ],
    cards: [
      ["01", "Product Materials", "Catalogs, parameters, photos and sales documents help purchasing and channel communication."],
      ["02", "After-Sales Guidance", "Installation videos, maintenance notes and common issue answers help customers start faster."],
      ["03", "Repair Support", "Clear contact paths for parts, maintenance and service requests help long-term use."]
    ]
  },
  "service-video": {
    group: "Service Support",
    title: "After-Sales Videos",
    summary: "Installation demonstrations, maintenance tutorials and troubleshooting videos help customers learn equipment usage faster.",
    sectionTitle: "Installation, maintenance and troubleshooting made easier",
    description: "Video support can cover first-time setup, hose connection, nozzle selection, pressure adjustment, routine maintenance and common issue checks.",
    points: [
      "New machine setup: unpacking, water connection, power connection and trial operation",
      "Daily maintenance: nozzle cleaning, hose checking, pump care and storage",
      "Troubleshooting: no water output, insufficient pressure and abnormal stop cases"
    ],
    cards: [
      ["01", "New Setup", "Step-by-step content helps users connect water, power, spray guns and accessories correctly."],
      ["02", "Routine Care", "Maintenance videos reduce repeated explanations for distributors and end users."],
      ["03", "Issue Checking", "Short videos can explain common problems and make support more efficient."]
    ]
  },
  "service-download": {
    group: "Service Support",
    title: "Download Center",
    summary: "Get product manuals, specification sheets, catalogs, installation instructions and sales materials in one place.",
    sectionTitle: "Centralized documents for faster purchasing communication",
    description: "The download center is designed for distributors, purchasing teams and end users who need product manuals, model sheets, catalogs and after-sales documents before making decisions.",
    points: [
      "Catalog files for product range, model positioning and application scenarios",
      "Specification sheets for pressure, flow, power, accessories and packaging information",
      "After-sales files for installation, maintenance and common issue handling"
    ],
    cards: [
      ["01", "Product Manuals", "Used to understand product lines, model positioning and main selling points quickly."],
      ["02", "Specification Sheets", "Useful for purchasing comparison, ecommerce listing and internal model selection."],
      ["03", "Service Documents", "Support installation, maintenance, repair and customer service workflows."]
    ]
  },
  contact: {
    group: "Contact Us",
    title: "Contact Us",
    summary: "Contact Panhiro by email for product selection, bulk orders, distributor cooperation, custom projects and after-sales support.",
    sectionTitle: "Tell us your requirement and get the right solution",
    description: "To prepare matching products and quotations faster, please share your target market, model, quantity, voltage or plug requirement, use case and contact details.",
    points: [
      "Email: sales@panhiro.net",
      "Product files and quotation: panchen@panhiro.net",
      "Product inquiry: model, parameters, accessories, videos and image files",
      "Cooperation inquiry: distributor cooperation, bulk purchase and customized projects",
      "After-sales inquiry: installation, maintenance, parts and repair support"
    ],
    cards: [
      ["01", "Selection Support", "We recommend suitable models according to your use case and budget."],
      ["02", "Product Files", "Catalogs, specification sheets, images, videos and configuration notes can be prepared."],
      ["03", "Cooperation Follow-Up", "We keep communication clear around quantity, lead time, packaging, customization and service requirements."]
    ]
  }
};

function localizeNews(post) {
  if (lang === "zh" && (post.title_zh || post.excerpt_zh || post.content_zh)) {
    return {
      ...post,
      title: post.title_zh || post.title,
      category: post.category_zh || post.category,
      excerpt: post.excerpt_zh || post.excerpt,
      content: post.content_zh || post.content
    };
  }
  if (lang === "en" && (post.title_en || post.excerpt_en || post.content_en)) {
    return {
      ...post,
      title: post.title_en || post.title,
      category: post.category_en || post.category,
      excerpt: post.excerpt_en || post.excerpt,
      content: post.content_en || post.content
    };
  }
  if (lang !== "en") return post;
  const translated = newsTranslations[post.slug];
  const original = defaultNewsBySlug.get(post.slug);
  const usesDefaultCopy = original && ["title", "category", "excerpt", "content"].every((key) => {
    return String(post[key] ?? "").trim() === String(original[key] ?? "").trim();
  });
  return translated && usesDefaultCopy ? { ...post, ...translated } : post;
}

function localizeSubpage(pageKey, source) {
  if (lang !== "en") return source;
  const translated = subpageTranslations[pageKey];
  return translated ? { ...source, ...translated } : source;
}

const pageKey = SUBPAGES[requested] ? requested : currentProduct || currentArticle ? requested : FALLBACK_PAGE;
const article = currentArticle ? localizeNews(currentArticle) : null;
const productDetail = currentProduct ? localizeProduct(currentProduct) : null;
const data = currentProduct
  ? {
      group: lang === "en" ? "Product Center" : "产品中心",
      title: productDetail.name,
      summary: productDetail.tagline,
      code: productDetail.category,
      image: currentProduct.image_url,
      imageAlt: productDetail.name,
      sectionTitle: productDetail.name,
      description: productDetail.description,
      points: Object.entries(productDetail.specs).map(([key, value]) => `${key}: ${value}`),
      cards: lang === "en"
        ? [
            ["01", productDetail.category, "This product has been imported according to the reference site category structure and the image has been downloaded to the local asset directory."],
            ["02", "Product Files", "Detailed specifications, application scenarios, packaging information and inquiry notes can continue to be managed from the admin panel."],
            ["03", "Contact", "For quotations or product files, please contact sales@panhiro.net."]
          ]
        : [
            ["01", productDetail.category, "该产品已按参考站产品分类导入，图片已下载到本地静态资源目录。"],
            ["02", "产品资料", "可继续在后台补充详细参数、应用场景、包装信息和询盘说明。"],
            ["03", "联系方式", "需要报价或产品资料时，可通过 sales@panhiro.net 联系。"]
          ]
    }
  : article
  ? {
      group: lang === "en" ? "News Center" : "新闻中心",
      title: article.title,
      summary: article.excerpt,
      code: article.category,
      image: article.image_url,
      imageAlt: article.title,
      sectionTitle: article.title,
      description: article.excerpt,
      points: lang === "en"
        ? [`Category: ${article.category}`, `Published: ${article.published_at}`, "For additional files, please contact the Panhiro sales team."]
        : [`分类：${article.category}`, `发布日期：${article.published_at}`, "如需进一步资料，可联系 Panhiro 销售团队。"],
      cards: lang === "en"
        ? [
            ["01", "Category", article.category],
            ["02", "Publish Date", article.published_at],
            ["03", "Contact", "Product files, factory materials and cooperation information are available via sales@panhiro.net."]
          ]
        : [
            ["01", "新闻分类", article.category],
            ["02", "发布时间", article.published_at],
            ["03", "联系咨询", "产品目录、工厂资料和合作信息可通过 sales@panhiro.net 获取。"]
          ]
    }
  : localizeSubpage(pageKey, SUBPAGES[pageKey]);

function setPageMeta() {
  const siteName = lang === "en" ? "Panhiro Cleaning Equipment" : "磐宏清洗设备";
  const title = `${data.title} | ${siteName}`;
  const description = data.summary || data.description;
  document.documentElement.lang = lang === "en" ? "en" : "zh-CN";
  document.title = title;
  setMeta('meta[name="description"]', description);
  setMeta('meta[property="og:title"]', title);
  setMeta('meta[property="og:description"]', description);
  setMeta('meta[property="og:image"]', new URL(data.image, location.origin).href);
}

function renderBase() {
  setPageMeta();
  document.body.classList.toggle("is-article-page", Boolean(article));
  $(".brand")?.setAttribute("aria-label", lang === "en" ? "Panhiro home" : "磐宏首页");
  const activeLink = Array.from(document.querySelectorAll(".site-nav a")).find(
    (link) => link.getAttribute("href") === `/subpage.html?page=${pageKey}`
  );
  activeLink?.setAttribute("aria-current", "page");
  setText(".breadcrumb a", lang === "en" ? "Home" : "首页");
  setText("[data-subpage-group]", data.group);
  setText("[data-subpage-title]", data.title);
  setText("[data-subpage-summary]", data.summary);
  setText("[data-subpage-code]", data.code);
  setText("[data-subpage-section-title]", data.sectionTitle);
  setText("[data-subpage-description]", data.description);

  const image = $("[data-subpage-image]");
  if (image) {
    image.src = data.image;
    image.alt = data.imageAlt || data.title;
  }

  const points = $("[data-subpage-points]");
  if (points) {
    points.innerHTML = (data.points || []).map((point) => `<li>${escapeHTML(point)}</li>`).join("");
  }

  const cards = $("[data-subpage-cards]");
  if (cards) {
    cards.innerHTML = (data.cards || [])
      .map(
        ([index, title, text]) => `
          <article>
            <span>${escapeHTML(index)}</span>
            <h3>${escapeHTML(title)}</h3>
            <p>${escapeHTML(text)}</p>
          </article>
        `
      )
      .join("");
  }

  if (article) {
    $(".subpage-content")?.remove();
  }
}

function renderProductDetail(root) {
  const detail = currentProduct
    ? {
        badge: productDetail.category,
        heroImage: currentProduct.image_url,
        gallery: [currentProduct.image_url],
        specs: Object.entries(productDetail.specs).map(([key, value]) => `${key}: ${value}`),
        scene: productDetail.description
      }
    : PRODUCT_DETAILS[pageKey];

  if (!detail) return;

  root.insertAdjacentHTML(
    "beforeend",
    `
      <section class="product-detail-page">
        <div class="product-detail-hero">
          <div class="product-detail-copy">
            <p class="eyebrow">${escapeHTML(categoryLabel(detail.badge))}</p>
            <h2>${escapeHTML(data.title)} ${lang === "en" ? "Product Display" : "产品展示"}</h2>
            <p>${escapeHTML(detail.scene)}</p>
            <div class="product-detail-specs">
              ${detail.specs.map((spec) => `<span>${escapeHTML(spec)}</span>`).join("")}
            </div>
            <a class="btn primary" href="/subpage.html?page=contact">${lang === "en" ? "Request This Model" : "咨询该型号"}</a>
          </div>
          <div class="product-detail-visual">
            <img src="${escapeHTML(detail.heroImage)}" alt="${escapeHTML(data.title)}" />
          </div>
        </div>
        <div class="product-gallery-grid">
          ${detail.gallery
            .map(
              (src, index) => `
                <article>
                  <span>${String(index + 1).padStart(2, "0")}</span>
                  <img src="${escapeHTML(src)}" alt="${escapeHTML(data.title)} ${index + 1}" />
                </article>
              `
            )
            .join("")}
        </div>
      </section>
    `
  );
}

function renderProfile(root) {
  if (!data.profile) return;

  const stats = lang === "en"
    ? [["2009", "Founded"], ["10000㎡", "Site Area"], ["60+", "Countries Served"], ["50-200", "Employees"]]
    : data.profile.stats;
  const facts = lang === "en"
    ? [
        ["Company", "Taizhou Panhiro Electromechanical Co., Ltd."],
        ["Location", "Houwayu Industrial Zone, Daxi Town, Wenling, Taizhou, Zhejiang"],
        ["Industrial Base", "Core zone of the Wenling pump and motor cluster with strong upstream and downstream support"],
        ["Contact", "+86 13197228342 / Contact: Pan Chen"]
      ]
    : data.profile.facts;
  const sections = lang === "en"
    ? [
        {
          kicker: "Core Products",
          title: "A product matrix built around cleaning equipment",
          text: "Panhiro centers on high pressure washers while also covering motors, pumps, vacuum devices and related equipment for both household and industrial applications.",
          chips: ["High Pressure Washers", "Car Wash Equipment", "Motors & Pumps", "Industrial Cleaning"]
        },
        {
          kicker: "Quality & Culture",
          title: "Quality first, reputation first",
          text: "The company continues to strengthen quality systems and customer trust through product iteration, service response and standardized management.",
          chips: ["Quality First", "Integrity", "Reputation", "Management"]
        },
        {
          kicker: "Future Direction",
          title: "Professional manufacturing with digital operations",
          text: "Panhiro keeps expanding core cleaning equipment business while supporting overseas growth through digital marketing, e-commerce and broader product collaboration.",
          chips: ["Manufacturing", "Digital Operations", "Overseas Growth", "Multi-Product Support"]
        }
      ]
    : data.profile.sections;

  root.insertAdjacentHTML(
    "beforeend",
    `
      <section class="company-profile-detail">
        <div class="company-profile-header">
          <p class="eyebrow">${lang === "en" ? "COMPANY PROFILE" : "企业档案"}</p>
          <h2>${lang === "en" ? "A clear view of manufacturing foundations, product range and cooperation capability" : "把制造基础、产品矩阵和合作能力讲清楚"}</h2>
          <p>${lang === "en" ? "The following sections reorganize Panhiro's company profile so visitors can quickly understand the business background, core product lines and long-term direction." : "以下内容根据公司简介资料重新整理，便于访客快速理解磐宏的企业背景、主营业务和发展方向。"}</p>
        </div>
        <div class="company-stat-grid">
          ${stats.map(([value, label]) => `<article>${counterMarkup(value)}<span>${escapeHTML(label)}</span></article>`).join("")}
        </div>
        <div class="company-fact-panel">
          ${facts.map(([label, value]) => `<div><span>${escapeHTML(label)}</span><strong>${escapeHTML(value)}</strong></div>`).join("")}
        </div>
        <div class="company-story-grid">
          ${sections
            .map(
              (item) => `
                <article>
                  <small>${escapeHTML(item.kicker)}</small>
                  <h3>${escapeHTML(item.title)}</h3>
                  <p>${escapeHTML(item.text)}</p>
                  <div>${item.chips.map((chip) => `<span>${escapeHTML(chip)}</span>`).join("")}</div>
                </article>
              `
            )
            .join("")}
        </div>
      </section>
    `
  );
}

function renderStrength(root) {
  if (!data.strength) return;

  const stats = lang === "en"
    ? [["50-200", "Employees"], ["10000㎡", "Site Area"], ["Pumps & Motors", "Industrial Cluster"], ["60+", "Countries Covered"]]
    : data.strength.stats;
  const pillars = lang === "en"
    ? [
        ["01", "Supply Chain Coordination", "Located in the core Wenling pump and motor cluster, Panhiro benefits from strong industrial foundations and complete upstream and downstream support."],
        ["02", "Product Development", "Centered on high pressure washers while extending to motors, pumps and related cleaning equipment for multiple buying scenarios."],
        ["03", "Quality Management", "Long-term attention to product stability, service response and reputation helps support reliable delivery."],
        ["04", "Team & Operations", "Manufacturing experience is now combined with digital operations, e-commerce content and market expansion capabilities."]
      ]
    : data.strength.pillars;
  const process = lang === "en"
    ? [
        ["Product Development", "Develop new models around the core cleaning equipment business while extending into motors, pumps and general-purpose equipment."],
        ["Production & Assembly", "Rely on local industrial infrastructure and supply coordination to improve assembly, testing and batch delivery efficiency."],
        ["Quality Control", "Strengthen product stability and service responsiveness through standardized management and market-proven quality."],
        ["Market Expansion", "Combine import-export capability and digital operations to keep serving customers across more than 60 countries and regions."]
      ]
    : data.strength.process;

  root.insertAdjacentHTML(
    "beforeend",
    `
      <section class="company-strength-detail">
        <div class="strength-hero-panel">
          <p class="eyebrow">${lang === "en" ? "CAPABILITY STRUCTURE" : "实力结构"}</p>
          <h2>${lang === "en" ? "From industrial supply advantage to digital operations, building a dependable delivery chain" : "从产业带优势到数字化运营，形成稳定交付链路"}</h2>
          <p>${lang === "en" ? "True company strength is reflected not only in machine parameters, but also in supply support, product range, quality control, team execution and market development." : "企业实力不只体现在单一设备参数上，也体现在产业配套、产品矩阵、质量管理、团队运营和市场拓展的连续能力。"}</p>
        </div>
        <div class="strength-metric-row">
          ${stats.map(([value, label]) => `<article>${counterMarkup(value)}<span>${escapeHTML(label)}</span></article>`).join("")}
        </div>
        <div class="strength-pillar-grid">
          ${pillars
            .map(
              ([index, title, text]) => `
                <article>
                  <span>${escapeHTML(index)}</span>
                  <h3>${escapeHTML(title)}</h3>
                  <p>${escapeHTML(text)}</p>
                </article>
              `
            )
            .join("")}
        </div>
        <div class="strength-process">
          <div>
            <p class="eyebrow">${lang === "en" ? "CAPABILITY FLOW" : "能力链路"}</p>
            <h3>${lang === "en" ? "Development, manufacturing, quality and market execution working together" : "研发、制造、质量与市场协同推进"}</h3>
          </div>
          <ol>
            ${process.map(([title, text]) => `<li><strong>${escapeHTML(title)}</strong><p>${escapeHTML(text)}</p></li>`).join("")}
          </ol>
        </div>
      </section>
    `
  );
}

function parseArticleImageBlock(block) {
  const match = String(block || "").trim().match(/^\[\[panhiro-image:(\{.*\})\]\]$/);
  if (!match) return null;
  try {
    const data = JSON.parse(match[1]);
    if (!data.src) return null;
    const allowedSizes = new Set(["small", "medium", "large", "full"]);
    const width = Number(data.width || 0);
    return {
      src: String(data.src),
      size: allowedSizes.has(data.size) ? data.size : "large",
      width: width ? Math.min(100, Math.max(25, width)) : "",
      caption: String(data.caption || "")
    };
  } catch {
    return null;
  }
}

function articleImageMarkup(image, index) {
  const widthStyle = image.width ? ` style="max-width: ${image.width}%"` : "";
  return `
    <figure class="article-inline-image article-inline-image--${escapeHTML(image.size)}"${widthStyle}>
      <img src="${escapeHTML(image.src)}" alt="${escapeHTML(image.caption || `${article.title} image ${index + 1}`)}" loading="lazy" />
      ${image.caption ? `<figcaption>${escapeHTML(image.caption)}</figcaption>` : ""}
    </figure>
  `;
}

function renderArticleContent(content, fallback) {
  const blocks = String(content || fallback || "")
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);

  return blocks.map((block, index) => {
    const image = parseArticleImageBlock(block);
    if (image) return articleImageMarkup(image, index);
    return `<p>${escapeHTML(block).replace(/\n/g, "<br />")}</p>`;
  }).join("");
}

function renderNewsArticle(root) {
  if (!article) return;
  const paragraphs = renderArticleContent(article.content, article.excerpt);

  root.insertAdjacentHTML(
    "beforeend",
    `
      <article class="news-detail-page">
        <div class="news-detail-shell">
          <div class="news-detail-meta">
            <span>${escapeHTML(article.category)}</span>
            <time datetime="${escapeHTML(article.published_at)}">${escapeHTML(article.published_at)}</time>
          </div>
          <h2>${escapeHTML(article.title)}</h2>
          <div class="news-detail-cover">
            <img src="${escapeHTML(article.image_url)}" alt="${escapeHTML(article.title)}" />
          </div>
          <div class="news-detail-content">
            ${paragraphs}
          </div>
          <div class="news-detail-actions">
            <a class="btn primary" href="/news.html">${lang === "en" ? "Back to News Center" : "返回新闻中心"}</a>
            <a class="btn dark" href="/subpage.html?page=contact">${lang === "en" ? "Contact Sales Team" : "联系销售团队"}</a>
          </div>
        </div>
      </article>
    `
  );
}

function renderContact(root) {
  if (pageKey !== "contact") return;

  const faqItems = lang === "en"
    ? [
        ["How do you ensure product quality?", "Each machine is inspected and tested individually before packing, followed by a final pre-shipment review."],
        ["How long is the warranty?", "The standard warranty is 6-12 months depending on the component grade and order configuration."],
        ["Can you use the customer's own brand?", "Yes. We support OEM and welcome ODM projects with custom branding, packaging and market-specific setup."],
        ["Do you keep stock?", "Regular models are often available in stock. Custom or bulk orders are confirmed according to the actual production schedule."],
        ["What is the lead time?", "Stock items can be shipped quickly. Custom or bulk orders usually take about 15 days in the off-season and about 30 days in the peak season."],
        ["Who should I contact?", `You can email ${CONTACT.emailSales} with the model, quantity and market requirement, and we will reply soon.`]
      ]
    : (data.faq || []);

  const faqMarkup = faqItems
    .map(
      ([question, answer]) => `
        <details class="faq-item" open>
          <summary>${escapeHTML(question)}</summary>
          <p>${escapeHTML(answer)}</p>
        </details>
      `
    )
    .join("");

  root.insertAdjacentHTML(
    "beforeend",
    `
      <section class="contact-detail-page">
        <div class="contact-detail-head">
          <p class="eyebrow">${lang === "en" ? "FULL CONTACT ACCESS" : "完整咨询入口"}</p>
          <h2>${lang === "en" ? "Email, phone and WeCom access in one page" : "邮箱、电话、企业微信，一页完成沟通"}</h2>
          <p>${lang === "en" ? `Please email ${CONTACT.emailSales} or ${CONTACT.emailGeneral} first with the model, quantity, market and configuration request. You can also call directly or scan the code for WeCom.` : `优先发送邮件到 ${CONTACT.emailSales} 或 ${CONTACT.emailGeneral}，写清型号、数量、市场和配置需求；也可以直接电话联系，或扫码添加企业微信。`}</p>
        </div>
        <div class="contact-detail-layout">
          <form class="contact-detail-form" data-inquiry-form>
            <input type="text" name="website" tabindex="-1" autocomplete="off" aria-hidden="true" class="form-hp" />
            <label>${lang === "en" ? "Name" : "姓名"}<input type="text" name="name" placeholder="${lang === "en" ? "Enter your name" : "请输入您的姓名"}" autocomplete="name" required /></label>
            <label>${lang === "en" ? "Company / Store" : "公司 / 门店"}<input type="text" name="company" placeholder="${lang === "en" ? "Enter company or store name" : "请输入公司或门店名称"}" autocomplete="organization" /></label>
            <label>${lang === "en" ? "Contact" : "联系方式"}<input type="text" name="contact" placeholder="${lang === "en" ? "Phone / WeChat / Email" : "电话 / 微信 / 邮箱均可"}" autocomplete="tel" required /></label>
            <label>${lang === "en" ? "Region" : "所在地区"}<input type="text" name="region" placeholder="${lang === "en" ? "Example: Taizhou, Zhejiang / Overseas market" : "例如：浙江台州 / 海外市场"}" /></label>
            <label>${lang === "en" ? "Product Interest" : "产品意向"}
              <select name="product">
                <option>Washing Machine</option>
                <option>car washing series</option>
                <option>Car Washing T Series</option>
                <option>Industrial Series</option>
                <option>Permanent Magnet Series</option>
                <option>Vacuum Cleaner</option>
                <option>Washer Plunger Pumps</option>
                <option>Washer Pressure Pipe</option>
                <option>Spray Gun For Cleaning</option>
                <option>Foam Gun</option>
                <option>Washer Adapter</option>
                <option>${lang === "en" ? "Full Product Catalog / Product Manual" : "全系列产品目录 / 产品手册"}</option>
                <option>${lang === "en" ? "After-Sales Videos / Parts / Service Support" : "售后视频 / 配件 / 维修咨询"}</option>
              </select>
            </label>
            <label>${lang === "en" ? "Cooperation Type" : "合作类型"}
              <select name="intent">
                <option>${lang === "en" ? "Product Selection" : "产品选型咨询"}</option>
                <option>${lang === "en" ? "Distributor Cooperation" : "渠道代理"}</option>
                <option>${lang === "en" ? "Bulk Purchase" : "批量采购"}</option>
                <option>OEM / ODM</option>
                <option>${lang === "en" ? "After-Sales Support" : "售后支持"}</option>
              </select>
            </label>
            <label class="wide">${lang === "en" ? "Requirement Details" : "需求说明"}<textarea name="message" rows="5" placeholder="${lang === "en" ? "Please describe quantity, voltage, plug type, market need, configuration request or service issue" : "请填写数量、电压、插头类型、市场需求、配置要求或售后问题"}"></textarea></label>
            <button class="btn primary" type="submit">${lang === "en" ? "Submit Inquiry" : "提交咨询"}</button>
            <p class="form-status" data-inquiry-status role="status" aria-live="polite"></p>
          </form>
          <div class="contact-channel-panel">
            <article class="contact-channel-card">
              <span>${lang === "en" ? "Email Inquiry" : "邮箱咨询"}</span>
              <a href="mailto:${CONTACT.emailSales}">${CONTACT.emailSales}</a>
              <p>${lang === "en" ? "Best for product lists, target markets, purchase quantities, voltage and plug requests, or customization needs." : "适合发送产品清单、目标市场、采购数量、电压插头要求和定制需求。"}</p>
            </article>
            <article class="contact-channel-card phone-card">
              <span>${lang === "en" ? "Phone Inquiry" : "电话咨询"}</span>
              <a href="tel:${CONTACT.phone}">${CONTACT.phoneDisplay}</a>
              <p>${lang === "en" ? "Best for urgent confirmation of product files, quotation direction, sample discussion or service issues." : "适合急需确认产品资料、报价方向、样机沟通或售后问题。"}</p>
            </article>
            <article class="contact-channel-card">
              <span>${lang === "en" ? "Direct Email" : "邮箱"}</span>
              <a href="mailto:${CONTACT.emailGeneral}">${CONTACT.emailGeneral}</a>
              <p>${lang === "en" ? "Send product models, quantities, target market, voltage, plug type and customization needs to this mailbox." : "请把型号、数量、目标市场、电压、插头类型和定制需求发送到这个邮箱。"}</p>
            </article>
            <article class="contact-channel-card qr-card">
              <span>${lang === "en" ? "WeCom" : "企业微信"}</span>
              <img src="/assets/contact-wecom-qr.jpg" alt="${lang === "en" ? "WeCom QR code" : "企业微信二维码"}" />
              <p>${lang === "en" ? "Scan to add WeCom and send product models, quantities, photos or videos." : "扫码添加企业微信，发送型号、数量、图片或视频资料。"}</p>
            </article>
          </div>
        </div>
      </section>
      <section class="section faq-section contact-faq-section">
        <div class="section-head">
          <p class="eyebrow">FAQ</p>
          <h2>${lang === "en" ? "Frequently Asked Questions" : "常见问题"}</h2>
          <p class="section-summary">${lang === "en" ? "We answer the most important questions about quality, warranty, branding, stock and delivery upfront." : "把客户最关心的质量、保修、品牌、库存和交付节奏先说清楚。"}</p>
        </div>
        <div class="faq-grid">
          ${faqMarkup}
        </div>
      </section>
    `
  );

  const form = $("[data-inquiry-form]");
  const status = $("[data-inquiry-status]");
  const isStaticPreview = location.protocol === "file:" || ["5173", "5174"].includes(location.port);

  const messages = {
    sending: lang === "en" ? "Submitting..." : "正在提交...",
    success: lang === "en"
      ? "Thank you. Your inquiry has been received and our sales team will reply soon."
      : "提交成功，我们已收到您的咨询，销售团队会尽快与您联系。",
    localSaved: lang === "en"
      ? "Saved in this local preview. It will submit to the server after deployment."
      : "已保存在本地预览中，部署上线后会真正提交到服务器。",
    error: lang === "en"
      ? "Submission failed. Please try again, or reach us by email or phone."
      : "提交失败，请稍后重试，或通过邮箱、电话直接联系我们。"
  };

  form?.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!status) return;

    const submitBtn = form.querySelector('button[type="submit"]');
    const formData = new FormData(form);
    const payload = {
      name: (formData.get("name") || "").toString().trim(),
      company: (formData.get("company") || "").toString().trim(),
      contact: (formData.get("contact") || "").toString().trim(),
      region: (formData.get("region") || "").toString().trim(),
      product: (formData.get("product") || "").toString().trim(),
      intent: (formData.get("intent") || "").toString().trim(),
      message: (formData.get("message") || "").toString().trim(),
      website: (formData.get("website") || "").toString().trim(),
      lang,
      source: "contact-page"
    };

    // 本地预览模式：不打接口，存到浏览器 localStorage，方便演示
    if (isStaticPreview) {
      const stored = JSON.parse(localStorage.getItem("panhiro.inquiries.preview") || "[]");
      stored.unshift({ ...payload, created_at: new Date().toISOString() });
      localStorage.setItem("panhiro.inquiries.preview", JSON.stringify(stored));
      status.textContent = messages.localSaved;
      status.dataset.tone = "success";
      form.reset();
      return;
    }

    status.textContent = messages.sending;
    status.dataset.tone = "info";
    if (submitBtn) submitBtn.disabled = true;

    try {
      const response = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      status.textContent = messages.success;
      status.dataset.tone = "success";
      form.reset();
    } catch (error) {
      status.textContent = messages.error;
      status.dataset.tone = "error";
    } finally {
      if (submitBtn) submitBtn.disabled = false;
    }
  });
}

function renderExtras() {
  const root = $("[data-subpage-extra]");
  if (!root) return;
  renderProductDetail(root);
  renderProfile(root);
  renderStrength(root);
  renderNewsArticle(root);
  renderContact(root);
}

renderBase();
renderExtras();
