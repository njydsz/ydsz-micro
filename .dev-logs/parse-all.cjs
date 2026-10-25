const fs = require('fs');
const path = require('path');
const sfc = require('../node_modules/.pnpm/@vue+compiler-sfc@3.5.40/node_modules/@vue/compiler-sfc/dist/compiler-sfc.cjs.js');
const roots = ['apps', 'comm', 'main'];
const bad = [];
function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['node_modules', 'dist', '.turbo', 'coverage'].includes(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (e.name.endsWith('.vue')) {
      const src = fs.readFileSync(p, 'utf8');
      const { errors } = sfc.parse(src, { filename: p });
      if (errors.length) bad.push(p.split(path.sep).join('/') + ' :: ' + errors.map((x) => x.message).join(' | '));
    }
  }
}
for (const r of roots) walk(r);
fs.writeFileSync('.dev-logs/sfc-parse-errors.txt', bad.join('\n') + '\n');
console.log('bad files:', bad.length);
