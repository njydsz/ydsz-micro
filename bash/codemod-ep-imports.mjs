/**
 * EP 退场 codemod —— 命令式 API 导入桥接 + 过期 TODO 清理（ep-exit-refactor-plan v3 §P0-3）。
 *
 * 职责边界（机械变换，人工审查后套用）：
 * 1. 命令式 API 导入桥接：仅当 element-plus 导入的具名成员全部属于
 *    { ElMessage, ElMessageBox, ElNotification } 时，整条 import 切换为
 *    `@ydsz/notification/compat`（el-bridge 完成件，方法签名与 EP 对齐）；
 *    混合导入（组件 + 命令式 API）拆分为两条，组件部分保持原样待人工迁移。
 * 2. 过期 TODO 清理：删除「暂无 shadcn（等效组件）」类注释行 —— kit 已有
 *    对应件（v3 计划 §1.3 勘误），该类标记已失效。FIXME: el-* 类注释保留，
 *    属真实迁移工作项。
 *
 * 不做：组件标签替换、动态 import 注册表改写 —— 均须人工逐文件处理。
 *
 * 用法：
 *   node bash/codemod-ep-imports.mjs           # dry-run，仅报告
 *   node bash/codemod-ep-imports.mjs --write   # 应用变更
 *
 * @path bash\codemod-ep-imports.mjs
 * @author ydsz-team
 * @since 1.0.0
 */

import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const WRITE_MODE = process.argv.includes('--write');
const ROOT = resolve(process.cwd(), '.');

/** 命令式 API 兼容集：el-bridge 已全量对齐三者签名 */
const COMPAT_NAMES = new Set(['ElMessage', 'ElMessageBox', 'ElNotification']);

/** 扫描目录与扩展名 */
const SCAN_DIRS = ['apps', 'comm', 'main'];
const EXTS = ['.ts', '.mts', '.vue'];

/** 跳过的路径片段 */
const SKIP = new Set(['node_modules', 'dist', '.turbo', 'coverage', 'build']);

/**
 * 匹配单条 element-plus 具名导入语句（含多行），捕获成员列表与引号风格。
 * 形如：import { ElMessage, ElSelect } from 'element-plus';
 */
const EP_NAMED_IMPORT_RE =
  /import\s*\{([^}]*)\}\s*from\s*(['"])element-plus\2;?/g;

/** 过期 TODO 注释行（kit 已有对应件的失效标记） */
const STALE_TODO_RE = /^\s*\/\/.*\b(?:TODO|FIXME)\b.*(暂无\s*shadcn|shadcn-ui?\s*等效)/i;

/**
 * 递归收集待处理文件。
 *
 * @param {string} dir 起始目录
 * @param {string[]} out 收集结果
 * @returns {string[]} 文件绝对路径列表
 */
function walk(dir, out = []) {
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return out;
  }
  for (const name of entries) {
    if (SKIP.has(name)) continue;
    const full = join(dir, name);
    let st;
    try {
      st = statSync(full);
    } catch {
      continue;
    }
    if (st.isDirectory()) {
      walk(full, out);
    } else if (
      EXTS.some((e) => name.endsWith(e)) &&
      !name.endsWith('.d.ts')
    ) {
      out.push(full);
    }
  }
  return out;
}

/**
 * 判断文件是否为 el-bridge/compat 自身（其注释含 EP 字面量，不应触碰）。
 *
 * @param {string} file 文件绝对路径
 * @returns {boolean} 是否跳过
 */
function isBridgeSelf(file) {
  const normalized = file.replaceAll('\\', '/');
  return normalized.includes('effects/notification/src/el-bridge.ts')
    || normalized.includes('effects/notification/src/compat.ts');
}

/**
 * 对单个文件执行机械变换。
 *
 * @param {string} filePath 文件绝对路径
 * @returns {{ changed: boolean, compatImports: number, todosRemoved: number }}
 */
function transformFile(filePath) {
  const original = readFileSync(filePath, 'utf8');
  let content = original;
  let compatImports = 0;
  let todosRemoved = 0;

  // 1) 命令式 API 导入桥接
  content = content.replace(EP_NAMED_IMPORT_RE, (match, namesRaw, quote) => {
    const names = namesRaw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const compat = names.filter((n) => COMPAT_NAMES.has(n));
    if (compat.length === 0) return match; // 纯组件导入，不动
    compatImports += 1;
    const compatLine = `import { ${compat.join(', ')} } from ${quote}@ydsz/notification/compat${quote};`;
    const rest = names.filter((n) => !COMPAT_NAMES.has(n));
    if (rest.length === 0) return compatLine; // 整条切换
    // 混合导入：组件部分保留原模块，compat 部分另起一条
    const epLine = match.replace(/\s*;?$/, ';');
    return `${epLine}\n${compatLine}`;
  });

  // 2) 过期 TODO 清理
  const lines = content.split('\n');
  const kept = [];
  for (const line of lines) {
    if (STALE_TODO_RE.test(line)) {
      todosRemoved += 1;
      continue;
    }
    kept.push(line);
  }
  content = kept.join('\n');

  if (content !== original) {
    if (WRITE_MODE) writeFileSync(filePath, content, 'utf8');
    return { changed: true, compatImports, todosRemoved };
  }
  return { changed: false, compatImports: 0, todosRemoved: 0 };
}

// ---------------------------------------------------------------------------
// 主流程
// ---------------------------------------------------------------------------

const files = SCAN_DIRS.flatMap((d) => walk(join(ROOT, d))).filter(
  (f) => !isBridgeSelf(f),
);

let touched = 0;
let totalCompat = 0;
let totalTodos = 0;
const touchedFiles = [];

for (const file of files) {
  const r = transformFile(file);
  if (r.changed) {
    touched += 1;
    totalCompat += r.compatImports;
    totalTodos += r.todosRemoved;
    touchedFiles.push(file);
  }
}

console.log(`模式：${WRITE_MODE ? 'WRITE（已应用）' : 'DRY-RUN（加 --write 生效）'}`);
console.log(`扫描文件：${files.length} 个`);
console.log(`命中文件：${touched} 个`);
console.log(`命令式 API 导入桥接：${totalCompat} 条`);
console.log(`过期 TODO 清理：${totalTodos} 行`);
if (touchedFiles.length > 0 && !WRITE_MODE) {
  console.log('\n待变更文件（前 40）：');
  for (const f of touchedFiles.slice(0, 40)) {
    console.log(`  ${f.replaceAll('\\', '/')}`);
  }
  if (touchedFiles.length > 40) {
    console.log(`  ... 另有 ${touchedFiles.length - 40} 个`);
  }
}
