/*!
 * EP 表格全面迁移：ElTable + ElTableColumn → YdTable + YdTableColumn。
 *
 * <p>将 EP 表格标签迁移到自研 YDSZ 组件库，保持模板结构不变，
 * 仅替换标签名和 import 路径：
 * <ul>
 *   <li>{@code <ElTable>} → {@code <YdTable>}，{@code </ElTable>} → {@code </YdTable>}</li>
 *   <li>{@code <ElTableColumn>} → {@code <YdTableColumn>}，自闭合/配对标签同理</li>
 *   <li>{@code v-loading="expr"} → loading="expr"}（YdTable 原生 prop）</li>
 *   <li>合并 element-plus 中 ElTable/ElTableColumn 到 @ydsz-core/ydsz-ui 导入</li>
 * </ul>
 *
 * <p>处理的 import 场景：
 * <ul>
 *   <li>A. element-plus 只有 ElTable/ElTableColumn → 删除该行</li>
 *   <li>B. element-plus 有其他成员 → 仅移除 ElTable/ElTableColumn</li>
 *   <li>C. ydsz-ui import 已含 YdTable → 仅追加 YdTableColumn</li>
 *   <li>D. ydsz-ui import 不含 YdTable → 同时追加 YdTable + YdTableColumn</li>
 *   <li>E. 无 ydsz-ui import → 新建一行 import</li>
 * </ul>
 *
 * @path bash/codemod-el-table-to-yd.mjs
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

/** 判断迁移需加入 ydsz-ui 的新成员 */
function computeYdMembersNeeded(content) {
  const hasTable = /<ElTable[\s>]/.test(content) || content.includes('ElTable');
  const hasColumn = /<ElTableColumn[\s>]/.test(content) || content.includes('ElTableColumn');
  const members = [];
  if (hasTable) members.push('YdTable');
  if (hasColumn) members.push('YdTableColumn');
  return members;
}

/** 从 import 成员串解析为数组 */
function parseMembers(membersStr) {
  return membersStr.split(',').map((s) => s.trim()).filter(Boolean);
}

/** 主迁移函数 */
function migrateFile(filePath) {
  const original = readFileSync(filePath, 'utf8');
  if (!original.includes('ElTable')) return { changed: false };
  let content = original;

  // ============ 1) 标签迁移 ============
  content = content.replace(/<ElTable(\s|>|\/>)/g, '<YdTable$1');
  content = content.replace(/<\/ElTable>/g, '</YdTable>');
  content = content.replace(/<ElTableColumn(\s|>|\/>)/g, '<YdTableColumn$1');
  content = content.replace(/<\/ElTableColumn>/g, '</YdTableColumn>');

  // ============ 2) 属性迁移（v-loading → loading） ============
  content = content.replace(/v-loading=/g, 'loading=');

  // ============ 3) import 迁移 ============

  // 收集可能需要迁入 ydsz-ui 的 EP 表格成员
  const epTableMembersReferenced = ['ElTable', 'ElTableColumn'].filter((m) =>
    new RegExp(`\\b${m}\\b`).test(content),
  );
  const ydMembersNeeded = epTableMembersReferenced.map((m) =>
    m === 'ElTableColumn' ? 'YdTableColumn' : 'YdTable',
  );

  if (ydMembersNeeded.length === 0) {
    // 无需要迁移的成员，直接返回
    if (content !== original) {
      if (WRITE_MODE) writeFileSync(filePath, content, 'utf8');
      return { changed: true };
    }
    return { changed: false };
  }

  // — Step 3a: 缩减/删除 element-plus import —
  content = content.replace(
    /import\s*\{([^}]+)\}\s*from\s*(['"])element-plus\2;?[ \t]*\n?/g,
    (_full, membersStr, quote) => {
      const list = parseMembers(membersStr);
      const rest = list.filter((m) => !epTableMembersReferenced.includes(m));
      if (rest.length === 0) return ''; // 场景 A：整行删除
      return `import { ${rest.join(', ')} } from ${quote}element-plus${quote};\n`; // 场景 B
    },
  );

  // — Step 3b: 找到 ydsz-ui import，记录其成员和位置 —
  const ydszRe = /import\s*\{([^}]+)\}\s*from\s*(['"])@ydsz-core\/ydsz-ui\2;?[ \t]*\n?/g;
  let ydszMatch = null;
  let ydszNewContent = content;
  for (const m of content.matchAll(ydszRe)) {
    ydszMatch = m;
    break;
  }

  if (ydszMatch) {
    // 场景 C / D：往现有 ydsz-ui import 追加缺少的成员
    const existingMembers = parseMembers(ydszMatch[1]);
    const toAdd = ydMembersNeeded.filter((m) => !existingMembers.includes(m));
    if (toAdd.length > 0) {
      const allMembers = [...existingMembers, ...toAdd];
      const replacement = `import { ${allMembers.join(', ')} } from ${ydszMatch[2]}@ydsz-core/ydsz-ui${ydszMatch[2]};\n`;
      ydszNewContent = content.replace(ydszMatch[0], replacement);
    }
  } else {
    // 场景 E：新建一行 ydsz-ui import
    const scriptStartMatch = content.match(/<script\b[^>]*>/);
    if (scriptStartMatch) {
      const insertAt = scriptStartMatch.index + scriptStartMatch[0].length;
      ydszNewContent =
        content.slice(0, insertAt) +
        `\nimport { ${ydMembersNeeded.join(', ')} } from '@ydsz-core/ydsz-ui';` +
        content.slice(insertAt);
    }
  }
  content = ydszNewContent;

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
  const r = migrateFile(f);
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
