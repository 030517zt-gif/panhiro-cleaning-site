import { FALLBACK_PAGE, PRODUCT_DETAILS, SUBPAGES } from "./subpage-data.js";
import { DEFAULT_NEWS, DEFAULT_PRODUCTS } from "./content-seed.js";

const params = new URLSearchParams(window.location.search);
const lang = localStorage.getItem("panhiro.site.lang.v2") || localStorage.getItem("panhiro.site.lang") || "en";
const storeKeys = {
  products: "panhiro.cnryce.products.v2",
  news: "panhiro.cnryce.news.v2"
};
const aliases = {
  ph0995: "ph-0995"
};
const requested = aliases[params.get("page")] || params.get("page") || FALLBACK_PAGE;
const legacyProductPages = new Set(["products", "vk-y1", "vk-1010-p4", "vk-1011", "ph-0885", "ph-0995", "p4-p5"]);

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

function categoryLabel(category) {
  return {
    "RY Series": "Industrial Series",
    "PW Series": "Permanent Magnet Series"
  }[category] || category;
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

const products = readLocal(storeKeys.products, DEFAULT_PRODUCTS).map((product) => ({
  ...product,
  specs: parseSpecs(product.specs)
}));
const newsPosts = readLocal(storeKeys.news, DEFAULT_NEWS);
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
  if (lang !== "en") return post;
  const translated = newsTranslations[post.slug];
  return translated ? { ...post, ...translated } : post;
}

function localizeSubpage(pageKey, source) {
  if (lang !== "en") return source;
  const translated = subpageTranslations[pageKey];
  return translated ? { ...source, ...translated } : source;
}

const pageKey = SUBPAGES[requested] ? requested : currentProduct || currentArticle ? requested : FALLBACK_PAGE;
const article = currentArticle ? localizeNews(currentArticle) : null;
const data = currentProduct
  ? {
      group: lang === "en" ? "Product Center" : "产品中心",
      title: currentProduct.name,
      summary: displayTagline(currentProduct),
      code: categoryLabel(currentProduct.category),
      image: currentProduct.image_url,
      imageAlt: currentProduct.name,
      sectionTitle: currentProduct.name,
      description: currentProduct.description,
      points: Object.entries(currentProduct.specs).map(([key, value]) => `${key}: ${value}`),
      cards: lang === "en"
        ? [
            ["01", categoryLabel(currentProduct.category), "This product has been imported according to the reference site category structure and the image has been downloaded to the local asset directory."],
            ["02", "Product Files", "Detailed specifications, application scenarios, packaging information and inquiry notes can continue to be managed from the admin panel."],
            ["03", "Contact", "For quotations or product files, please contact sales@panhiro.net."]
          ]
        : [
            ["01", currentProduct.category, "该产品已按参考站产品分类导入，图片已下载到本地静态资源目录。"],
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
        badge: currentProduct.category,
        heroImage: currentProduct.image_url,
        gallery: [currentProduct.image_url],
        specs: Object.entries(currentProduct.specs).map(([key, value]) => `${key}: ${value}`),
        scene: currentProduct.description
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

function renderNewsArticle(root) {
  if (!article) return;
  const paragraphs = String(article.content || article.excerpt)
    .split(/\n+/)
    .filter(Boolean)
    .map((paragraph) => `<p>${escapeHTML(paragraph)}</p>`)
    .join("");

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
        ["Who should I contact?", "You can email sales@panhiro.net with the model, quantity and market requirement, and we will reply soon."]
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
          <h2>${lang === "en" ? "Email, phone, WeCom and Douyin store access in one page" : "邮箱、电话、企业微信、抖音店铺，一页完成沟通"}</h2>
          <p>${lang === "en" ? "Please email sales@panhiro.net or panchen@panhiro.net first with the model, quantity, market and configuration request. You can also call directly, scan the code for WeCom, or visit the Douyin store." : "优先发送邮件到 sales@panhiro.net 或 panchen@panhiro.net，写清型号、数量、市场和配置需求；也可以直接电话联系、扫码添加企业微信，或进入抖音店铺咨询。"}</p>
        </div>
        <div class="contact-detail-layout">
          <form class="contact-detail-form" data-inquiry-form>
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
              <a href="mailto:sales@panhiro.net">sales@panhiro.net</a>
              <p>${lang === "en" ? "Best for product lists, target markets, purchase quantities, voltage and plug requests, or customization needs." : "适合发送产品清单、目标市场、采购数量、电压插头要求和定制需求。"}</p>
            </article>
            <article class="contact-channel-card phone-card">
              <span>${lang === "en" ? "Phone Inquiry" : "电话咨询"}</span>
              <a href="tel:+8613197228342">+86 13197228342</a>
              <p>${lang === "en" ? "Best for urgent confirmation of product files, quotation direction, sample discussion or service issues." : "适合急需确认产品资料、报价方向、样机沟通或售后问题。"}</p>
            </article>
            <article class="contact-channel-card">
              <span>${lang === "en" ? "WeCom" : "企业微信"}</span>
              <img src="/assets/contact-wecom-qr.jpg" alt="${lang === "en" ? "WeCom QR code" : "企业微信二维码"}" />
              <p>${lang === "en" ? "Scan to add WeCom and send product models, quantities, photos or videos." : "扫码添加企业微信，发送型号、数量、图片或视频资料。"}</p>
            </article>
            <article class="contact-channel-card">
              <span>${lang === "en" ? "Douyin Store" : "抖音店铺"}</span>
              <img src="/assets/contact-douyin-qr.jpg" alt="${lang === "en" ? "Douyin store QR code" : "抖音店铺二维码"}" />
              <p>${lang === "en" ? "Scan to enter the Douyin store, review product displays and start an online inquiry." : "扫码进入抖音店铺，查看产品展示并发起在线咨询。"}</p>
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
  form?.addEventListener("submit", (event) => {
    event.preventDefault();
    status.textContent = lang === "en"
      ? "Saved in the current browser preview. After deployment, this can be connected to email, WeCom or a CRM."
      : "已记录在当前浏览器预览中。上线后可继续接入邮箱、企业微信或 CRM。";
    form.reset();
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
