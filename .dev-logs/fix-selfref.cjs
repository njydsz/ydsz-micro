const fs = require('fs');
const path = require('path');

// intentional recursive components — keep self-reference
const KEEP = new Set([
  'comm\\@core\\ui-kit\\ydsz-ui\\src\\components\\organization-chart\\OrgNode.vue',
  'comm\\@core\\ui-kit\\ydsz-ui\\src\\components\\sidebar\\SidebarMenuItem.vue',
  'comm\\@core\\ui-kit\\ydsz-ui\\src\\components\\anchor\\YdAnchorLink.vue',
  'comm\\@core\\ui-kit\\ydsz-vue\\src\\Teleport\\Teleport.vue',
  'comm\\effects\\common-ui\\src\\components\\virtual-list\\YdVirtualList.vue',
].map((p) => path.resolve(p)));

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
for (const r of ['comm', 'main', 'apps']) walk(path.resolve(r));

let changed = 0;
const report = [];
for (const file of files) {
  if (KEEP.has(path.resolve(file))) continue;
  const src = fs.readFileSync(file, 'utf8');
  const tplStart = src.indexOf('<template');
  if (tplStart < 0) continue;
  const head = src.slice(0, tplStart);
  let tpl = src.slice(tplStart).replace(/<!--[\s\S]*?-->/g, (m) => m); // keep comments untouched
  const base = path.basename(file, '.vue');
  if (/^[a-z]/.test(base)) continue; // native-tag names

  // local non-type import identifiers
  const ids = new Set();
  const re = /import\s+(?:type\s+)?\{([^}]*)\}\s+from\s+['"][^'"]+['"]/g;
  let mm;
  while ((mm = re.exec(head))) {
    if (/^\s*import\s+type\b/.test(mm[0])) continue;
    for (const part of mm[1].split(',')) {
      const p = part.trim();
      if (!p) continue;
      const as = p.split(/\s+as\s+/);
      ids.add((as[1] || as[0]).trim());
    }
  }

  const target = [...ids].find((id) => base === `Yd${id}`);
  if (!target) continue;

  const before = tpl;
  const open = new RegExp(`<${base}(?=[\\s/>])`, 'g');
  const close = new RegExp(`</${base}\\s*>`, 'g');
  tpl = tpl
    .split(/(<!--[\s\S]*?-->)/)
    .map((seg, i) => (i % 2 === 1 ? seg : seg.replace(open, `<${target}`).replace(close, `</${target}>`)))
    .join('');
  if (tpl !== before) {
    fs.writeFileSync(file, head + tpl);
    changed++;
    report.push(`${path.relative(process.cwd(), file)}: <${base}> -> <${target}>`);
  }
}
console.log('changed files:', changed);
console.log(report.join('\n'));
