/**
 * 注释覆盖率度量脚本（一次性审计工具，不入库）
 *
 * 按文件夹聚合统计：
 *  1. 文件头 JSDoc 覆盖率（module header）
 *  2. 导出符号 TSDoc 覆盖率（exported symbol）
 *  3. 文件内注释密度（注释行 / 有效行）
 *
 * 用法：node audit-comments.mjs [根目录] [--top=N] [--dir=子目录]
 */
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const ROOT = process.argv[2] && !process.argv[2].startsWith('--')
  ? path.resolve(process.argv[2])
  : path.resolve('.');

const EXTS = new Set(['.ts', '.vue', '.mjs', '.mts', '.cts', '.cjs', '.js', '.jsx', '.tsx', '.py']);
const SKIP_DIRS = new Set([
  'node_modules', 'dist', 'dist-dev', 'dist-prod', '.turbo', '.git',
  'coverage', '.changeset', '.workbuddy', '.idea', '.vscode', 'build', 'output',
]);

/** 收集所有源码文件 */
function walk(dir, acc = []) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return acc;
  }
  for (const e of entries) {
    if (SKIP_DIRS.has(e.name)) continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      walk(full, acc);
    } else if (EXTS.has(path.extname(e.name))) {
      acc.push(full);
    }
  }
  return acc;
}

/** 抽取 .vue 文件的 <script> 段（保留行号对齐） */
function extractScript(code, file) {
  if (!file.endsWith('.vue')) return code;
  const m = code.match(/<script[^>]*>([\s\S]*?)<\/script>/i);
  return m ? m[1] : '';
}

const EXPORT_RE = /^export\s+(?:(?:declare)\s+)?(?:abstract\s+)?(?:(?:async)\s+)?(function\*?|class|interface|type|enum|const|let|var)\s+([A-Za-z_$][\w$]*)/;
const EXPORT_DEFAULT_RE = /^export\s+default/;

const CODE_START_RE = /^(import|export|const|let|var|function|class|interface|type|enum|declare|def |from |async |@\w|<\/?(?:template|script|style)[\s>]|if __name__|#\[)/;

/**
 * 判断文件是否有模块头注释
 * @returns {{has: boolean, misplaced: boolean}} has=是否存在块头注释; misplaced=存在但位置在代码之后
 */
function hasHeader(rawLines, file) {
  const limit = Math.min(rawLines.length, 40);
  const vueLike = file.endsWith('.vue');
  const pyLike = file.endsWith('.py');
  for (let i = 0; i < limit; i++) {
    const t = rawLines[i].trim();
    if (t === '') continue;
    if (t.startsWith('//') || t.startsWith('#!')) continue;
    if (t.startsWith('/* eslint') || t.startsWith('/* prettier') || t.startsWith('/* cspell')) continue;
    if (t.startsWith('<!--')) return { has: true, misplaced: false };
    if (t.startsWith('/**')) return { has: true, misplaced: false };
    if (pyLike && (t.startsWith('"""') || t.startsWith("'''"))) return { has: true, misplaced: false };
    if (t.startsWith('/*')) return { has: false, misplaced: false };
    if (CODE_START_RE.test(t)) {
      // 头注释未出现在首段：向后再看几行，判断是否被 import 挤到后面
      for (let k = i + 1; k < limit; k++) {
        const t2 = rawLines[k].trim();
        if (t2.startsWith('/**') || (vueLike && t2.startsWith('<!--'))) {
          return { has: true, misplaced: true };
        }
      }
      return { has: false, misplaced: false };
    }
  }
  return { has: false, misplaced: false };
}

function analyzeFile(file) {
  const raw = fs.readFileSync(file, 'utf8');
  const rawLines = raw.split(/\r?\n/);
  const headerInfo = hasHeader(rawLines, file);
  const header = headerInfo.has;
  const headerMisplaced = headerInfo.misplaced;

  const code = extractScript(raw, file);
  const lines = code.split(/\r?\n/);

  let exportTotal = 0;
  let exportDoc = 0;
  const missing = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.startsWith('export')) continue;
    const m = line.match(EXPORT_RE);
    const isDefault = !m && EXPORT_DEFAULT_RE.test(line);
    if (!m && !isDefault) continue;
    // 重导出 export { a, b } from 'x' 不计
    if (/^export\s*\{/.test(line)) continue;

    exportTotal++;
    // 向上查找紧邻的 JSDoc 块结尾
    let j = i - 1;
    while (j >= 0 && lines[j].trim() === '') j--;
    if (j >= 0 && lines[j].trim().endsWith('*/')) {
      exportDoc++;
    } else {
      missing.push(m ? m[2] : 'default');
    }
  }

  // 注释密度
  let commentLines = 0;
  let codeLines = 0;
  let inBlock = false;
  for (const l of lines) {
    const t = l.trim();
    if (t === '') continue;
    if (inBlock) {
      commentLines++;
      if (t.endsWith('*/')) inBlock = false;
      continue;
    }
    if (t.startsWith('/*')) {
      commentLines++;
      if (!t.endsWith('*/')) inBlock = true;
      continue;
    }
    if (t.startsWith('//') || t.startsWith('*')) {
      commentLines++;
      continue;
    }
    codeLines++;
  }

  return {
    file, header, headerMisplaced, exportTotal, exportDoc, missing,
    commentLines, codeLines,
    density: codeLines === 0 ? 0 : commentLines / (commentLines + codeLines),
  };
}

const files = walk(ROOT);
const results = files.map(analyzeFile);

/** 按二级目录聚合（相对 ROOT 的第一层） */
const groups = new Map();
for (const r of results) {
  const rel = path.relative(ROOT, r.file).split(path.sep);
  const key = rel.length === 1 ? '(root)' : rel.slice(0, rel[0] === 'apps' || rel[0] === 'comm' ? 2 : 1).join('/');
  if (!groups.has(key)) {
    groups.set(key, { files: 0, header: 0, misplaced: 0, exportTotal: 0, exportDoc: 0, commentLines: 0, codeLines: 0, missing: [] });
  }
  const g = groups.get(key);
  g.files++;
  g.header += r.header ? 1 : 0;
  g.misplaced += r.headerMisplaced ? 1 : 0;
  g.exportTotal += r.exportTotal;
  g.exportDoc += r.exportDoc;
  g.commentLines += r.commentLines;
  g.codeLines += r.codeLines;
  if (r.missing.length) g.missing.push({ file: path.relative(ROOT, r.file), syms: r.missing });
}

const pct = (a, b) => (b === 0 ? 100 : (a / b) * 100);
const rows = [...groups.entries()]
  .map(([k, g]) => ({
    dir: k,
    files: g.files,
    headerPct: pct(g.header, g.files),
    exportPct: pct(g.exportDoc, g.exportTotal),
    densityPct: pct(g.commentLines, g.commentLines + g.codeLines),
    exports: g.exportTotal,
    missingCount: g.missing.reduce((s, m) => s + m.syms.length, 0),
  }))
  .sort((a, b) => a.exportPct - b.exportPct);

const pad = (s, n) => String(s).padEnd(n);
const padS = (s, n) => String(s).padStart(n);

console.log(`\n扫描根目录: ${ROOT}`);
console.log(`文件总数: ${results.length}\n`);
console.log(pad('目录', 30) + padS('文件', 6) + padS('头注释%', 10) + padS('导出注释%', 12) + padS('密度%', 8) + padS('导出数', 8) + padS('缺失', 8));
console.log('-'.repeat(90));
for (const r of rows) {
  console.log(
    pad(r.dir, 30)
    + padS(r.files, 6)
    + padS(r.headerPct.toFixed(1), 10)
    + padS(r.exportPct.toFixed(1), 12)
    + padS(r.densityPct.toFixed(1), 8)
    + padS(r.exports, 8)
    + padS(r.missingCount, 8),
  );
}

const T = results.reduce((a, r) => ({
  files: a.files + 1,
  header: a.header + (r.header ? 1 : 0),
  exportTotal: a.exportTotal + r.exportTotal,
  exportDoc: a.exportDoc + r.exportDoc,
  commentLines: a.commentLines + r.commentLines,
  codeLines: a.codeLines + r.codeLines,
}), { files: 0, header: 0, exportTotal: 0, exportDoc: 0, commentLines: 0, codeLines: 0 });
console.log('-'.repeat(90));
console.log(pad('合计', 30)
  + padS(T.files, 6)
  + padS(pct(T.header, T.files).toFixed(1), 10)
  + padS(pct(T.exportDoc, T.exportTotal).toFixed(1), 12)
  + padS(pct(T.commentLines, T.commentLines + T.codeLines).toFixed(1), 8)
  + padS(T.exportTotal, 8)
  + padS(results.reduce((s, r) => s + r.missing.length, 0), 8));

// ---------- JSON 缺口清单 ----------
const outPath = path.join(ROOT, '.workbuddy', 'tmp', 'report.json');
const payload = Object.fromEntries(
  [...groups.entries()].map(([dir, g]) => {
    const groupFiles = results.filter((r) => {
      const rel = path.relative(ROOT, r.file).split(path.sep);
      const key = rel.length === 1 ? '(root)'
        : rel.slice(0, rel[0] === 'apps' || rel[0] === 'comm' ? 2 : 1).join('/');
      return key === dir;
    });
    return [dir, {
      files: g.files,
      headerPct: +pct(g.header, g.files).toFixed(1),
      exportPct: +pct(g.exportDoc, g.exportTotal).toFixed(1),
      missingHeader: groupFiles.filter((r) => !r.header).map((r) => path.relative(ROOT, r.file)),
      misplacedHeader: groupFiles.filter((r) => r.headerMisplaced).map((r) => path.relative(ROOT, r.file)),
      missingExportDoc: groupFiles.filter((r) => r.missing.length)
        .map((r) => ({ file: path.relative(ROOT, r.file), symbols: r.missing })),
    }];
  }),
);
fs.writeFileSync(outPath, JSON.stringify(payload, null, 2), 'utf8');
console.log(`\n缺口清单已写入: ${outPath}`);
