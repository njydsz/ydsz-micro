import fs from 'node:fs';
import path from 'node:path';

const ROOT = 'D:/Code/open/ydsz-micro';

function walk(dir, acc = []) {
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return acc; }
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === 'node_modules' || e.name === 'dist' || e.name === 'archived') continue;
      walk(p, acc);
    } else if (/\.(vue|ts)$/.test(e.name)) acc.push(p);
  }
  return acc;
}

/** 精确匹配 showToast(...) 调用的首参字面量 */
const TOAST_RE = /showToast(?:\.[a-z]+)?\s*\(\s*['"`]([^'"`]*)['"`]/g;

const hits = [];
for (const app of fs.readdirSync(path.join(ROOT, 'apps'))) {
  const src = path.join(ROOT, 'apps', app, 'src');
  if (!fs.existsSync(src)) continue;
  for (const f of walk(src)) {
    if (/\/api\//.test(f)) continue;
    const content = fs.readFileSync(f, 'utf8');
    for (const m of content.matchAll(TOAST_RE)) {
      const arg = m[1];
      if (/[\u4e00-\u9fff]/.test(arg)) {
        hits.push({ file: path.relative(ROOT, f), text: arg, index: m.index });
      }
    }
  }
}

const unique = [...new Set(hits.map((h) => h.text))];
console.log('total occurrences:', hits.length);
console.log('unique texts:', unique.length);

fs.writeFileSync(
  path.join(ROOT, 'bash/__toast-hits.json'),
  JSON.stringify(hits, null, 0),
  'utf8',
);
fs.writeFileSync(
  path.join(ROOT, 'bash/__toast-unique.json'),
  JSON.stringify(unique, null, 0),
  'utf8',
);
console.log('wrote bash/__toast-hits.json + __toast-unique.json');
