// 一次性修复脚本：清理 content-seed.js 中的垃圾 specs 占位值
// - 删除 "High pressure" / "Cleaning washer" / "Water cleaning" 等占位垃圾
// - 删除与产品 category 重复的 Category 键
// - 从 description 提取真实参数（W/kW、bar/psi、L/min）回填 Power/Pressure/Flow
import fs from "node:fs";

const FILE = "E:/大老哥影视/deepseek - 副本/public/content-seed.js";
const text = fs.readFileSync(FILE, "utf8");

const GARBAGE = new Set([
  "high pressure",
  "cleaning washer",
  "water cleaning",
  "high pressure washer",
  "cleaning machine",
  "car washer",
  "washing machine",
  "cleaner machine",
  "cleaner",
  "cleaning",
  "washer"
]);

function extractFromDescription(desc) {
  const out = {};
  const power = String(desc || "").match(/(\d+(?:\.\d+)?\s*(?:kw|watts?|w))\b/i);
  if (power) out.Power = power[1];
  const pressure = String(desc || "").match(/(\d+(?:\.\d+)?\s*(?:bar|bars|psi|mpa))\b/i);
  if (pressure) out.Pressure = pressure[1];
  const flow = String(desc || "").match(/(\d+(?:\.\d+)?\s*(?:l\/min|lpm|l\/m|liters?\s+per\s+minute|litres?\s+per\s+minute))\b/i);
  if (flow) out.Flow = flow[1];
  return out;
}

function cleanSpecs(specs, product) {
  const out = {};
  const extracted = extractFromDescription(product.description || "");
  for (const [key, value] of Object.entries(specs || {})) {
    const val = String(value ?? "").trim();
    if (key === "Category") continue; // 与产品 category 重复
    const isGarbage = !val || GARBAGE.has(val.toLowerCase());
    if (isGarbage) {
      const fill = extracted[key];
      if (fill) out[key] = fill; // 回填真实参数
      continue;
    }
    out[key] = val;
  }
  return out;
}

// 按产品 id 切分：定位每个产品的对象块（"id": N 到下一个 "id": 或文件尾）
function productBlocks(text) {
  const blocks = [];
  const idRe = /"id":\s*(\d+)/g;
  let m;
  let prev = null;
  while ((m = idRe.exec(text))) {
    if (prev) prev.end = m.index;
    prev = { id: Number(m[1]), start: m.index, end: text.length };
    blocks.push(prev);
  }
  return blocks;
}

// 从产品块中提取 description 与 specs 文本
function extractFields(blockText) {
  const descMatch = blockText.match(/"description":\s*"((?:[^"\\]|\\.)*)"/);
  const specsMatch = blockText.match(/"specs":\s*\{([\s\S]*?)\n    \}/);
  return {
    description: descMatch ? JSON.parse(`"${descMatch[1]}"`) : "",
    specsText: specsMatch ? specsMatch[1] : null
  };
}

const blocks = productBlocks(text);
let changed = 0;
const report = [];
for (const block of blocks) {
  const blockText = text.slice(block.start, block.end);
  const { description, specsText } = extractFields(blockText);
  if (!specsText) continue;
  let specs;
  try {
    specs = JSON.parse(`{${specsText}}`);
  } catch {
    continue;
  }
  const cleaned = cleanSpecs(specs, { description });
  if (JSON.stringify(specs) === JSON.stringify(cleaned)) continue;
  changed++;
  const removed = Object.keys(specs).filter((k) => !(k in cleaned));
  const added = Object.keys(cleaned).filter((k) => !(k in specs));
  report.push(
    `#${block.id}: ${Object.keys(specs).length}→${Object.keys(cleaned).length} 项` +
      (removed.length ? ` 移除[${removed.join(",")}]` : "") +
      (added.length ? ` 回填[${added.map((k) => `${k}=${cleaned[k]}`).join(",")}]` : "")
  );
}

if (changed) {
  const newText = text.replace(/"specs":\s*\{[\s\S]*?\n    \}/g, (block, offset) => {
    const blockInfo = blocks.find((b) => offset >= b.start && offset < b.end);
    if (!blockInfo) return block;
    const blockText = text.slice(blockInfo.start, blockInfo.end);
    const { description, specsText } = extractFields(blockText);
    if (!specsText) return block;
    let specs;
    try {
      specs = JSON.parse(`{${specsText}}`);
    } catch {
      return block;
    }
    const cleaned = cleanSpecs(specs, { description });
    if (JSON.stringify(specs) === JSON.stringify(cleaned)) return block;
    const inner = Object.entries(cleaned)
      .map(([k, v]) => `      "${k}": "${String(v).replace(/"/g, '\\"')}"`)
      .join(",\n");
    return `"specs": {\n${inner}\n    }`;
  });
  fs.writeFileSync(FILE, newText, "utf8");
}

console.log(`修改产品数: ${changed}/87`);
report.forEach((line) => console.log("  " + line));
