import fs from 'node:fs';
import path from 'node:path';

const ROOT = 'D:/Code/open/ydsz-micro';
const hits = JSON.parse(fs.readFileSync(path.join(ROOT, 'bash/__toast-hits.json'), 'utf8'));
const keyMap = new Map(
  JSON.parse(fs.readFileSync(path.join(ROOT, 'bash/__toast-key-map.json'), 'utf8')),
);

/** 按文件聚合 */
const byFile = new Map();
for (const h of hits) {
  const abs = path.join(ROOT, h.file);
  if (!byFile.has(abs)) byFile.set(abs, []);
  byFile.get(abs).push(h);
}

/** 检查文件是否已导入 $t */
function hasTImport(src) {
  return /import\s*\{\s*\$t\s*\}\s*from\s*'@ydsz\/locales'/.test(src);
}

let modified = 0;
let skipped = 0;

for (const [abs, list] of byFile) {
  let src = fs.readFileSync(abs, 'utf8');
  const rel = path.relative(ROOT, abs);

  let changed = false;
  // 逐条替换（用唯一文本 + 引号精确匹配）
  for (const h of list) {
    const key = keyMap.get(h.text);
    if (!key) continue;

    // 处理三种引号
    for (const q of ["'", '"', '`']) {
      const literal = `${q}${h.text}${q}`;
      if (src.includes(literal)) {
        src = src.replace(literal, `$t('${key}')`);
        changed = true;
      }
    }
  }

  if (!changed) {
    skipped++;
    continue;
  }

  // 确保 $t 已导入
  if (!hasTImport(src)) {
    // 插到 script 内第一个 import 之后
    const m = src.match(/<script[^>]*>\n/);
    if (!m) { skipped++; continue; }
    const pos = m.index + m[0].length;
    src = `${src.slice(0, pos)}import { $t } from '@ydsz/locales';\n${src.slice(pos)}`;
  }

  const tmp = abs + '.tmp';
  fs.writeFileSync(tmp, src, 'utf8');
  try {
    fs.renameSync(tmp, abs);
    modified++;
  } catch {
    // 锁定时保留 tmp，交由后续处理
    console.log(`LOCKED: ${rel}`);
  }
}

console.log(`modified: ${modified}, skipped: ${skipped}`);
