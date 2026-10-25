const http = require('http');

const BASE = process.argv[2] || 'http://127.0.0.1:5600';
const STARTS = (process.argv[3] || '/src/main.ts').split(',');
const MAX = Number(process.argv[4] || 2500);

function get(url) {
  return new Promise((resolve) => {
    const u = new URL(url, BASE);
    http
      .get({ hostname: u.hostname, port: u.port, path: u.pathname + u.search, headers: { 'x-dev-crawl': '1' } }, (res) => {
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => resolve({ status: res.statusCode, body: Buffer.concat(chunks).toString('utf8'), url: u.href }));
      })
      .on('error', () => resolve({ status: 0, body: '', url }));
  });
}

(async () => {
  const seen = new Set();
  const queue = STARTS.map((s) => new URL(s, BASE).href);
  const hits = [];
  let count = 0;
  while (queue.length && count < MAX) {
    const url = queue.shift();
    if (seen.has(url)) continue;
    seen.add(url);
    const res = await get(url);
    count++;
    if (res.status !== 200) {
      hits.push({ kind: 'non-200', url, status: res.status, body: res.body.slice(0, 300) });
      continue;
    }
    const body = res.body;
    if (/YdBreadcrumb/.test(body) && /dropdown-menu\/index/.test(body)) {
      const lines = body.split('\n').filter((l) => l.includes('YdBreadcrumb'));
      hits.push({ kind: 'mentions-YdBreadcrumb', url, lines: lines.slice(0, 4) });
    }
    const specRe = /(?:from|import)\s*\(?\s*["']([^"']+)["']/g;
    let m;
    while ((m = specRe.exec(body))) {
      const spec = m[1];
      if (!spec.startsWith('/') && !spec.startsWith('.')) continue;
      let abs;
      try {
        abs = new URL(spec, url).href;
      } catch {
        continue;
      }
      if (abs.includes('/node_modules/.vite/deps/')) continue;
      if (!seen.has(abs)) queue.push(abs);
    }
  }
  console.log(`crawled ${count} modules from ${STARTS.join(',')}`);
  for (const h of hits) {
    console.log('---');
    console.log(`[${h.kind}] ${h.url}${h.status ? ' status=' + h.status : ''}`);
    if (h.lines) h.lines.forEach((l) => console.log('   ' + l.trim().slice(0, 300)));
    if (h.body) console.log('   ' + h.body.replace(/\n/g, ' ').slice(0, 300));
  }
})();
