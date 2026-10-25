const fs = require('fs');
const path = require('path');

const ROOTS = process.argv.slice(2).length ? process.argv.slice(2) : ['comm', 'main', 'apps'];
const cache = new Map();

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
    else if (/\.(vue|ts)$/.test(e.name) && !/\.(test|spec|stories)\.ts$/.test(e.name)) out.push(full);
  }
  return out;
}

function splitScriptBlocks(src) {
  const out = [];
  const re = /<script\b([^>]*)>([\s\S]*?)<\/script>/g;
  let m;
  while ((m = re.exec(src))) out.push({ attrs: m[1], body: m[2] });
  return out;
}

function collectExports(body) {
  const names = new Set();
  const clean = body.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/[^\n]*/g, '$1');
  const declRe = /export\s+(?:declare\s+)?(?:interface|type|const|let|var|function\*?|class|enum)\s+([A-Za-z0-9_$]+)/g;
  let m;
  while ((m = declRe.exec(clean))) names.add(m[1]);
  const namedRe = /export\s*\{([^}]*)\}/g;
  while ((m = namedRe.exec(clean))) {
    m[1].split(',').map((s) => s.trim()).filter(Boolean).forEach((s) => {
      if (s.startsWith('type ')) s = s.slice(5).trim();
      const asM = s.match(/\bas\s+([A-Za-z0-9_$]+)$/);
      names.add(asM ? asM[1] : s.split(/\s+/)[0]);
    });
  }
  return names;
}

function vueExports(file) {
  if (cache.has(file)) return cache.get(file);
  const src = fs.readFileSync(file, 'utf8');
  const names = new Set(['default']);
  let hasPlainScript = false;
  for (const b of splitScriptBlocks(src)) {
    const isSetup = /\bsetup\b/.test(b.attrs);
    if (!isSetup) hasPlainScript = true;
    for (const n of collectExports(b.body)) names.add(n);
  }
  const result = { names, hasPlainScript };
  cache.set(file, result);
  return result;
}

function importsOf(scriptBody) {
  const clean = scriptBody
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/[^\n]*/g, '$1');
  const out = [];
  const re = /^import\s+(type\s+)?([\s\S]*?)from\s*['"]([^'"]+)['"]/gm;
  let m;
  while ((m = re.exec(clean))) {
    out.push({ typeOnly: !!m[1], clause: m[2].trim(), spec: m[3] });
  }
  return out;
}

const problems = [];

function check(file, imp) {
  if (!imp.spec.endsWith('.vue')) return;
  if (!imp.clause.includes('{')) return;
  const target = path.resolve(path.dirname(file), imp.spec);
  if (!fs.existsSync(target)) {
    problems.push({ file, spec: imp.spec, reason: 'missing file', names: '' });
    return;
  }
  const { names: avail, hasPlainScript } = vueExports(target);
  const inner = imp.clause.match(/\{([\s\S]*?)\}/)[1];
  const missing = inner
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .filter((s) => {
      if (imp.typeOnly || s.startsWith('type ')) return false;
      const base = s.split(/\s+as\s+/)[0].trim();
      return base !== 'default' && !avail.has(base);
    })
    .map((s) => s.split(/\s+as\s+/)[0].trim());
  if (!missing.length) return;
  problems.push({
    file,
    spec: imp.spec,
    reason: hasPlainScript ? 'no such export' : 'named import from <script setup> only',
    names: missing.join(', '),
  });
}

for (const root of ROOTS) {
  for (const file of walk(root)) {
    const src = fs.readFileSync(file, 'utf8');
    const blocks = file.endsWith('.vue') ? splitScriptBlocks(src).map((b) => b.body) : [src];
    for (const body of blocks) for (const imp of importsOf(body)) check(file, imp);
  }
}

const rel = (p) => path.relative(process.cwd(), p).split(path.sep).join('/');
for (const p of problems) console.log(`${rel(p.file)} <- ${p.spec} :: ${p.reason} :: ${p.names}`);
console.log(`total problems: ${problems.length}`);
