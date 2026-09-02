// Import the complete product details from cnryce.com into the local catalog.
// This keeps the source URL and downloaded source assets for traceability.
// Usage: node scripts/import-cnryce-products.mjs
import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const seedFile = path.join(root, "public", "content-seed.js");
const assetDir = path.join(root, "public", "assets", "cnryce", "source");
const sourceBase = "https://www.cnryce.com";
const concurrency = 6;

const sourceProducts = await import(`${pathToFileUrl(seedFile)}?t=${Date.now()}`);
const products = sourceProducts.DEFAULT_PRODUCTS;

function pathToFileUrl(file) {
  return new URL(`file://${file.replaceAll("\\", "/")}`).href;
}

function decodeEntities(value) {
  return String(value || "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#039;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([\da-f]+);/gi, (_, code) => String.fromCharCode(parseInt(code, 16)));
}

function htmlText(value) {
  return decodeEntities(String(value || "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, " "))
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s+/g, "\n")
    .trim();
}

function absoluteImageUrl(value) {
  if (!value) return null;
  try {
    const url = new URL(value, sourceBase);
    if (!/^https?:$/.test(url.protocol)) return null;
    url.search = "";
    url.hash = "";
    return url.href;
  } catch {
    return null;
  }
}

function extractProductJsonLd(html) {
  for (const match of html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const data = JSON.parse(match[1]);
      if (data?.["@type"] === "Product") return data;
    } catch {
      // Some unrelated JSON-LD blocks are not strict JSON. Ignore them.
    }
  }
  return {};
}

function extractDetailContent(html) {
  const start = html.indexOf('<div class="detail-content">');
  const end = html.indexOf('<div class="detail-related">', start);
  return start >= 0 && end > start ? html.slice(start + '<div class="detail-content">'.length, end) : "";
}

function extractAttributes(html) {
  const attributes = {};
  const block = html.match(/<div class="detail-intro-attr">([\s\S]*?)<\/div>\s*<div class="detail-intro-share">/i)?.[1] || "";
  for (const match of block.matchAll(/<div class="detail-attr-item">([\s\S]*?)<\/div>\s*<\/div>/gi)) {
    const label = htmlText(match[1].match(/detail-attr-label[^>]*>([\s\S]*?)<\/div>/i)?.[1]).replace(/:$/, "");
    const value = htmlText(match[1].match(/detail-attr-value[^>]*>([\s\S]*?)<\/div>/i)?.[1]);
    if (label && value) attributes[label] = value;
  }
  return attributes;
}

function extractTableSpecs(content) {
  const specs = {};
  for (const row of content.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)) {
    const cells = [...row[1].matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi)].map((cell) => htmlText(cell[1]));
    if (cells.length >= 2 && cells[0] && cells[1]) specs[cells[0].replace(/:$/, "")] = cells[1];
  }
  return specs;
}

function renameCodes(value) {
  return String(value || "")
    .replace(/\bRY(?=[\s-]?\d|\b)/gi, "PH")
    .replace(/\bPW(?=[\s-]?\d|\b)/gi, "VK");
}

function sourceBrandFor(product, title, attributes, specs) {
  const source = `${attributes.Brand || ""} ${title} ${specs.Model || ""} ${product.category}`;
  return /\bRY\b|\bRY[-\s]?\d|\bPH\s+Series\b/i.test(source) ? "RY" : attributes.Brand || "";
}

function localCategory(category) {
  if (category === "RY Series") return "PH Series";
  if (category === "PW Series") return "VK Series";
  return category;
}

function sourceImageList(html, jsonLd, content) {
  const detailStart = html.indexOf('<div class="detail-intro"');
  const detailEnd = html.indexOf('<div class="detail-related">', detailStart);
  const detailBlock = detailStart >= 0 && detailEnd > detailStart ? html.slice(detailStart, detailEnd) : html;
  const urls = [
    ...(Array.isArray(jsonLd.image) ? jsonLd.image : [jsonLd.image]),
    ...[...detailBlock.matchAll(/data-src=["']([^"']+)["']/gi)].map((match) => match[1]),
    ...[...content.matchAll(/<img[^>]+src\s*=\s*["']([^"']+)["']/gi)].map((match) => match[1])
  ];
  return [...new Set(urls.map(absoluteImageUrl).filter(Boolean))];
}

function localFileForUrl(url) {
  const parsed = new URL(url);
  let filename = path.basename(parsed.pathname) || "image.jpg";
  if (!/\.[a-z\d]{2,5}$/i.test(filename)) filename += ".jpg";
  return `/assets/cnryce/source/${filename}`;
}

function localPathForUrl(url) {
  return localFileForUrl(url);
}

function sanitizeDetailHtml(content, imageMap) {
  let safe = String(content || "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<\/?(script|style|iframe|object|embed|form|input|button)[^>]*>/gi, "")
    .replace(/\s+on[a-z-]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/\s+(?:style|width|height|border|cellpadding|cellspacing|x:str)\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "");

  safe = safe.replace(/(?:\s+|(?<=["']))(?:src|data-src)\s*=\s*["']([^"']+)["']/gi, (whole, value) => {
    const source = absoluteImageUrl(value);
    const local = source && imageMap.get(source);
    return local ? ` src="${local}"` : "";
  });
  safe = safe.replace(/\s+href\s*=\s*["']\s*javascript:[^"']*["']/gi, "");
  return safe.trim();
}

function parseMetaDescription(html) {
  return decodeEntities(html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i)?.[1] || "");
}

async function fetchText(url) {
  let lastError;
  for (let attempt = 0; attempt < 3; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 30000);
    try {
      const response = await fetch(url, { signal: controller.signal, headers: { "user-agent": "Mozilla/5.0 Panhiro catalog importer" } });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.text();
    } catch (error) {
      lastError = error;
      await new Promise((resolve) => setTimeout(resolve, 500 * (attempt + 1)));
    } finally {
      clearTimeout(timer);
    }
  }
  throw lastError;
}

async function downloadImage(url, targetPath) {
  try {
    await fs.access(targetPath);
    return;
  } catch {
    // Download below.
  }
  const parsed = new URL(url);
  if (parsed.hostname === "img.waimaoniu.net") {
    parsed.searchParams.set("x-oss-process", "image/resize,m_lfit,w_1600");
  }
  const response = await fetch(parsed.href, { headers: { "user-agent": "Mozilla/5.0 Panhiro catalog importer" } });
  if (!response.ok) throw new Error(`Image HTTP ${response.status}`);
  const buffer = Buffer.from(await response.arrayBuffer());
  if (!buffer.length) throw new Error("Empty image response");
  await fs.writeFile(targetPath, buffer);
}

async function parseOne(product) {
  const sourceUrl = `${sourceBase}/product/${product.slug}`;
  const html = await fetchText(sourceUrl);
  const jsonLd = extractProductJsonLd(html);
  const content = extractDetailContent(html);
  const attributes = extractAttributes(html);
  const tableSpecs = extractTableSpecs(content);
  const sourceTitle = String(jsonLd.name || html.match(/class="detail-intro-title"[^>]*>([\s\S]*?)<\/h1>/i)?.[1] || product.name).trim();
  const sourceBrand = sourceBrandFor(product, sourceTitle, attributes, tableSpecs);
  const brand = sourceBrand === "RY" ? "PH" : "VK";
  const rawImages = sourceImageList(html, jsonLd, content);
  const imageMap = new Map(rawImages.map((url) => [url, localPathForUrl(url)]));
  const localImages = rawImages.map((url) => imageMap.get(url));
  const specs = { ...product.specs, ...attributes, ...tableSpecs };
  if (specs.Brand) specs.Brand = brand;
  else specs.Brand = brand;
  if (specs.Model) specs.Model = renameCodes(specs.Model);
  if (sourceBrand !== "RY" && specs.Model && /\bPW\b/i.test(specs.Model)) specs.Model = renameCodes(specs.Model);

  return {
    ...product,
    name: renameCodes(sourceTitle),
    category: localCategory(product.category),
    tagline: parseMetaDescription(html) || product.tagline,
    description: String(jsonLd.description || product.description).trim(),
    image_url: localImages[0] || product.image_url,
    gallery: localImages.length ? localImages : [product.image_url],
    specs,
    source_url: sourceUrl,
    source_title: sourceTitle,
    source_brand: sourceBrand || "OTHER",
    brand,
    detail_html: renameCodes(sanitizeDetailHtml(content, imageMap))
  };
}

await fs.mkdir(assetDir, { recursive: true });
const results = [];
let cursor = 0;
async function worker() {
  while (true) {
    const index = cursor++;
    if (index >= products.length) return;
    const product = products[index];
    try {
      const result = await parseOne(product);
      results[index] = result;
      console.log(`[${index + 1}/${products.length}] ${product.slug}: ${result.gallery.length} images`);
    } catch (error) {
      results[index] = product;
      console.error(`[${index + 1}/${products.length}] FAILED ${product.slug}: ${error.message}`);
    }
  }
}
await Promise.all(Array.from({ length: concurrency }, worker));

// Rebuild the URL map from every page so inline detail images are also downloaded.
for (const product of results) {
  const html = await fetchText(product.source_url);
  const content = extractDetailContent(html);
  const jsonLd = extractProductJsonLd(html);
  for (const url of sourceImageList(html, jsonLd, content)) {
    const local = localPathForUrl(url);
    const target = path.join(root, "public", local.replace(/^\//, ""));
    try {
      await downloadImage(url, target);
    } catch (error) {
      console.error(`IMAGE FAILED ${url}: ${error.message}`);
    }
  }
}

const seed = await fs.readFile(seedFile, "utf8");
const start = seed.indexOf("export const DEFAULT_PRODUCTS = ");
const end = seed.indexOf("\n\nexport const DEFAULT_NEWS", start);
if (start < 0 || end < 0) throw new Error("Could not locate DEFAULT_PRODUCTS in content-seed.js");
const replacement = `export const DEFAULT_PRODUCTS = ${JSON.stringify(results, null, 2)};`;
await fs.writeFile(seedFile, seed.slice(0, start) + replacement + seed.slice(end), "utf8");

const summary = {
  products: results.length,
  sourceUrls: results.filter((product) => product.source_url).length,
  detailHtml: results.filter((product) => product.detail_html).length,
  images: new Set(results.flatMap((product) => product.gallery || [])).size,
  brands: results.reduce((counts, product) => {
    counts[product.brand] = (counts[product.brand] || 0) + 1;
    return counts;
  }, {})
};
console.log("Import complete", summary);
