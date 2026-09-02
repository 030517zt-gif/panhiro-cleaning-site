// 图片压缩脚本：assets 目录下大图批量优化
// - PNG > 400KB 转为同名 .webp（质量 80，保留透明通道）
// - JPG/JPEG > 150KB 重新压缩为渐进式 JPEG（质量 80，覆盖原文件，无需改引用）
// 用法: node scripts/compress-images.mjs [assetsDir]
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const assetsDir = process.argv[2] || path.resolve(__dirname, "../public/assets");

const PNG_THRESHOLD = 400 * 1024;
const JPG_THRESHOLD = 150 * 1024;

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, files);
    else if (/\.(png|jpe?g)$/i.test(entry.name)) files.push(full);
  }
  return files;
}

async function main() {
  const files = walk(assetsDir);
  const pngs = files.filter((f) => /\.png$/i.test(f));
  const jpgs = files.filter((f) => /\.jpe?g$/i.test(f));

  let savedBefore = 0;
  let savedAfter = 0;
  const converted = []; // {from, to}

  // 1) 大 PNG → WebP（同名换扩展名，需要同步更新引用）
  for (const png of pngs) {
    const stat = fs.statSync(png);
    if (stat.size < PNG_THRESHOLD) continue;
    const webp = png.replace(/\.png$/i, ".webp");
    const info = await sharp(png).webp({ quality: 80, effort: 4 }).toFile(webp);
    savedBefore += stat.size;
    savedAfter += info.size;
    converted.push({ from: png, to: webp });
    console.log(
      `PNG→WebP: ${path.basename(png)} ${(stat.size / 1024).toFixed(0)}KB → ${(info.size / 1024).toFixed(0)}KB (-${Math.round((1 - info.size / stat.size) * 100)}%)`
    );
  }

  // 2) 大 JPG/JPEG → 重压缩覆盖（引用不变）
  for (const jpg of jpgs) {
    const stat = fs.statSync(jpg);
    if (stat.size < JPG_THRESHOLD) continue;
    const tmp = jpg + ".tmp";
    const info = await sharp(jpg).rotate().jpeg({ quality: 80, progressive: true, mozjpeg: true }).toFile(tmp);
    fs.renameSync(tmp, jpg);
    savedBefore += stat.size;
    savedAfter += info.size;
    console.log(
      `JPG: ${path.basename(jpg)} ${(stat.size / 1024).toFixed(0)}KB → ${(info.size / 1024).toFixed(0)}KB (-${Math.round((1 - info.size / stat.size) * 100)}%)`
    );
  }

  console.log(`\n合计: ${(savedBefore / 1024 / 1024).toFixed(1)}MB → ${(savedAfter / 1024 / 1024).toFixed(1)}MB`);

  // 输出待更新引用的映射，便于手动同步代码里的 .png → .webp
  if (converted.length) {
    console.log("\n以下文件已转为 .webp，代码中的引用需要同步更新：");
    for (const { from, to } of converted) {
      const relFrom = path.relative(assetsDir, from).replace(/\\/g, "/");
      const relTo = path.relative(assetsDir, to).replace(/\\/g, "/");
      console.log(`  /assets/${relFrom}  →  /assets/${relTo}`);
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
