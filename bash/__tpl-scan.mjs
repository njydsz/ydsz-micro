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
    } else if (e.name.endsWith('.vue')) acc.push(p);
  }
  return acc;
}

const rows = [];
for (const app of fs.readdirSync(path.join(ROOT, 'apps'))) {
  const src = path.join(ROOT, 'apps', app, 'src');
  if (!fs.existsSync(src)) continue;
  for (const f of walk(src)) {
    if (/\/api\//.test(f)) continue;
    const content = fs.readFileSync(f, 'utf8');
    const m = content.match(/<template>([\s\S]*?)<\/template>/);
    if (!m) continue;
    const tpl = m[1];
    const matches = [...tpl.matchAll(/>([^<>{}]*[\u4e00-\u9fff][^<>{}]*)</g)];
    if (matches.length === 0) continue;

    // 检查是否已使用 i18n
    const hasI18n = /\$t\(|useI18n/.test(content);

    rows.push({
      file: path.relative(ROOT, f),
      count: matches.length,
      hasI18n,
      samples: matches.slice(0, 4).map((x) => x[1].trim().slice(0, 30)),
    });
  }
}

rows.sort((a, b) => b.count - a.count);
console.log('files:', rows.length);
console.log('total nodes:', rows.reduce((s, r) => s + r.count, 0));
console.log('with i18n:', rows.filter((r) => r.hasI18n).length);
console.log('without i18n:', rows.filter((r) => !r.hasI18n).length);
console.log('');
for (const r of rows.slice(0, 20)) {
  console.log(`${String(r.count).padStart(3)} ${r.hasI18n ? 'i18n' : '    '} ${r.file}`);
  console.log(`      e.g. ${r.samples.join(' | ')}`);
}
