const fs = require('fs');
const path = require('path');

const roots = ['comm', 'main', 'apps'];
const files = [];

function walk(dir) {
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
  for (const e of entries) {
    if (e.name === 'node_modules' || e.name === 'dist' || e.name === '.git') continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (e.name.endsWith('.vue')) files.push(p);
  }
}
for (const r of roots) walk(path.resolve(r));

function kebab(s) {
  return s.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}

const hits = [];
for (const file of files) {
  const src = fs.readFileSync(file, 'utf8');
  const tplStart = src.indexOf('<template');
  if (tplStart < 0) continue;
  const tpl = src.slice(tplStart).replace(/<!--[\s\S]*?-->/g, '');
  const script = src.slice(0, tplStart);
  const base = path.basename(file, '.vue');
  const names = new Set([base]);
  const m1 = src.match(/<script[^>]*\bname="([^"]+)"/);
  if (m1) names.add(m1[1]);
  const m2 = src.match(/defineOptions\(\s*\{[^}]*\bname:\s*['"]([^'"]+)['"]/s);
  if (m2) names.add(m2[1]);

  for (const n of names) {
    if (/^[a-z]/.test(n)) continue; // native tag
    const re = new RegExp(`<(/)?${n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?=[\\s/>])`, 'g');
    if (!re.test(tpl)) continue;
    // Is there a local import bound to this exact name?
    const imported = new RegExp(`\\bimport\\s+(?:[\\w*{}\\s,]+\\s+from\\s+)?['"][^'"]+['"]`).test(script) && (
      new RegExp(`\\bas\\s+${n}\\b`).test(script) ||
      new RegExp(`\\bimport\\s+${n}\\s+from\\b`).test(script) ||
      new RegExp(`\\bimport\\s*\\{[^}]*\\b${n}\\b[^}]*\\}\\s*from`).test(script)
    );
    // Top-level const/let/function binding with same name
    const declared = new RegExp(`\\b(?:const|let|function|class)\\s+${n}\\b`).test(script);
    if (imported || declared) continue;
    hits.push({ file: path.relative(process.cwd(), file), name: n });
    break;
  }
}

console.log('scanned', files.length, 'vue files; REAL self-ref hits:', hits.length);
for (const h of hits) console.log(`${h.file}  <${h.name}>`);
