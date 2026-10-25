const fs = require('fs');
const path = require('path');

function walk(dir, acc = []) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    const st = fs.statSync(p);
    if (st.isDirectory()) walk(p, acc);
    else if (p.endsWith('.vue')) acc.push(p);
  }
  return acc;
}

for (const file of walk(process.argv[2])) {
  const src = fs.readFileSync(file, 'utf8');
  const m = src.match(/<script[^>]*>([\s\S]*?)<\/script>/);
  if (!m) continue;
  const script = m[1];
  const tags = new Set([...src.matchAll(/<([A-Z][A-Za-z0-9]*)[\s/>]/g)].map((x) => x[1]));
  const missing = [...tags].filter(
    (t) => t.startsWith('Yd') && !new RegExp('\\b' + t + '\\b').test(script),
  );
  if (missing.length) console.log(file, '->', missing.join(', '));
}
