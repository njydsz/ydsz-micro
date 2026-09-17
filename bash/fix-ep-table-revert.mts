/**
 * EP 退场修正 —— 回退「ElTable + ElTableColumn」整体保留至 element-plus。
 *
 * 原因：codemod-ep-components 将 <ElTable> 重命名为 <YdTable>，但未同步处理其子
 * <ElTableColumn>（因无 YDSZ 直接对应而保留 EP import）。造成 EP ElTableColumn
 * 在 YdTable slot 下无法正确挂载——需将 <YdTable> 回退为 <ElTable>，保持整体 EP 表格。
 *
 * 输出：
 * - <YdTable ...> → <ElTable ...>，</YdTable> → </ElTable>
 * - 清理这些文件中仅因 codemod 产生的孤立 YdTable import（如该 import 只剩 YdTable 则整行移除）
 * - 合并 / 去重 fixture 注释
 *
 * @path bash\fix-ep-table-revert.mjs
 * @author ydsz-team
 * @since 1.0.0
 */

import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const WRITE_MODE = process.argv.includes('--write');
const ROOT = resolve(process.cwd(), '.');

const SKIP = new Set(['node_modules', 'dist', '.turbo']);
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

/**
 * 判断文件是否使用了 <ElTableColumn> 标签（表明其需要 EP 表格体系整体保留）
 */
function usesTableColumn(content) {
  return /<ElTableColumn[\s>]/.test(content);
}

/**
 * 修正：YdTable → ElTable + 清理孤立 import
 */
function fixFile(filePath) {
  const original = readFileSync(filePath, 'utf8');
  if (!usesTableColumn(original)) return { changed: false };
  let content = original;

  // 1) 标签回退 YdTable → ElTable
  content = content.replace(/<YdTable(\s|>)/g, '<ElTable$1');
  content = content.replace(/<\/YdTable>/g, '</ElTable>');

  // 2) 调整 import：把 YdTable 送回 element-plus 行，或移除孤立 YdTable import
  // Case A: import { YdTable } from '@ydsz-core/ydsz-ui'; — 只剩 YdTable → 删除该行
  content = content.replace(
    /import\s*\{\s*YdTable\s*\}\s*from\s*['"]@ydsz-core\/ydsz-ui['"];\n?/g,
    '',
  );
  // Case B: import { YdTable, ...其他已迁移组件... } from '@ydsz-core/ydsz-ui';
  //   → 从该行移除 YdTable，若移除后空行则整行删除
  content = content.replace(
    /import\s*\{\s*YdTable\s*\}\s*,\s*([^}]+)\s*from\s*(['"])@ydsz-core\/ydsz-ui\2;/g,
    'import { $1 } from $2@ydsz-core/ydsz-ui$2;',
  );
  content = content.replace(
    /import\s*\{\s*([^}]+?)\s*,\s*YdTable\s*\}\s*from\s*(['"])@ydsz-core\/ydsz-ui\2;/g,
    'import { $1 } from $2@ydsz-core/ydsz-ui$2;',
  );
  content = content.replace(
    /import\s*\{\s*([^}]+?)\s*,?\s*YdTable\s*,?\s*\}\s*from\s*(['"])@ydsz-core\/ydsz-ui\2;/g,
    'import { $1 } from $2@ydsz-core/ydsz-ui$2;',
  );

  // 3) 保证存在 ElTable import（*仅当*文件现在有 <ElTable> 且无 ElTable import）
  if (/<ElTable[\s>]/.test(content) && !/import\s*\{[^}]*\bElTable\b/.test(content)) {
    // 若已有 element-plus import（仅 ElTableColumn），把 ElTable 加入
    if (/import\s*\{[^}]*\bElTableColumn\b[^}]*\}\s*from\s*['"]element-plus['"]/.test(content)) {
      content = content.replace(
        /import\s*\{\s*ElTableColumn/g,
        'import { ElTable, ElTableColumn',
      );
    }
  }

  // 4) 去重 FIXME 标注行（同一个 import 末尾出现多个相同 FIXME 注释时合并）
  content = content.replace(
    /(\s*\/\/\s*FIXME-P3-[A-Z]+-EXIT[^;]*?)(\s*\/\/\s*FIXME-P3-[A-Z]+-EXIT[^;]*?)+/g,
    '$1',
  );

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
  const r = fixFile(f);
  if (r.changed) {
    touched += 1;
    touchedList.push(f.replaceAll('\\', '/'));
  }
}

console.log(`模式：${WRITE_MODE ? 'WRITE（已应用）' : 'DRY-RUN（加 --write 生效）'}`);
console.log(`扫描文件：${files.length}`);
console.log(`修正文件：${touched}`);
if (!WRITE_MODE && touchedList.length > 0) {
  console.log('\n待修正文件：');
  for (const f of touchedList) console.log(`  ${f}`);
}
