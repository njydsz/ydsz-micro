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

/** 提取 <template> 区块 */
function extractTemplate(src) {
  const m = src.match(/<template>([\s\S]*?)<\/template>/);
  return m ? m[1] : '';
}

const PATTERNS = {
  /** 模板文本节点（含中文） */
  templateText: />([^<>{}]*[\u4e00-\u9fff][^<>{}]*)</g,
  /** 模板属性值（title/placeholder/label/message） */
  templateAttr: /(?:title|placeholder|label|message|description)\s*=\s*"([^"]*[\u4e00-\u9fff][^"]*)"/g,
  /** showToast 中文字面量 */
  toast: /showToast[^;]*?['"`]([^'"`]*[\u4e00-\u9fff][^'"`]*)['"`]/g,
};

const perApp = {};
const details = { templateText: [], templateAttr: [], toast: [] };

for (const app of fs.readdirSync(path.join(ROOT, 'apps'))) {
  const src = path.join(ROOT, 'apps', app, 'src');
  if (!fs.existsSync(src)) continue;
  perApp[app] = { templateText: 0, templateAttr: 0, toast: 0, files: new Set() };

  for (const f of walk(src)) {
    if (/\/api\//.test(f)) continue; // 跳过生成件
    const content = fs.readFileSync(f, 'utf8');

    const tpl = extractTemplate(content);
    for (const m of tpl.matchAll(PATTERNS.templateText)) {
      const t = m[1].trim();
      if (t) { perApp[app].templateText++; details.templateText.push([path.relative(ROOT, f), t.slice(0, 40)]); }
    }
    for (const m of tpl.matchAll(PATTERNS.templateAttr)) {
      const t = m[1].trim();
      if (t) { perApp[app].templateAttr++; details.templateAttr.push([path.relative(ROOT, f), t.slice(0, 40)]); }
    }
    for (const m of content.matchAll(PATTERNS.toast)) {
      const t = m[1].trim();
      if (t) { perApp[app].toast++; details.toast.push([path.relative(ROOT, f), t.slice(0, 40)]); }
    }
  }
}

console.log('=== 按 app 统计 ===');
let tt = 0, ta = 0, to = 0;
for (const [app, s] of Object.entries(perApp)) {
  console.log(`${app}: 模板文本=${s.templateText} 模板属性=${s.templateAttr} toast=${s.toast}`);
  tt += s.templateText; ta += s.templateAttr; to += s.toast;
}
console.log(`\n合计: 模板文本=${tt} 模板属性=${ta} toast=${to}`);

console.log('\n=== 模板文本 Top 15 文件 ===');
const byFile = {};
for (const [f, t] of details.templateText) byFile[f] = (byFile[f] || 0) + 1;
Object.entries(byFile).sort((a, b) => b[1] - a[1]).slice(0, 15).forEach(([f, n]) => console.log(String(n).padStart(4) + '  ' + f));

console.log('\n=== toast 示例 ===');
details.toast.slice(0, 8).forEach(([f, t]) => console.log(`${f}: ${t}`));
