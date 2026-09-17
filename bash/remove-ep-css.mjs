/*!
 * 移除 Element Plus CSS 覆写文件及其 import。
 *
 * Phase 5 CSS 清理：
 * - 删除 comm/styles/src/ele/index.css
 * - 从 10 个 app main.ts / standalone-main.ts 移除 import '@ydsz/styles/ele'
 * - 从 comm/styles/package.json exports 移除 ./ele 子路径
 *
 * @path bash/remove-ep-css.mjs
 * @author ydsz-team
 * @since 4.2.0
 */

import { existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const WRITE_MODE = process.argv.includes('--write');
const ROOT = resolve(process.cwd(), '.');

let changed = 0;

// 1. 删除 ele/index.css
const cssFile = resolve(ROOT, 'comm/styles/src/ele/index.css');
if (existsSync(cssFile)) {
  console.log(`  [删除] ${cssFile}`);
  if (WRITE_MODE) rmSync(cssFile);
  changed += 1;
}

const appRoots = [
  'apps/agent-web/src/main.ts',
  'apps/cronjob-web/src/main.ts',
  'apps/generator-web/src/main.ts',
  'apps/literule-web/src/main.ts',
  'apps/message-web/src/main.ts',
  'apps/nextwiki-web/src/main.ts',
  "apps/system-web/src/main.ts",
  'apps/userinfo-web/src/main.ts',
  'apps/userinfo-web/src/standalone-main.ts',
  'apps/workflow-web/src/main.ts',
];

for (const relPath of appRoots) {
  const fullPath = resolve(ROOT, relPath);
  if (!existsSync(fullPath)) continue;

  const original = readFileSync(fullPath, 'utf8');
  // 匹配 `import '@ydsz/styles/ele';` 整行（含分号与末尾换行）
  const lineRegex = /\nimport\s+'@ydsz\/styles\/ele';/g;

  if (lineRegex.test(original)) {
    const updated = original.replace(lineRegex, '\n');
    console.log(`  [移除 import] ${relPath}`);
    if (WRITE_MODE) writeFileSync(fullPath, updated, 'utf8');
    changed += 1;
  }
}

// 3. 移除 comm/styles/package.json exports['./ele']
const pkgPath = resolve(ROOT, 'comm/styles/package.json');
if (existsSync(pkgPath)) {
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
  if (pkg.exports && pkg.exports['./ele']) {
    delete pkg.exports['./ele'];
    console.log(`  [移除 export] ./ele`);
    if (WRITE_MODE) writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`, 'utf8');
    changed += 1;
  }
}

console.log(`模式：${WRITE_MODE ? 'WRITE（已应用）' : 'DRY-RUN（加 --write 生效）'}`);
console.log(`操作项：${changed}`);
