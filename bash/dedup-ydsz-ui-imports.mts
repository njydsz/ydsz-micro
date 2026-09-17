/*!
 * 去重 @ydsz-core/ydsz-ui 多行 import 为单行。
 *
 * <p>用途：在 codemod-ep-components / codemod-el-table-to-yd 等迁移脚本之后，
 * 有时会在同一个 .vue 文件中产生多行来自同包的 import（成员彼此不重叠或重叠），
 * 合并为一行以避免 Vite 警告与代码审美劣化。
 *
 * <p>保留成员顺序（首次出现序），去重（别名视为不同成员保留两者）。
 *
 * @path bash/dedup-ydsz-ui-imports.mjs
 * @author ydsz-team
 * @since 4.2.0
 */

import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const WRITE_MODE = process.argv.includes('--write');
const ROOT = resolve(process.cwd(), '.');

const SKIP = new Set(['node_modules', 'dist', '.turbo', '.git']);
const EXTS = ['.vue'];
const SCAN_DIRS = ['apps', 'main'];

function walk(dir, out = []) {
  let entries;
  try { entries = readdirSync(dir); } catch { return out; }
  for (const name of entries) {
    if (SKIP.has(name)) continue;
    const full = join(dir, name);
    let st;
    try { st = statSync(full); } catch { continue; }
    if (st.isDirectory()) { walk(full, out); }
    else if (EXTS.some((e) => name.endsWith(e)) && !name.endsWith('.d.ts')) {
      out.push(full);
    }
  }
  return out;
}

/** 从 'A, B as C, D' 解析成员数组（保留别名） */
function parseMembers(str) {
  return str.split(',').map((s) => s.trim()).filter(Boolean);
}

function dedupFile(filePath) {
  const original = readFileSync(filePath, 'utf8');
  const importRe = /import\s*\{([^}]+)\}\s*from\s*(['"])@ydsz-core\/ydsz-ui\2;?[ \t]*\n?/g;

  // 找出所有匹配
  const matches = [...original.matchAll(importRe)];
  if (matches.length <= 1) return { changed: false };

  // 收集成员（保留顺序，去重完全相同的文本段）
  const seen = new Set();
  const merged = [];
  for (const m of matches) {
    const members = parseMembers(m[1]);
    for (const mem of members) {
      if (!seen.has(mem)) {
        seen.add(mem);
        merged.push(mem);
      }
    }
  }

  // 删除所有旧的 import 行，在首次出现位置插入合并行
  let content = original;
  let firstMatchIndex = matches[0].index;
  // 计算第一个匹配之前的换行情况（避免留空行）
  let insertOffset = 0;
  for (const m of matches) {
    content = content.replace(m[0], '');
    insertOffset = m.index;
  }
  // 重新计算索引（内容已变化；重新搜出第一个位置）
  const firstOccurrence = original.indexOf(matches[0][0]);
  const beforeFirst = original.lastIndexOf('\n', firstOccurrence - 1);
  const lineStart = beforeFirst + 1;
  const lineIndent = original.slice(lineStart, firstOccurrence).match(/^\s*/)?.[0] ?? '';

  // 先撤销上次替换，采用更简单的策略：替换第一行删除其余
  content = original;
  // 替换第一行
  content = content.replace(matches[0][0], `import { ${merged.join(', ')} } from ${matches[0][2]}@ydsz-core/ydsz-ui${matches[0][2]};\n`);
  // 删除其余行
  for (let i = 1; i < matches.length; i++) {
    content = content.replace(matches[i][0], '');
  }

  if (content !== original) {
    if (WRITE_MODE) writeFileSync(filePath, content, 'utf8');
    return { changed: true };
  }
  return { changed: false };
}

// ---------------------------------------------------------------------------
const files = SCAN_DIRS.flatMap((d) => walk(join(ROOT, d)));
let touched = 0;
const touchedList = [];
for (const f of files) {
  const r = dedupFile(f);
  if (r.changed) {
    touched += 1;
    touchedList.push(f.replaceAll('\\', '/'));
  }
}

console.log(`模式：${WRITE_MODE ? 'WRITE（已应用）' : 'DRY-RUN（加 --write 生效）'}`);
console.log(`扫描文件：${files.length}`);
console.log(`合并文件：${touched}`);
if (!WRITE_MODE && touchedList.length > 0) {
  console.log('\n待合并文件：');
  for (const f of touchedList) console.log(`  ${f}`);
}
