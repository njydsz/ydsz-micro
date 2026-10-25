const fs = require('fs');
const path = require('path');

const uiRoot = 'comm/@core/ui-kit/ydsz-ui/src';
const exported = new Set();
const visited = new Set();

function resolveBase(p) {
  const cands = [p, p + '.ts', p + '.tsx', p + '.vue', path.join(p, 'index.ts')];
  for (const c of cands) if (fs.existsSync(c) && fs.statSync(c).isFile()) return c;
  return null;
}

function scan(file) {
  if (!file || visited.has(file)) return;
  visited.add(file);
  const src = fs.readFileSync(file, 'utf8');
  const dir = path.dirname(file);
  const re = /export\s+(?:type\s+)?\{([\s\S]*?)\}\s*from\s*['"]([^'"]+)['"]/g;
  let m;
  while ((m = re.exec(src))) {
    const names = m[1];
    for (let part of names.split(',')) {
      part = part.trim();
      if (!part) continue;
      const asMatch = part.match(/\bas\s+([A-Za-z0-9_$]+)$/);
      exported.add(asMatch ? asMatch[1] : part.replace(/^type\s+/, '').trim());
    }
  }
  const star = /export\s+\*\s+from\s*['"]([^'"]+)['"]/g;
  while ((m = star.exec(src))) {
    const spec = m[1];
    if (spec.startsWith('.')) {
      const target = resolveBase(path.resolve(dir, spec));
      if (target) scan(target);
    }
  }
  const decl = /export\s+(?:declare\s+)?(?:default\s+)?(?:const|let|var|function|class|interface|type|enum|abstract\s+class)\s+([A-Za-z0-9_$]+)/g;
  while ((m = decl.exec(src))) exported.add(m[1]);
  const def = /export\s+default\s+([A-Za-z0-9_$]+)/g;
  while ((m = def.exec(src))) exported.add(m[1]);
}

scan(path.join(uiRoot, 'index.ts'));

const roots = ['apps', 'main', 'comm'];
const problems = [];
function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['node_modules', 'dist', '.turbo', 'coverage', 'archived'].includes(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (/\.(ts|tsx|vue)$/.test(e.name) && !/\.test\.|\.stories\./.test(e.name)) {
      const src = fs.readFileSync(p, 'utf8');
      const re = /import\s+(?:type\s+)?\{([^}]*)\}\s*from\s*['"]@ydsz-core\/ydsz-ui['"]/g;
      let m;
      while ((m = re.exec(src))) {
        for (let part of m[1].split(',')) {
          part = part.trim();
          if (!part) continue;
          const name = part.split(/\s+as\s+/)[0].replace(/^type\s+/, '').trim();
          if (name && !exported.has(name)) problems.push(p.split(path.sep).join('/') + ' -> ' + name);
        }
      }
    }
  }
}
for (const r of roots) walk(r);
console.log('exported names:', exported.size);
console.log('missing names:', problems.length);
console.log(problems.slice(0, 80).join('\n'));
