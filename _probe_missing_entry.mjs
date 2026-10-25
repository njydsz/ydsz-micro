import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = process.cwd();
const skipDirs = new Set(['node_modules', '.git', 'dist', 'coverage', '.turbo', '.pnpm-store']);

function walk(dir, out) {
  for (const name of readdirSync(dir)) {
    if (skipDirs.has(name)) continue;
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) walk(full, out);
    else if (name === 'package.json') out.push(full);
  }
  return out;
}

function resolveTargets(value, file) {
  const list = [];
  if (typeof value === 'string') list.push(value);
  else if (value && typeof value === 'object') {
    for (const v of Object.values(value)) list.push(...resolveTargets(v, file));
  }
  return list.filter((s) => typeof s === 'string' && s.startsWith('.'));
}

const bad = [];
for (const file of walk(root, [])) {
  let json;
  try {
    json = JSON.parse(readFileSync(file, 'utf8'));
  } catch {
    continue;
  }
  if (!json.name) continue;
  const pkgDir = file.slice(0, -'package.json'.length);
  const hasBuild = Boolean(json.scripts?.build || json.scripts?.stub);
  const targets = [
    ...resolveTargets(json.main, file),
    ...resolveTargets(json.module, file),
    ...resolveTargets(json.exports, file),
    ...(json.bin ? resolveTargets(json.bin, file) : []),
  ];
  const missing = [...new Set(targets)].filter((t) => !existsSync(join(pkgDir, t)));
  if (missing.length > 0) {
    bad.push({
      name: json.name,
      dir: relative(root, pkgDir),
      hasBuild,
      missing,
    });
  }
}

bad.sort((a, b) => Number(a.hasBuild) - Number(b.hasBuild) || a.name.localeCompare(b.name));
for (const item of bad) {
  console.log(
    `${item.hasBuild ? '[有build脚本/可能未跑]' : '[无build脚本]'} ${item.name} (${item.dir}) -> ${item.missing.join(', ')}`,
  );
}
console.log(`合计 ${bad.length} 个包入口/导出指向不存在的文件，其中无 build 脚本的 ${bad.filter((b) => !b.hasBuild).length} 个`);
