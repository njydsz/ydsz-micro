const http = require('http');

const BASE = process.argv[2] || 'http://127.0.0.1:5600';
const STARTS = (process.argv[3] || '/src/main.ts').split(',');
const MAX = Number(process.argv[4] || 6000);

const cache = new Map();
const exportsCache = new Map();

function get(url) {
  if (cache.has(url)) return cache.get(url);
  const p = new Promise((resolve) => {
    const u = new URL(url, BASE);
    http
      .get({ hostname: u.hostname, port: u.port, path: u.pathname + u.search }, (res) => {
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => resolve({ status: res.statusCode, body: Buffer.concat(chunks).toString('utf8'), url: u.href }));
      })
      .on('error', () => resolve({ status: 0, body: '', url }));
  });
  cache.set(url, p);
  return p;
}

function skipUrl(u) {
  return u.includes('/node_modules/.vite/deps/') || u.includes('/@id/') || u.includes('/@vite/') || u.includes('/@react-refresh');
}

function absOf(spec, from) {
  if (!spec.startsWith('/') && !spec.startsWith('.')) return null;
  try {
    const abs = new URL(spec, from).href;
    if (skipUrl(abs)) return null;
    return abs;
  } catch {
    return null;
  }
}

function localDecls(body) {
  const names = new Set();
  let m;
  const declRe = /export\s+(?:default\s+)?(?:const|let|var|function\*?|class|async\s+function)\s+([A-Za-z0-9_$]+)/g;
  while ((m = declRe.exec(body))) names.add(m[1]);
  const destructRe = /export\s+(?:const|let|var)\s+[[{]([^\]}]*)[\]}]/g;
  while ((m = destructRe.exec(body))) {
    m[1].split(',').map((s) => s.trim()).filter(Boolean).forEach((s) => {
      const asM = s.match(/\bas\s+([A-Za-z0-9_$]+)$/);
      names.add(asM ? asM[1] : s.split(/[\s:=]/)[0]);
    });
  }
  if (/export\s+default\b/.test(body)) names.add('default');
  return names;
}

async function resolveExports(url, depth = 0, stack = new Set()) {
  if (exportsCache.has(url)) return exportsCache.get(url);
  if (depth > 8 || stack.has(url)) return { names: new Set(), unknown: false };
  stack.add(url);
  const res = await get(url);
  const names = new Set();
  let unknown = false;
  if (res.status !== 200) return { names, unknown };
  const body = res.body;
  for (const n of localDecls(body)) names.add(n);

  let m;
  const clauseRe = /export\s*\{([^}]*)\}\s*(?:from\s*["']([^"']+)["'])?/g;
  while ((m = clauseRe.exec(body))) {
    const spec = m[2];
    const target = spec ? absOf(spec, url) : null;
    const targetNames = target ? (await resolveExports(target, depth + 1, stack)).names : null;
    for (const raw of m[1].split(',').map((s) => s.trim()).filter(Boolean)) {
      if (raw.startsWith('type ') && !/^type\s+[A-Za-z0-9_$]+\s+as\b/.test(raw)) continue;
      const cleaned = raw.replace(/^type\s+/, '');
      const asM = cleaned.match(/\bas\s+([A-Za-z0-9_$]+)$/);
      const imported = asM ? cleaned.split(/\s+as\s+/)[0].trim() : cleaned.split(/\s+/)[0];
      const exported = asM ? asM[1] : imported;
      if (targetNames) {
        if (targetNames.has(imported)) names.add(exported);
      } else {
        names.add(exported);
      }
    }
  }

  const starRe = /export\s*\*\s*(?:as\s+([A-Za-z0-9_$]+)\s*)?from\s*["']([^"']+)["']/g;
  while ((m = starRe.exec(body))) {
    if (m[1]) {
      names.add(m[1]);
      continue;
    }
    const target = absOf(m[2], url);
    if (!target) {
      unknown = true;
      continue;
    }
    const sub = await resolveExports(target, depth + 1, stack);
    if (sub.unknown) unknown = true;
    for (const n of sub.names) if (n !== 'default') names.add(n);
  }

  stack.delete(url);
  const out = { names, unknown };
  exportsCache.set(url, out);
  return out;
}

function importsOf(body) {
  const out = [];
  const re = /(?:^|\n)[ \t]*import\s+(?!\()([^;\n]*?)\s+from\s*["']([^"']+)["']/g;
  let m;
  while ((m = re.exec(body))) {
    out.push({ clause: m[1].trim(), spec: m[2] });
  }
  const dynRe = /import\(\s*["']([^"']+)["']\s*\)/g;
  while ((m = dynRe.exec(body))) {
    out.push({ clause: '', spec: m[1] });
  }
  const expRe = /export\s+(?:\*(?:\s+as\s+[A-Za-z0-9_$]+)?|\{[^}]*\})\s+from\s*["']([^"']+)["']/g;
  while ((m = expRe.exec(body))) {
    out.push({ clause: '', spec: m[1] });
  }
  return out;
}

(async () => {
  const seen = new Set();
  const queue = STARTS.map((s) => new URL(s, BASE).href);
  const problems = [];
  let count = 0;
  while (queue.length && count < MAX) {
    const url = queue.shift();
    if (seen.has(url)) continue;
    seen.add(url);
    if (skipUrl(url)) continue;
    const res = await get(url);
    count++;
    if (res.status !== 200) {
      problems.push({ kind: `HTTP ${res.status}`, url, detail: res.body.replace(/\n/g, ' ').slice(0, 200) });
      continue;
    }
    const body = res.body;
    // 校验 `export { A } from './x'` 中的名字在目标模块真实存在（ESM 链接期致命）
    const reExpRe = /(^|\n)[ \t]*export\s+(type\s+)?\{([^}]*)\}\s*from\s*["']([^"']+)["']/g;
    let rm;
    while ((rm = reExpRe.exec(body))) {
      if (rm[2]) continue;
      const abs = absOf(rm[4], url);
      if (!abs) continue;
      let resolved = null;
      try {
        resolved = await resolveExports(abs);
      } catch {
        continue;
      }
      if (resolved.unknown) continue;
      for (const raw of rm[3].split(',').map((s) => s.trim()).filter(Boolean)) {
        const cleaned = raw.replace(/^type\s+/, '');
        const asM = cleaned.match(/\bas\s+([A-Za-z0-9_$]+)$/);
        const imported = asM ? cleaned.split(/\s+as\s+/)[0].trim() : cleaned.split(/\s+/)[0];
        if (!resolved.names.has(imported)) {
          problems.push({
            kind: 'bad re-export',
            url,
            detail: `re-exports ${imported} from ${abs.replace(BASE, '')}`,
          });
        }
      }
    }
    for (const imp of importsOf(body)) {
      const abs = absOf(imp.spec, url);
      if (!abs) continue;
      if (!seen.has(abs)) queue.push(abs);
      const named = imp.clause.match(/\{([\s\S]*?)\}/);
      if (!named) continue;
      let resolved = null;
      try {
        resolved = await resolveExports(abs);
      } catch {
        continue;
      }
      if (resolved.unknown) continue;
      const names = resolved.names;
      const req = named[1]
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
        .filter((s) => !s.startsWith('type '))
        .map((s) => {
          const asM = s.match(/\bas\s+([A-Za-z0-9_$]+)$/);
          return asM ? { imported: s.split(/\s+as\s+/)[0].trim(), local: asM[1] } : { imported: s.split(/\s+/)[0], local: s.split(/\s+/)[0] };
        })
        .filter((s) => s.imported !== 'default');
      for (const r of req) {
        if (!names.has(r.imported)) {
          problems.push({
            kind: 'missing export',
            url,
            detail: `imports ${r.imported} (as ${r.local}) from ${abs.replace(BASE, '')}`,
          });
        }
      }
    }
  }
  console.log(`crawled ${count} modules`);
  const uniq = new Map();
  for (const p of problems) {
    const key = `${p.kind} :: ${p.url} :: ${p.detail}`;
    if (!uniq.has(key)) uniq.set(key, p);
  }
  for (const p of uniq.values()) {
    console.log(`[${p.kind}] ${p.url.replace(BASE, '')}`);
    console.log(`    ${p.detail}`);
  }
  console.log(`total problems: ${uniq.size}`);
})();
