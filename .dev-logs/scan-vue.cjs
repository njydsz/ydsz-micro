const fs = require('fs');
const path = require('path');

const ROOTS = process.argv.slice(2).length
  ? process.argv.slice(2)
  : ['comm', 'main', 'apps'];

const BUILTINS = new Set([
  'KeepAlive', 'Transition', 'TransitionGroup', 'Teleport', 'Suspense',
  'Component', 'Slot', 'Fragment',
]);

function walk(dir, out = []) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const e of entries) {
    if (e.name === 'node_modules' || e.name === 'dist' || e.name === '.git') continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full, out);
    else if (e.name.endsWith('.vue')) out.push(full);
  }
  return out;
}

function rel(p) {
  return path.relative(process.cwd(), p).split(path.sep).join('/');
}

const namedVueImports = [];
const unresolvedTags = [];

for (const root of ROOTS) {
  for (const file of walk(root)) {
    const src = fs.readFileSync(file, 'utf8');

    // ---- script blocks ----
    const scriptBlocks = [];
    const scriptRe = /<script\b([^>]*)>([\s\S]*?)<\/script>/g;
    let m;
    while ((m = scriptRe.exec(src))) scriptBlocks.push(m[2]);
    const script = scriptBlocks.join('\n');

    // strip comments to avoid false positives
    const clean = script.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');

    const local = new Set();
    const importRe = /import\s+([\s\S]*?)\s+from\s+['"]([^'"]+)['"]/g;
    let im;
    while ((im = importRe.exec(clean))) {
      const clause = im[1].trim();
      const spec = im[2];
      const namedMatch = clause.match(/\{([\s\S]*?)\}/);
      const defaultPart = clause.replace(/\{[\s\S]*?\}/, '').replace(/,/g, ' ').trim();
      if (defaultPart && !defaultPart.startsWith('*')) {
        local.add(defaultPart.split(/\s+/)[0]);
      }
      if (namedMatch) {
        const names = namedMatch[1]
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
          .map((s) => {
            const asMatch = s.match(/\bas\s+([A-Za-z0-9_$]+)$/);
            return asMatch ? asMatch[1] : s.split(/\s+/)[0];
          })
          .filter((n) => n !== 'type');
        names.forEach((n) => local.add(n));
        if (spec.endsWith('.vue') && im[1].includes('{')) {
          namedVueImports.push({ file: rel(file), spec, names });
        }
      }
    }

    // local declarations
    const declRe = /(?:const|let|var)\s+([A-Z][A-Za-z0-9_$]*)\s*=/g;
    let dm;
    while ((dm = declRe.exec(clean))) local.add(dm[1]);

    const nameMatch = clean.match(/defineOptions\s*\(\s*\{[\s\S]*?name\s*:\s*['"]([^'"]+)['"]/);
    const selfNames = new Set();
    if (nameMatch) selfNames.add(nameMatch[1]);
    // also file-name based self registration (Vue 3.3+ implicit)
    const base = path.basename(file, '.vue');
    selfNames.add(base);

    // ---- template ----
    const tplMatch = src.match(/<template\b[^>]*>([\s\S]*)<\/template>/);
    if (!tplMatch) continue;
    const tpl = tplMatch[1];
    const tagRe = /<([A-Z][A-Za-z0-9_]*)/g;
    const seen = new Set();
    let tm;
    while ((tm = tagRe.exec(tpl))) {
      const tag = tm[1];
      if (seen.has(tag)) continue;
      seen.add(tag);
      if (BUILTINS.has(tag)) continue;
      if (local.has(tag)) continue;
      if (selfNames.has(tag)) continue;
      unresolvedTags.push({ file: rel(file), tag });
    }
  }
}

console.log('=== named imports from .vue files ===');
for (const r of namedVueImports) console.log(`${r.file} <- ${r.spec} :: ${r.names.join(', ')}`);
console.log(`total: ${namedVueImports.length}`);

console.log('\n=== template tags not resolvable in script ===');
const byTag = new Map();
for (const r of unresolvedTags) {
  if (!byTag.has(r.tag)) byTag.set(r.tag, []);
  byTag.get(r.tag).push(r.file);
}
for (const [tag, files] of [...byTag.entries()].sort((a, b) => b[1].length - a[1].length)) {
  console.log(`${tag}  (${files.length})`);
  for (const f of files.slice(0, 6)) console.log(`    ${f}`);
  if (files.length > 6) console.log(`    ... +${files.length - 6}`);
}
console.log(`total files with unresolved tags: ${new Set(unresolvedTags.map((r) => r.file)).size}`);
