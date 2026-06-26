import { DEFAULT_PRODUCTS, DEFAULT_NEWS, PRODUCT_CATEGORIES } from "./content-seed.js";

const storeKeys = {
  products: "panhiro.cnryce.products.v2",
  news: "panhiro.cnryce.news.v2"
};
const languageStoreKey = "panhiro.site.lang.v2";
const legacyLanguageStoreKey = "panhiro.site.lang";
const DEFAULT_LANGUAGE = "en";

const state = {
  products: [],
  news: [],
  lang: localStorage.getItem(languageStoreKey) || localStorage.getItem(legacyLanguageStoreKey) || DEFAULT_LANGUAGE
};
const isStaticPreview = location.protocol === "file:" || ["5173", "5174"].includes(location.port);
let motionScrollReady = false;
const CATEGORY_LABELS = {
  "RY Series": "Industrial Series",
  "PW Series": "Permanent Magnet Series"
};
const CATEGORY_ALIASES = {
  "RY Series": "Industrial Series",
  "PW Series": "Permanent Magnet Series"
};
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
  ["household high quality induction motor electric high pressure car washer", "家用高品质感应电机电动高压洗车机"],
  ["hand held electric high pressure water cleaner", "手持式电动高压清洗机"],
  ["handheld commercial high pressure washer", "手持商用高压清洗机"],
  ["handheld high pressure jet spray cleaner", "手持高压喷射清洗机"],
  ["handheld high power industrial vacuum cleaner", "手持大功率工业吸尘器"],
  ["industrial vacuum cleaner", "工业吸尘器"],
  ["vacuum cleaner", "吸尘器"],
  ["woodworking dust collector", "木工集尘器"],
  ["dust collector", "集尘器"],
  ["foam blaster", "泡沫喷壶"],
  ["foam spray gun", "泡沫喷枪",
  ],
  ["foam gun", "泡沫枪"],
  ["water spray gun", "水枪"],
  ["spray gun", "喷枪"],
  ["high pressure gun", "高压喷枪"],
  ["adjustable foam gun", "可调泡沫枪"],
  ["adjustable water spray gun", "可调水枪"],
  ["high pressure hose", "高压软管"],
  ["sewer cleaning hose", "管道疏通软管"],
  ["hydraulic hose", "液压软管"],
  ["garden hose", "花园水管"],
  ["rubberized water hose", "包胶水管"],
  ["hose extension", "延长软管"],
  ["quick connector", "快接头"],
  ["threaded pipe fittings", "螺纹管件"],
  ["hose adapter", "软管转接头"],
  ["pressure washer hose adapter", "清洗机软管转接头"],
  ["washer adapter", "清洗机转接头"],
  ["connector", "接头"],
  ["adapter", "转接头"],
  ["pump head", "泵头"],
  ["pump", "泵"],
  ["high pressure washer", "高压清洗机"],
  ["pressure washer", "高压清洗机"],
  ["car washer", "洗车机"],
  ["car washing", "洗车"],
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
  ["all copper wire", "全铜线"],
  ["brass", "黄铜"],
  ["stainless steel", "不锈钢"],
  ["flexible", "柔性"],
  ["heavy duty", "重型"],
  ["heavy-duty", "重型"],
  ["new design", "新款设计"],
  ["new model", "新款"],
  ["technology", "技术型"],
  ["professional", "专业"],
  ["small size", "小型"],
  ["small", "小型"],
  ["multi-functional", "多功能"],
  ["multi functional", "多功能"],
  ["fully automatic shutdown", "全自动停机"],
  ["automatic shutdown", "自动停机"],
  ["pure copper", "纯铜"],
  ["cold water", "冷水"],
  ["water cleaning", "水清洁"],
  ["cleaning washer", "清洗机"],
  ["for car bike home cleaning", "适用于汽车、摩托车和家庭清洁"],
  ["for car bike and car washer", "适用于汽车、摩托车和洗车场景"],
  ["for car shop watering garden", "适用于洗车店和花园浇灌"],
  ["for homeuse", "家用"],
  ["homeuse", "家用"],
  ["taizhou factory", "台州工厂"]
];
const SPEC_LABELS_ZH = {
  Category: "分类",
  Power: "功率",
  Pressure: "压力",
  Flow: "流量"
};
const NEWS_CATEGORY_LABELS = {
  en: {
    "公司动态": "Company News",
    "产品资讯": "Product Updates",
    "企业实力": "Company Strength"
  },
  zh: {
    "公司动态": "公司动态",
    "产品资讯": "产品资讯",
    "企业实力": "企业实力"
  }
};
const NEWS_TRANSLATIONS = {
  "panhiro-company-profile": {
    title: {
      en: "Taizhou Panhiro Electromechanical Co., Ltd. Founded in 2009",
      zh: "台州磐宏机电有限公司成立于 2009 年"
    },
    excerpt: {
      en: "Panhiro is a professional manufacturer focused on R&D, production and sales of cleaning equipment.",
      zh: "磐宏是一家以清洗机设备研发制造为核心，集开发、生产与销售于一体的专业厂家。"
    },
    content: {
      en: "Founded in 2009, Taizhou Panhiro Electromechanical Co., Ltd. is located in Wenling, Taizhou, Zhejiang. Leveraging the local pump and motor supply chain, the company continues to strengthen professional manufacturing, standardized quality control and digital operations.",
      zh: "台州磐宏机电有限公司成立于 2009 年，坐落于浙江省台州市温岭市大溪镇后瓦屿工业园区。公司依托当地泵与电机产业集群配套优势，持续向专业化、规范化和数字化运营方向发展。"
    }
  },
  "panhiro-cnryce-product-catalog": {
    title: {
      en: "Panhiro Product Catalog Has Been Systematically Organized",
      zh: "清洗设备产品目录完成系统化整理"
    },
    excerpt: {
      en: "The Panhiro catalog covers high pressure washers, vacuum cleaners, pumps, hoses, spray guns, foam guns and adapters for fast sourcing decisions.",
      zh: "磐宏产品目录覆盖高压清洗机、吸尘器、泵、管路、喷枪、泡沫枪和转接件，方便客户按采购场景快速选型。"
    },
    content: {
      en: "Panhiro continues to improve its product materials by organizing complete machines, accessories and consumables by application scenario and product type, helping distributors, bulk buyers and brand clients quickly understand available products, configuration directions and key cooperation points.",
      zh: "磐宏持续完善清洗设备产品资料，将整机、配件与耗材按应用场景和产品类型整理展示，帮助经销商、批量采购客户和品牌客户更快了解可供产品范围、配置方向和合作沟通重点。"
    }
  },
  "panhiro-factory-strength": {
    title: {
      en: "Building Long-Term Delivery Capability on Wenling's Pump and Motor Supply Chain",
      zh: "依托温岭泵与电机产业集群建设长期交付能力"
    },
    excerpt: {
      en: "Panhiro is based in the core pump and motor cluster of Daxi Town, where upstream and downstream support is complete.",
      zh: "公司所在的大溪镇是温岭泵与电机产业核心聚集区，上下游配套完整。"
    },
    content: {
      en: "This industrial ecosystem makes sourcing key components, developing samples, assembling, testing and batch delivery easier to coordinate. Panhiro keeps strengthening quality management and response capability while improving modern operations and digital management.",
      zh: "产业生态让关键部件采购、样机开发、装配测试和批量交付更容易形成协同。磐宏坚持质量管理与服务响应并重，持续完善现代化管理和数字化运营能力。"
    }
  }
};
const DEFAULT_NEWS_BY_SLUG = new Map(DEFAULT_NEWS.map((post) => [post.slug, post]));

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

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

function categoryTagline(category) {
  const lines = {
    en: {
      "car washing series": "Suitable for vehicle washing, yard cleaning, retail cleaning and daily high pressure cleaning tasks.",
      "Car Washing T Series": "Portable high pressure cleaning equipment for home, shop and mobile cleaning needs.",
      "Industrial Series": "Industrial Series built for frequent use with balanced pressure output and operating convenience.",
      "Permanent Magnet Series": "Permanent Magnet Series for commercial cleaning and heavier-duty washing tasks.",
      "RY Series": "Industrial Series built for frequent use with balanced pressure output and operating convenience.",
      "PW Series": "Permanent Magnet Series for commercial cleaning and heavier-duty washing tasks.",
      "Vacuum Cleaner": "Suitable for workshops, stores, woodworking dust and floor cleaning needs.",
      "Washer Plunger Pumps": "Core plunger pump components for maintenance, assembly and bulk supporting supply.",
      "Washer Pressure Pipe": "High pressure hose and extension pipe accessories for washing, unclogging and connection tasks.",
      "Spray Gun For Cleaning": "Spray gun and lance accessories that improve angle coverage and cleaning efficiency.",
      "Foam Gun": "Foam spraying accessories for car washing, pre-wash and even detergent coverage.",
      "Washer Adapter": "Adapters and connectors for matching different hoses, spray guns and washer units."
    },
    zh: {
      "car washing series": "适用于车辆清洗、庭院冲洗、门店保洁和日常高压清洁场景。",
      "Car Washing T Series": "便携高压清洗设备，适合家庭、门店和移动清洗需求。",
      "Industrial Series": "Industrial Series 面向高频使用的清洗机系列，兼顾压力表现与操作便利性。",
      "Permanent Magnet Series": "Permanent Magnet Series 面向商用清洗与重污冲洗场景，适合更高强度的清洁任务。",
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
  return lines[state.lang]?.[category] || (state.lang === "en"
    ? "Cleaning equipment and supporting products for channel sales, bulk purchase and custom cooperation."
    : "清洗设备与配套产品，适合渠道销售、批量采购和定制合作。");
}

function displayTagline(product) {
  return /CNRYCE product catalog/i.test(product.tagline || "") ? categoryTagline(product.category) : product.tagline || categoryTagline(product.category);
}

function categoryLabel(category) {
  return CATEGORY_LABELS[category] || category;
}

function hasChinese(value) {
  return /[\u4e00-\u9fff]/.test(String(value || ""));
}

function productCategoryLabel(category) {
  if (state.lang !== "zh") return categoryLabel(category);
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
  if (state.lang !== "zh") return specs;
  return Object.fromEntries(Object.entries(specs).map(([key, value]) => [
    SPEC_LABELS_ZH[key] || translateProductCopy(key),
    translateProductCopy(value)
  ]));
}

function localizeProduct(product) {
  if (state.lang !== "zh") {
    return {
      ...product,
      category: categoryLabel(product.category),
      tagline: displayTagline(product),
      specs: product.specs
    };
  }
  return {
    ...product,
    name: translateProductCopy(product.name),
    category: productCategoryLabel(product.category),
    tagline: /CNRYCE product catalog/i.test(product.tagline || "")
      ? categoryTagline(product.category)
      : translateProductCopy(product.tagline || categoryTagline(product.category)),
    description: translateProductCopy(product.description),
    specs: localizeSpecs(product.specs)
  };
}

function canonicalCategory(category) {
  return CATEGORY_ALIASES[category] || category;
}

function newsCategoryLabel(category) {
  return NEWS_CATEGORY_LABELS[state.lang]?.[category] || category;
}

function sameManagedText(current, original) {
  return String(current ?? "").trim() === String(original ?? "").trim();
}

function usesDefaultNewsCopy(post) {
  const original = DEFAULT_NEWS_BY_SLUG.get(post.slug);
  if (!original) return false;
  return ["title", "category", "excerpt", "content"].every((key) => sameManagedText(post[key], original[key]));
}

function localizeNews(post) {
  const translated = NEWS_TRANSLATIONS[post.slug];
  if (!translated || !usesDefaultNewsCopy(post)) {
    return {
      ...post,
      category: newsCategoryLabel(post.category)
    };
  }
  return {
    ...post,
    title: translated.title[state.lang] || post.title,
    excerpt: translated.excerpt[state.lang] || post.excerpt,
    content: translated.content[state.lang] || post.content,
    category: newsCategoryLabel(post.category)
  };
}

function setText(selector, value) {
  const element = $(selector);
  if (element) element.textContent = value;
}

function setHTML(selector, value) {
  const element = $(selector);
  if (element) element.innerHTML = value;
}

function setPlaceholder(selector, value) {
  const element = $(selector);
  if (element) element.setAttribute("placeholder", value);
}

function setMeta(selector, value) {
  const element = $(selector);
  if (element) element.setAttribute("content", value);
}

function setupLanguage() {
  if (!localStorage.getItem(languageStoreKey) && localStorage.getItem(legacyLanguageStoreKey)) {
    localStorage.setItem(languageStoreKey, localStorage.getItem(legacyLanguageStoreKey));
  }
  document.documentElement.lang = state.lang === "en" ? "en" : "zh-CN";
  document.body.classList.toggle("lang-en", state.lang === "en");
  document.body.classList.toggle("lang-zh", state.lang !== "en");
  const toggle = $("[data-lang-toggle]");
  if (toggle) {
    toggle.textContent = state.lang === "en" ? "中文" : "EN";
    toggle.addEventListener("click", () => {
      const next = state.lang === "en" ? "zh" : "en";
      localStorage.setItem(languageStoreKey, next);
      location.reload();
    });
  }
  applyStaticLanguage();
}

function applyStaticLanguage() {
  const lang = state.lang;
  const page = document.body.dataset.page || "home";

  const shared = {
    en: {
      home: "Home",
      about: "About Us",
      companyProfile: "Company Profile",
      companyStrength: "Company Strength",
      productCenter: "Product Center",
      serviceSupport: "Service Support",
      serviceOverview: "Service Overview",
      serviceVideo: "After-Sales Videos",
      serviceDownload: "Download Center",
      news: "News Center",
      contact: "Contact Us",
      search: "Search",
      openMenu: "Open menu",
      closeSearch: "Close search",
      phone: "Phone Consultation",
      top: "Back to top",
      message: "Contact us",
      adminPortal: "Admin portal",
      footerCompany: "Taizhou Panhiro Electromechanical Co., Ltd., manufacturer of high pressure washers, car wash equipment and cleaning devices."
    },
    zh: {
      home: "网站首页",
      about: "关于我们",
      companyProfile: "公司简介",
      companyStrength: "企业实力",
      productCenter: "产品中心",
      serviceSupport: "服务支持",
      serviceOverview: "服务总览",
      serviceVideo: "售后视频",
      serviceDownload: "下载专区",
      news: "新闻中心",
      contact: "联系我们",
      search: "搜索",
      openMenu: "打开菜单",
      closeSearch: "关闭搜索",
      phone: "电话咨询",
      top: "返回顶部",
      message: "联系我们",
      adminPortal: "后台入口",
      footerCompany: "台州磐宏机电有限公司，高压清洗机、洗车机及清洁设备制造商。"
    }
  }[lang];

  setText(".site-nav .nav-link[href='/index.html']", shared.home);
  setText(".site-nav .nav-main[href='/subpage.html?page=company-profile']", shared.about);
  setText(".site-nav .submenu a[href='/subpage.html?page=company-profile']", shared.companyProfile);
  setText(".site-nav .submenu a[href='/subpage.html?page=company-strength']", shared.companyStrength);
  setText(".site-nav .nav-main[href='/product.html']", shared.productCenter);
  setText(".site-nav .nav-main[href='/subpage.html?page=service']", shared.serviceSupport);
  setText(".site-nav .submenu a[href='/subpage.html?page=service']", shared.serviceOverview);
  setText(".site-nav .submenu a[href='/subpage.html?page=service-video']", shared.serviceVideo);
  setText(".site-nav .submenu a[href='/subpage.html?page=service-download']", shared.serviceDownload);
  setText(".site-nav .nav-link[href='/news.html']", shared.news);
  setText(".site-nav .nav-link[href='/subpage.html?page=contact']", shared.contact);
  setText(".footer nav a[href='/product.html']", shared.productCenter);
  setText(".footer nav a[href='/news.html']", shared.news);
  setText(".footer nav a[href='/index.html']", shared.home);
  setText(".footer nav a[href='/subpage.html?page=contact']", shared.contact);
  setText(".footer nav a[href='/admin.html']", shared.adminPortal);
  setText(".footer p", shared.footerCompany);
  $(".nav-toggle")?.setAttribute("aria-label", shared.openMenu);
  $(".round-tool[data-search-open]")?.setAttribute("aria-label", shared.search);
  $(".search-dialog form .round-tool")?.setAttribute("aria-label", shared.closeSearch);
  $(".side-rail a[href='#top']")?.setAttribute("aria-label", shared.top);
  $(".side-rail a[href^='tel:']")?.setAttribute("aria-label", shared.phone);
  $(".side-rail a[href='#contact'], .side-rail a[href='/subpage.html?page=contact']")?.setAttribute("aria-label", shared.message);

  if (page === "home") {
    document.title = lang === "en"
      ? "Panhiro High Pressure Cleaning Equipment | Panhiro Cleaning Equipment"
      : "Panhiro 高压清洗设备 | 磐宏清洗设备";
    setMeta("meta[name='description']", lang === "en"
      ? "Panhiro provides high pressure washers, car wash equipment, vacuum cleaners and accessories for global buyers, with support for bulk purchase, channel cooperation and custom supply."
      : "Panhiro 面向全球采购客户提供高压清洗机、洗车机、吸尘器及配件，支持批量采购、渠道合作和定制配套。");
    $(".brand")?.setAttribute("aria-label", lang === "en" ? "Panhiro home" : "磐宏首页");
    setHTML(".hero h1", lang === "en"
      ? `<span class="hero-title-main">Panhiro</span><br /><span class="hero-title-sub">High Pressure Cleaning Equipment</span>`
      : `<span class="hero-title-main">Panhiro</span><br /><span class="hero-title-sub is-cjk">高压清洗设备</span>`);
    setText(".hero-lead", lang === "en"
      ? "Stable supply of complete cleaning machines and accessories for distributors, brand partners and project buyers, with documentation support and custom cooperation."
      : "面向渠道采购、品牌合作和工程项目，提供清洗设备整机与配件的稳定供应、资料支持和定制协作。");
    setText(".hero-actions .btn.primary", lang === "en" ? "Browse Product Catalog" : "浏览产品目录");
    setText(".hero-actions .btn.ghost", lang === "en" ? "Contact Sales Team" : "联系销售团队");
    setHTML(".hero-readouts", lang === "en"
      ? `<span><b data-counter="2009">2009</b>Founded</span><span><b data-counter="10000" data-counter-suffix="㎡">10000㎡</b>Production Base</span><span><b data-counter="60" data-counter-suffix="+">60+</b>Countries Covered</span>`
      : `<span><b data-counter="2009">2009</b>成立时间</span><span><b data-counter="10000" data-counter-suffix="㎡">10000㎡</b>生产基地</span><span><b data-counter="60" data-counter-suffix="+">60+</b>市场覆盖</span>`);
    setText(".products-section .section-head h2", lang === "en" ? "Choose Products by Buying Scenario" : "按采购场景选择产品");
    setText(".products-section .section-summary", lang === "en" ? "The complete machine and accessory catalog follows the reference site categories so buyers can filter quickly by use case, application and budget." : "直接沿用参考站分类展示整机与配件，客户可以按场景、用途和预算快速筛选对应产品。");
    setText(".products-section .text-link", lang === "en" ? "Open Product Center" : "进入产品中心");
    setText(".about-copy h2", lang === "en" ? "Manufacturing Strength Builds Long-Term Confidence" : "制造能力，是长期合作的底气");
    setText(".about-copy p:not(.eyebrow)", lang === "en" ? "Panhiro is rooted in Wenling, Taizhou, a pump and motor manufacturing cluster. We build development, assembly, testing and delivery capabilities around high pressure cleaning equipment for channel partners, brand customers and bulk buyers worldwide." : "磐宏扎根浙江台州温岭泵与电机产业带，围绕高压清洗设备建立研发、装配、测试与交付能力。我们服务全球渠道客户、品牌客户与批量采购客户，让产品供应更稳定、沟通更直接、合作更高效。");
    setText(".profile-frame span", lang === "en" ? "Explore Factory Strength" : "了解工厂实力");
    setText(".profile-frame strong", lang === "en" ? "See capacity, supply support, delivery and market coverage" : "查看产能、配套、交付与市场覆盖");
    setHTML(".strength-board", lang === "en"
      ? `<div><b data-counter="2009">2009</b><span>Founded</span></div><div><b>50-200</b><span>Employees</span></div><div><b data-counter="10000" data-counter-suffix="㎡">10000㎡</b><span>Site Area</span></div><div><b data-counter="60" data-counter-suffix="+">60+</b><span>Countries Served</span></div>`
      : `<div><b data-counter="2009">2009</b><span>成立时间</span></div><div><b>50-200</b><span>员工规模</span></div><div><b data-counter="10000" data-counter-suffix="㎡">10000㎡</b><span>占地面积</span></div><div><b data-counter="60" data-counter-suffix="+">60+</b><span>市场覆盖</span></div>`);
    setText(".service-section .section-head h2", lang === "en" ? "Support from Sampling to Batch Delivery" : "从样品确认到批量交付，全程配合");
    setText(".service-section .section-summary", lang === "en" ? "We support sourcing decisions with product files, configuration suggestions, packaging communication, quality confirmation and after-sales materials." : "围绕客户采购决策，提供产品资料、配置建议、包装沟通、质量确认和售后资料支持。");
    setHTML(".service-list", lang === "en"
      ? `<article><span class="service-icon">01</span><h3>Fast Selection</h3><p>Match complete machines and accessories by application, target market, pressure, flow and budget.</p></article><article><span class="service-icon">02</span><h3>Sales Materials</h3><p>Provide parameters, catalogs, installation guides, photos and video assets.</p></article><article><span class="service-icon">03</span><h3>Pre-Shipment Check</h3><p>Confirm pressure, temperature rise, noise, durability, sealing and appearance before dispatch.</p></article><article><span class="service-icon">04</span><h3>Custom Cooperation</h3><p>Support color, nameplate, packaging, accessory bundles and channel-specific configurations.</p></article>`
      : `<article><span class="service-icon">01</span><h3>快速选型</h3><p>根据使用场景、目标市场、压力流量和预算，匹配整机与配件组合。</p></article><article><span class="service-icon">02</span><h3>资料配套</h3><p>提供产品参数、目录图册、安装说明、展示图片和视频素材。</p></article><article><span class="service-icon">03</span><h3>出货确认</h3><p>围绕水压、温升、噪声、耐久、密封和外观进行交付前检查。</p></article><article><span class="service-icon">04</span><h3>定制合作</h3><p>支持颜色、铭牌、包装、附件组合和渠道专供配置沟通。</p></article>`);
    setText(".news-section .section-head h2", lang === "en" ? "Latest Panhiro Updates" : "了解磐宏的最新动态");
    setText(".news-section .section-summary", lang === "en" ? "Follow product catalog updates, factory delivery capabilities and company news to understand cooperation timing more clearly." : "关注产品目录更新、工厂交付能力和企业资讯，帮助客户更清楚地判断合作节奏。");
    setText(".news-section .text-link", lang === "en" ? "View All News" : "查看全部动态");
    setText(".faq-section .section-head h2", lang === "en" ? "Frequently Asked Questions" : "常见问题");
    setText(".faq-section .section-summary", lang === "en" ? "We answer the most common questions about quality, warranty, branding, stock and delivery in advance." : "把客户最常问的质量、保修、品牌、库存和交付问题先说清楚，减少来回沟通。");
    setHTML(".faq-grid", lang === "en"
      ? `<details class="faq-item" open><summary>How do you ensure product quality?</summary><p>Each machine is inspected and tested individually before packing, followed by a final pre-shipment review.</p></details><details class="faq-item" open><summary>How long is the warranty?</summary><p>The standard warranty is 6-12 months depending on the component grade and order configuration.</p></details><details class="faq-item" open><summary>Can you use the customer's own brand?</summary><p>Yes. We support OEM and welcome ODM projects with custom branding, packaging and market-specific setup.</p></details><details class="faq-item" open><summary>Do you keep stock?</summary><p>Regular models are often available in stock. Custom or bulk orders are confirmed according to the actual production schedule.</p></details><details class="faq-item" open><summary>What is the lead time?</summary><p>Stock items can be shipped quickly. Custom or bulk orders usually take about 15 days in the off-season and about 30 days in the peak season.</p></details><details class="faq-item" open><summary>Who should I contact?</summary><p>You can email <a href="mailto:sales@panhiro.net">sales@panhiro.net</a> with the model, quantity and market requirement, and we will reply soon.</p></details>`
      : `<details class="faq-item" open><summary>如何确保产品质量？</summary><p>每台产品在包装前都会经过单独检查和测试，出货前再做一轮复检。</p></details><details class="faq-item" open><summary>产品保修多久？</summary><p>常规质保期为 6-12 个月，会根据配件档次和订单配置确认。</p></details><details class="faq-item" open><summary>支持使用客户自己的品牌吗？</summary><p>支持 OEM，也欢迎 ODM 订单，可按品牌、包装和市场需求做配套。</p></details><details class="faq-item" open><summary>产品有库存吗？</summary><p>常规产品通常有库存，可以尽快安排；定制或批量订单会按实际情况确认交付节奏。</p></details><details class="faq-item" open><summary>交付周期多久？</summary><p>库存产品可尽快发货；定制或批量订单一般淡季约 15 天，旺季约 30 天。</p></details><details class="faq-item" open><summary>有问题联系谁？</summary><p>可以直接邮件联系 <a href="mailto:sales@panhiro.net">sales@panhiro.net</a>，发送型号、数量和市场需求，我们会尽快回复。</p></details>`);
    setText(".contact-band h2", lang === "en" ? "Get Product Files and Quotations" : "获取产品资料与报价");
    setText(".contact-band p:not(.eyebrow)", lang === "en" ? "Send us the target product, quantity, market region and custom requirements, and we will prepare catalog files, configuration suggestions and quotation details for you." : "请发送目标产品、采购数量、市场区域和定制需求，我们会尽快整理产品目录、配置建议与报价信息。");
    setHTML(".contact-info-list", lang === "en"
      ? `<a href="mailto:sales@panhiro.net"><span>Catalog / Quotation</span><strong>sales@panhiro.net</strong></a><a href="mailto:panchen@panhiro.net"><span>Email</span><strong>panchen@panhiro.net</strong></a><a href="tel:+8613197228342"><span>Phone</span><strong>+86 131 9722 8342</strong></a><div><span>Company</span><strong>Taizhou Panhiro Electromechanical Co., Ltd.</strong></div>`
      : `<a href="mailto:sales@panhiro.net"><span>资料 / 报价</span><strong>sales@panhiro.net</strong></a><a href="mailto:panchen@panhiro.net"><span>邮箱</span><strong>panchen@panhiro.net</strong></a><a href="tel:+8613197228342"><span>电话</span><strong>+86 131 9722 8342</strong></a><div><span>公司</span><strong>台州磐宏机电有限公司</strong></div>`);
    setPlaceholder("[data-search-input]", lang === "en" ? "Search product names, categories or company news..." : "输入产品名称、分类、公司动态...");
    setText(".search-dialog label span", lang === "en" ? "Search Products or News" : "搜索产品或动态");
  }

  if (page === "products") {
    document.title = lang === "en" ? "Product Center | Panhiro Cleaning Equipment" : "产品中心 | 磐宏清洗设备";
    setMeta("meta[name='description']", lang === "en"
      ? "Explore Panhiro's product center based on the CNRYCE category structure, including high pressure washers, vacuum cleaners, plunger pumps, hoses and accessories."
      : "查看磐宏按 CNRYCE 参考分类整理的 87 个产品，覆盖 Washing Machine、Vacuum Cleaner、Washer Plunger Pumps、Foam Gun 等目录。");
    setText(".page-hero h1", lang === "en" ? "Product Center" : "产品中心");
    setText(".page-hero p:not(.eyebrow)", lang === "en" ? "Browse 87 products organized by the reference site categories, covering Washing Machine, car washing series, Vacuum Cleaner, Washer Plunger Pumps, Foam Gun and more." : "按参考站分类展示 87 个产品，覆盖 Washing Machine、car washing series、Vacuum Cleaner、Washer Plunger Pumps、Foam Gun 等目录。");
    setPlaceholder("[data-search-input]", lang === "en" ? "Enter product model or category..." : "输入产品型号或分类...");
    setText(".search-dialog label span", lang === "en" ? "Search Products or News" : "搜索产品或动态");
  }

  if (page === "news") {
    document.title = lang === "en" ? "News Center | Panhiro Cleaning Equipment" : "新闻中心 | 磐宏清洗设备";
    setMeta("meta[name='description']", lang === "en"
      ? "Read Panhiro product updates, factory news, delivery capability highlights and market cooperation information."
      : "查看磐宏产品更新、工厂动态、交付能力与合作信息。");
    setText(".page-hero h1", lang === "en" ? "News Center" : "新闻中心");
    setText(".page-hero p:not(.eyebrow)", lang === "en" ? "Explore product updates, manufacturing progress, delivery capability and cooperation news from Panhiro." : "了解磐宏的产品目录更新、工厂制造动态、质量交付能力和市场合作信息。");
    setHTML(".news-page-intro", lang === "en"
      ? `<article><span>PRODUCT</span><h2>Product Updates</h2><p>Review new items, catalog adjustments, core configurations and application scenarios before sourcing.</p></article><article><span>FACTORY</span><h2>Factory News</h2><p>Understand production, testing, delivery and team operations to judge long-term supply stability.</p></article><article><span>MARKET</span><h2>Cooperation Info</h2><p>Stay updated on channel support, distributor cooperation and service content for global buyers.</p></article>`
      : `<article><span>PRODUCT</span><h2>产品更新</h2><p>查看新品、目录调整、核心配置和应用场景，方便采购前快速判断产品方向。</p></article><article><span>FACTORY</span><h2>工厂动态</h2><p>了解生产、测试、交付和团队运营信息，判断长期合作的稳定性。</p></article><article><span>MARKET</span><h2>合作信息</h2><p>面向经销商、批量采购和品牌客户，持续更新合作支持与服务内容。</p></article>`);
    setHTML(".news-toolbar", lang === "en"
      ? `<button type="button" class="active" data-news-filter="全部">All</button><button type="button" data-news-filter="公司动态">Company News</button><button type="button" data-news-filter="产品资讯">Product Updates</button><button type="button" data-news-filter="企业实力">Company Strength</button>`
      : `<button type="button" class="active" data-news-filter="全部">全部</button><button type="button" data-news-filter="公司动态">公司动态</button><button type="button" data-news-filter="产品资讯">产品资讯</button><button type="button" data-news-filter="企业实力">企业实力</button>`);
    setPlaceholder("[data-search-input]", lang === "en" ? "Enter news keywords..." : "输入动态关键词...");
    setText(".search-dialog label span", lang === "en" ? "Search Products or News" : "搜索产品或动态");
  }

  if (page === "subpage") {
    setPlaceholder("[data-search-input]", lang === "en" ? "Enter product models or company news..." : "输入产品型号、公司动态...");
    setText(".search-dialog label span", lang === "en" ? "Search Products or News" : "搜索产品或动态");
  }
}

function normalizeProduct(product) {
  return {
    ...product,
    category: canonicalCategory(product.category),
    specs: parseSpecs(product.specs),
    sort_order: Number(product.sort_order || 0),
    is_featured: Number(product.is_featured || 0),
    published: Number(product.published ?? 1)
  };
}

function normalizeNews(post) {
  return {
    ...post,
    published: Number(post.published ?? 1)
  };
}

async function readJson(path) {
  const response = await fetch(path, { cache: "no-store" });
  if (!response.ok) throw new Error(`Request failed: ${response.status}`);
  return response.json();
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

async function loadContent() {
  const [productsResult, newsResult] = isStaticPreview
    ? [
        { status: "rejected" },
        { status: "rejected" }
      ]
    : await Promise.allSettled([
        readJson("/api/products"),
        readJson("/api/news")
      ]);

  state.products = (productsResult.status === "fulfilled"
    ? productsResult.value.products
    : readLocal(storeKeys.products, DEFAULT_PRODUCTS))
    .map(normalizeProduct)
    .filter((item) => item.published)
    .sort((a, b) => a.sort_order - b.sort_order);

  state.news = (newsResult.status === "fulfilled"
    ? newsResult.value.news
    : readLocal(storeKeys.news, DEFAULT_NEWS))
    .map(normalizeNews)
    .filter((item) => item.published)
    .sort((a, b) => String(b.published_at).localeCompare(String(a.published_at)));
}

function productCard(product) {
  const localized = localizeProduct(product);
  const specs = Object.entries(localized.specs)
    .slice(0, 4)
    .map(([key, value]) => `<span>${escapeHTML(key)}：${escapeHTML(value)}</span>`)
    .join("");
  const href = `/subpage.html?page=${encodeURIComponent(product.slug || product.id)}`;

  return `
    <a class="product-card" href="${href}" data-product-id="${escapeHTML(product.id)}">
      <div class="product-visual">
        <img src="${escapeHTML(product.image_url)}" alt="${escapeHTML(localized.name)}" loading="lazy" />
      </div>
      <div class="product-body">
        <span class="tag">${escapeHTML(localized.category)}</span>
        <h3>${escapeHTML(localized.name)}</h3>
        <p>${escapeHTML(localized.tagline)}</p>
        <div class="spec-list">${specs}</div>
      </div>
    </a>
  `;
}

function newsCard(post) {
  const localized = localizeNews(post);
  const href = newsDestination(post);
  return `
    <a class="news-card news-card-link" href="${escapeHTML(href)}">
      <div class="news-media">
        <img src="${escapeHTML(localized.image_url)}" alt="${escapeHTML(localized.title)}" loading="lazy" />
      </div>
      <div class="news-body">
        <div class="news-meta">
          <span>${escapeHTML(localized.category)}</span>
          <time datetime="${escapeHTML(localized.published_at)}">${escapeHTML(localized.published_at)}</time>
        </div>
        <h3>${escapeHTML(localized.title)}</h3>
        <p>${escapeHTML(localized.excerpt)}</p>
        <span class="news-more">${state.lang === "en" ? "View Details" : "查看详情"}</span>
      </div>
    </a>
  `;
}

function newsRow(post) {
  const localized = localizeNews(post);
  const href = newsDestination(post);
  return `
    <a class="news-row news-card-link" href="${escapeHTML(href)}">
      <img src="${escapeHTML(localized.image_url)}" alt="${escapeHTML(localized.title)}" loading="lazy" />
      <div class="news-body">
        <div class="news-meta">
          <span>${escapeHTML(localized.category)}</span>
          <time datetime="${escapeHTML(localized.published_at)}">${escapeHTML(localized.published_at)}</time>
        </div>
        <h3>${escapeHTML(localized.title)}</h3>
        <p>${escapeHTML(localized.excerpt)}</p>
      </div>
      <span class="arrow">›</span>
    </a>
  `;
}

function newsDestination(post) {
  return `/subpage.html?page=${encodeURIComponent(post.slug || post.id)}`;
}

function uniqueCategories(products) {
  const categories = PRODUCT_CATEGORIES.length
    ? PRODUCT_CATEGORIES.map((category) => canonicalCategory(category))
    : [...new Set(products.map((product) => canonicalCategory(product.category)))];
  return ["全部", ...categories];
}

function productMatchesCategory(product, category) {
  if (category === "全部") return true;
  const normalizedCategory = canonicalCategory(category);
  if (normalizedCategory === "Washing Machine") {
    return ["car washing series", "Car Washing T Series", "Industrial Series", "Permanent Magnet Series", "Washing Machine"].includes(canonicalCategory(product.category));
  }
  return canonicalCategory(product.category) === normalizedCategory;
}

function renderTabs(container, products, onChange, initial = "全部") {
  if (!container) return;
  container.innerHTML = uniqueCategories(products)
    .map((category) => `<button type="button" class="${category === initial ? "active" : ""}" data-category="${escapeHTML(category)}">${escapeHTML(category === "全部" ? (state.lang === "en" ? "All" : "全部") : productCategoryLabel(category))}</button>`)
    .join("");
  container.addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (!button) return;
    $$("button", container).forEach((item) => item.classList.toggle("active", item === button));
    onChange(button.dataset.category);
  });
}

function attachProductEvents(root = document) {
  $$(".product-card:not(a)", root).forEach((card) => {
    const open = () => openProduct(card.dataset.productId);
    card.addEventListener("click", open);
    card.addEventListener("keydown", (event) => {
      if (event.key === "Enter") open();
    });
  });
}

function attachNewsEvents(root = document) {
  $$(".news-card, .news-row", root).forEach((card) => {
    const open = () => openNews(card.dataset.newsId);
    card.addEventListener("click", open);
    card.addEventListener("keydown", (event) => {
      if (event.key === "Enter") open();
    });
  });
}

function renderHomeProducts() {
  const grid = $("[data-home-products]");
  const tabs = $("[data-home-tabs]");
  if (!grid || !tabs) return;

  const featured = state.products.filter((item) => item.is_featured).slice(0, 4);
  const render = (category = "全部") => {
    const products = (category === "全部" ? featured : state.products.filter((item) => productMatchesCategory(item, category))).slice(0, 4);
    grid.innerHTML = products.length ? products.map(productCard).join("") : `<div class="empty-state">${state.lang === "en" ? "No products in this category yet. They will appear automatically after publishing from the admin panel." : "该分类暂无产品，后台添加后会自动显示。"}</div>`;
    attachProductEvents(grid);
    setupMotion();
  };

  renderTabs(tabs, state.products, render);
  renderProductRail();
  render();
}

function renderProductRail() {
  const rail = $("[data-home-marquee]");
  if (!rail) return;

  const items = state.products.slice(0, 10);
  const tiles = items
    .map(
      (product) => `
        <a class="marquee-item" href="/subpage.html?page=${encodeURIComponent(product.slug || product.id)}">
          <img src="${escapeHTML(product.image_url)}" alt="${escapeHTML(product.name)}" loading="lazy" />
          <div>
            <span>${escapeHTML(categoryLabel(product.category))}</span>
            <strong>${escapeHTML(product.name)}</strong>
          </div>
        </a>
      `
    )
    .join("");

  rail.innerHTML = `
    <div class="marquee-track">
      ${tiles}
      ${tiles}
    </div>
  `;
}

function renderProductPage() {
  const grid = $("[data-product-page-grid]");
  const tabs = $("[data-product-tabs]");
  if (!grid || !tabs) return;

  const categoryFromUrl = new URLSearchParams(location.search).get("category") || "全部";
  const render = (category = "全部") => {
    const products = state.products.filter((item) => productMatchesCategory(item, category));
    grid.innerHTML = products.length ? products.map(productCard).join("") : `<div class="empty-state">${state.lang === "en" ? "No products in this category yet. They will appear automatically after publishing from the admin panel." : "该分类暂无产品，后台添加后会自动显示。"}</div>`;
    attachProductEvents(grid);
    setupMotion();
  };

  renderTabs(tabs, state.products, render, categoryFromUrl);
  render(categoryFromUrl);
}

function renderHomeNews() {
  const grid = $("[data-home-news]");
  if (!grid) return;
  grid.innerHTML = state.news.slice(0, 3).map(newsCard).join("");
  attachNewsEvents(grid);
  setupMotion();
}

function renderNewsPage() {
  const list = $("[data-news-page-list]");
  const toolbar = $(".news-toolbar");
  if (!list || !toolbar) return;

  const render = (category = "全部") => {
    const posts = category === "全部" ? state.news : state.news.filter((post) => post.category === category);
    list.innerHTML = posts.map(newsRow).join("");
    attachNewsEvents(list);
    setupMotion();
  };

  toolbar.addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (!button) return;
    $$("button", toolbar).forEach((item) => item.classList.toggle("active", item === button));
    render(button.dataset.newsFilter);
  });

  render();
}

function openProduct(id) {
  const product = state.products.find((item) => String(item.id) === String(id));
  const dialog = $("[data-product-dialog]");
  const detail = $("[data-product-detail]");
  if (!product) return;
  if (!dialog || !detail) {
    location.href = `/product.html#${encodeURIComponent(product.slug)}`;
    return;
  }

  const specs = Object.entries(product.specs)
    .map(([key, value]) => `<span>${escapeHTML(key)}：${escapeHTML(value)}</span>`)
    .join("");

  detail.innerHTML = `
    <div class="detail-grid">
      <img src="${escapeHTML(product.image_url)}" alt="${escapeHTML(product.name)}" />
      <div>
        <span class="tag">${escapeHTML(product.category)}</span>
        <h2>${escapeHTML(product.name)}</h2>
        <p>${escapeHTML(product.description)}</p>
        <div class="spec-list">${specs}</div>
      </div>
    </div>
  `;
  dialog.showModal();
}

function openNews(id) {
  const post = state.news.find((item) => String(item.id) === String(id));
  const dialog = $("[data-news-dialog]");
  const detail = $("[data-news-detail]");
  if (!post) return;
  if (!dialog || !detail) {
    location.href = `/news.html#${encodeURIComponent(post.slug)}`;
    return;
  }

  detail.innerHTML = `
    <img src="${escapeHTML(post.image_url)}" alt="${escapeHTML(post.title)}" />
    <span class="tag">${escapeHTML(post.category)}</span>
    <time datetime="${escapeHTML(post.published_at)}">${escapeHTML(post.published_at)}</time>
    <h2>${escapeHTML(post.title)}</h2>
    <p>${escapeHTML(post.content)}</p>
  `;
  dialog.showModal();
}

function setupHeader() {
  const header = $("[data-header]");
  const nav = $("[data-nav]");
  const toggle = $("[data-nav-toggle]");
  if (header) {
    const onScroll = () => header.classList.toggle("is-scrolled", window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }
  if (toggle && nav) {
    toggle.addEventListener("click", () => nav.classList.toggle("is-open"));
    const groups = $$(".nav-group", nav);
    const desktopQuery = window.matchMedia("(min-width: 901px)");
    const closeGroups = () => groups.forEach((group) => group.classList.remove("is-open"));
    groups.forEach((group) => {
      const trigger = $(".nav-main", group);
      trigger?.addEventListener("click", () => {
        if (!desktopQuery.matches) return;
        closeGroups();
      });
      group.addEventListener("pointerenter", () => {
        if (!desktopQuery.matches) return;
        group.classList.add("is-open");
      });
      group.addEventListener("pointerleave", () => {
        if (!desktopQuery.matches) return;
        group.classList.remove("is-open");
      });
    });
    document.addEventListener("click", (event) => {
      if (!desktopQuery.matches) return;
      if (event.target.closest(".nav-group")) return;
      closeGroups();
    });
  }
}

function setupDialogs() {
  $$("[data-dialog-close]").forEach((button) => {
    button.addEventListener("click", () => button.closest("dialog")?.close());
  });
}

function setupSearch() {
  const dialog = $("[data-search-dialog]");
  const input = $("[data-search-input]");
  const results = $("[data-search-results]");
  const opener = $("[data-search-open]");
  if (!dialog || !input || !results || !opener) return;

  opener.addEventListener("click", () => {
    dialog.showModal();
    input.focus();
  });

  input.addEventListener("input", () => {
    const query = input.value.trim().toLowerCase();
    if (!query) {
      results.innerHTML = "";
      return;
    }

    const products = state.products
      .filter((item) => `${item.name} ${item.category} ${item.tagline}`.toLowerCase().includes(query))
      .map((item) => `<a href="/subpage.html?page=${encodeURIComponent(item.slug || item.id)}">${state.lang === "en" ? "Product:" : "产品："} ${escapeHTML(item.name)}</a>`);

    const news = state.news
      .map(localizeNews)
      .filter((item) => `${item.title} ${item.category} ${item.excerpt}`.toLowerCase().includes(query))
      .map((item) => `<a href="${escapeHTML(newsDestination(item))}">${state.lang === "en" ? "News:" : "动态："} ${escapeHTML(item.title)}</a>`);

    results.innerHTML = [...products, ...news].slice(0, 8).join("") || `<p>${state.lang === "en" ? "No matching content found." : "没有找到相关内容。"}</p>`;
  });
}

function setupContactForm() {
  const form = $("[data-contact-form]");
  const note = $("[data-contact-note]");
  if (!form || !note) return;
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    note.textContent = "已记录在当前浏览器预览中。上线后可继续接入邮箱、企业微信或 CRM。";
    form.reset();
  });
}

function animateCounter(element) {
  if (element.dataset.counterDone) return;
  element.dataset.counterDone = "true";
  const raw = Number(String(element.dataset.counter || "").replace(/[^\d.]/g, ""));
  if (!Number.isFinite(raw)) return;
  const suffix = element.dataset.counterSuffix || "";
  const format = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
  const duration = 1100;
  const started = performance.now();

  const tick = (now) => {
    const progress = Math.min((now - started) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const value = Math.round(raw * eased);
    element.textContent = `${format.format(value)}${suffix}`;
    if (progress < 1) {
      requestAnimationFrame(tick);
    }
  };

  requestAnimationFrame(tick);
}

function setupCounters() {
  const counters = $$("[data-counter]").filter((element) => !element.dataset.counterReady);
  if (!counters.length) return;
  counters.forEach((element) => {
    element.dataset.counterReady = "true";
  });

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    counters.forEach((element) => {
      const suffix = element.dataset.counterSuffix || "";
      element.textContent = `${element.dataset.counter || ""}${suffix}`;
    });
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        animateCounter(entry.target);
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.35 }
  );

  counters.forEach((element) => observer.observe(element));
}

function setupFaqOpen() {
  const items = $$(".faq-item").filter((element) => !element.dataset.faqOpenReady);
  if (!items.length) return;
  items.forEach((item) => {
    item.dataset.faqOpenReady = "true";
    item.open = true;
    const summary = $("summary", item);
    summary?.addEventListener("click", (event) => {
      event.preventDefault();
      item.open = true;
    });
    summary?.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      item.open = true;
    });
  });
}

function setupMotion() {
  const animated = [
    ".hero-content > *",
    ".ticker span",
    ".section-head > *",
    ".category-tabs button",
    ".product-card",
    ".about-copy > *",
    ".strength-board > div",
    ".service-list article",
    ".news-card",
    ".news-row",
    ".news-page-intro article",
    ".faq-item",
    ".contact-info-list > *",
    ".footer > *",
    ".marquee-item"
  ];
  const elements = $$(animated.join(",")).filter((element) => !element.dataset.motionReady);
  elements.forEach((element, index) => {
    element.dataset.motionReady = "true";
    element.style.setProperty("--reveal-index", String(index % 10));
  });

  if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.14, rootMargin: "0px 0px -8% 0px" }
    );
    elements.forEach((element) => observer.observe(element));
    window.setTimeout(() => {
      elements.forEach((element) => {
        if (!element.classList.contains("is-visible")) {
          element.classList.add("is-visible");
          observer.unobserve(element);
        }
      });
    }, 900);
  } else {
    elements.forEach((element) => element.classList.add("is-visible"));
  }

  const interactive = $$(".product-card, .news-card, .news-row, .service-list article, .contact-info-list a, .contact-info-list div, .btn, .category-tabs button, .news-toolbar button")
    .concat($$(".faq-item, .profile-frame, .marquee-item, .news-card-link"))
    .filter((element) => !element.dataset.pointerReady);
  interactive.forEach((element) => {
    element.dataset.pointerReady = "true";
    element.addEventListener("pointermove", (event) => {
      const rect = element.getBoundingClientRect();
      element.style.setProperty("--mx", `${event.clientX - rect.left}px`);
      element.style.setProperty("--my", `${event.clientY - rect.top}px`);
    });
  });

  if (motionScrollReady) return;
  motionScrollReady = true;
  setupCounters();
  setupFaqOpen();
  const updateScrollProgress = () => {
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    const progress = scrollable > 0 ? window.scrollY / scrollable : 0;
    document.documentElement.style.setProperty("--scroll-progress", progress.toFixed(4));
  };
  updateScrollProgress();
  window.addEventListener("scroll", updateScrollProgress, { passive: true });
}

async function init() {
  setupLanguage();
  setupHeader();
  setupDialogs();
  setupContactForm();
  await loadContent();
  renderHomeProducts();
  renderProductPage();
  renderHomeNews();
  renderNewsPage();
  setupSearch();
  setupMotion();
}

init().catch((error) => {
  console.error(error);
});
