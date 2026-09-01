/**
 * 错误码单一来源生成脚本
 *
 * <p>从后端 ydsz-cloud 错误码定义（@YdszExceptionCode 标注枚举 + YdszResultCode）
 * 静态提取全部错误码，生成前端 TS 常量与元信息映射，取代人工手抄表，
 * 消除前后端错误码漂移。
 *
 * <p>符合云顶编码规范 §18.7 错误码规范（单一事实源原则）。
 *
 * <p>使用方式:
 *   node bash/gen-error-codes.mjs            # 生成 error-codes.generated.ts + lock 快照
 *   node bash/gen-error-codes.mjs --check    # 只读校验：生成内容与 lock 是否漂移（CI 门禁用）
 *
 * <p>环境变量:
 *   YDSZ_CLOUD_ROOT  后端仓库根目录（CI checkout 后注入；默认本机开发路径）
 *
 * <p>产物:
 *   comm/effects/request/src/error-codes.generated.ts   生成常量（禁止手改）
 *   comm/effects/request/src/.error-codes.lock          内容哈希快照（--check 基线）
 *
 * @path bash\gen-error-codes.mjs
 * @author ydsz-team
 * @since 4.1.0
 * @see bash/gen-contract.py（API 契约主链路，本脚本与其互为补充）
 * @see docs/云顶编码规范.md
 */

import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

/** 后端仓库根目录：与 gen-contract.py 保持同一覆盖约定 */
const CLOUD_ROOT = process.env.YDSZ_CLOUD_ROOT || 'D:\\Code\\open\\ydsz-cloud';

/** 生成产物与 lock 基线路径 */
const OUTPUT_TS = join(ROOT, 'comm/effects/request/src/error-codes.generated.ts');
const OUTPUT_LOCK = join(ROOT, 'comm/effects/request/src/.error-codes.lock');

/** 错误码格式：字母 + 5 位数字（如 A00000、B30001） */
const CODE_PATTERN = /^[A-Z]\d{5}$/;

/** i18n key 启发式：小写点分形式（如 userinfo.user.not.found），用于区分中文描述 */
const I18N_KEY_PATTERN = /^[a-z][a-z0-9]*(\.[a-z0-9_-]+)+$/;

/** HTTP 状态码合理区间 */
const HTTP_STATUS_PATTERN = /^[1-5]\d{2}$/;

/**
 * 枚举常量条目
 *
 * @typedef {object} CodeEntry
 * @property {string} key TS 常量键（枚举常量名，冲突时加模块前缀）
 * @property {string} code 错误码（如 B30001）
 * @property {string} message 默认中文消息（javadoc 优先，其次第二字符串参数）
 * @property {string | undefined} i18nKey 后端 i18n 消息键（点分形式时提取）
 * @property {string} module 来源模块（如 userinfo）
 * @property {string} enumName 枚举常量名（如 USER_NOT_FOUND）
 * @property {string} source 来源文件相对路径
 * @property {number | undefined} httpStatus 后端声明的 HTTP 状态码
 * @property {boolean} retryable 后端声明的可重试标记
 */

/** 递归收集 .java 文件（跳过 target 构建产物目录） */
function collectJavaFiles(dir, acc = []) {
  for (const name of readdirSync(dir)) {
    if (name === 'target' || name === '.git' || name === 'node_modules') {
      continue;
    }
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) {
      collectJavaFiles(full, acc);
    } else if (name.endsWith('.java')) {
      acc.push(full);
    }
  }
  return acc;
}

/** 清洗 javadoc 文本：去注释符、去 {@link}/{@code} 包装、压缩空白 */
function cleanJavadoc(raw) {
  return raw
    .split('\n')
    .map((line) => line.replace(/^\s*\/?\*+\s?/, '').trim())
    .filter((line) => line.length > 0 && !line.startsWith('@'))
    .join(' ')
    .replace(/\{@(?:code|link)\s+([^}]+)\}/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * 解析单个错误码枚举文件
 *
 * @param {string} filePath 文件绝对路径
 * @param {string} content 文件内容
 * @param {string} module 模块名
 * @param {boolean} annotated 是否为 @YdszExceptionCode 标注枚举
 * @returns {CodeEntry[]} 解析出的条目
 */
function parseEnumFile(filePath, content, module, annotated) {
  const relPath = filePath.split(/ydsz-cloud[\\/]/).pop()?.replace(/\\/g, '/') ?? filePath;
  const entries = [];

  // 匹配形如 NAME("B30001", "userinfo.user.not.found", 404) / NAME("A00000", "ok") 的常量定义
  const constantPattern = /(\w+)\(\s*"([A-Z]\d{5})"\s*,\s*"([^"]*)"\s*(,([^)]*))?\)/g;

  for (const match of content.matchAll(constantPattern)) {
    const [, enumName, code, secondArg, , restArgs] = match;
    if (!CODE_PATTERN.test(code)) {
      continue;
    }

    // 向前回溯最近的 javadoc 作为中文描述：要求其后仅允许空白（保证紧邻当前常量），
    // 避免惰性正则把更早的 javadoc 与中间代码一起误吞进描述文本
    const before = content.slice(Math.max(0, match.index - 600), match.index);
    let javadocText = '';
    const endIdx = before.lastIndexOf('*/');
    if (endIdx >= 0 && /^\s*$/.test(before.slice(endIdx + 2))) {
      const startIdx = before.lastIndexOf('/**', endIdx);
      if (startIdx >= 0) {
        javadocText = cleanJavadoc(before.slice(startIdx + 3, endIdx));
      }
    }

    const rest = restArgs ?? '';
    const statusMatch = rest.match(/(\d{3})/);
    const httpStatus =
      statusMatch && HTTP_STATUS_PATTERN.test(statusMatch[1]) ? Number(statusMatch[1]) : undefined;
    const retryable = /\btrue\b/.test(rest);

    entries.push({
      key: enumName,
      code,
      message: javadocText || secondArg,
      i18nKey: I18N_KEY_PATTERN.test(secondArg) ? secondArg : undefined,
      module,
      enumName,
      source: relPath,
      httpStatus: annotated ? httpStatus : undefined,
      retryable: annotated ? retryable : false,
    });
  }
  return entries;
}

/**
 * 全量扫描后端错误码定义
 *
 * @returns {{ entries: CodeEntry[], modules: Map<string, string>, files: number }}
 */
function scanBackendCodes() {
  if (!existsSync(CLOUD_ROOT)) {
    console.error(`[gen-error-codes] 后端仓库不存在: ${CLOUD_ROOT}（可用 YDSZ_CLOUD_ROOT 覆盖）`);
    process.exit(1);
  }

  /** @type {CodeEntry[]} */
  const entries = [];
  /** @type {Map<string, string>} 模块名 → 模块描述 */
  const modules = new Map();
  let fileCount = 0;

  for (const file of collectJavaFiles(CLOUD_ROOT)) {
    let content;
    try {
      content = readFileSync(file, 'utf8');
    } catch {
      // 跳过构建过程中瞬时不可读的文件（如 target 内被清理的产物）
      continue;
    }
    const isYdszResultCode = file.endsWith('YdszResultCode.java');
    const annotationUse = content.match(/@YdszExceptionCode\s*\(\s*module\s*=\s*"([^"]+)"\s*(?:,\s*description\s*=\s*"([^"]+)")?\s*\)/);

    if (annotationUse) {
      const [, module, description] = annotationUse;
      if (description && !modules.has(module)) {
        modules.set(module, description);
      }
      entries.push(...parseEnumFile(file, content, module, true));
      fileCount += 1;
    } else if (isYdszResultCode) {
      modules.set('core', '平台通用结果码');
      entries.push(...parseEnumFile(file, content, 'core', false));
      fileCount += 1;
    }
  }
  return { entries, modules, files: fileCount };
}

/**
 * 去重与键冲突消解：code 全局唯一；枚举常量名冲突时加模块前缀
 *
 * @param {CodeEntry[]} entries 原始条目
 * @returns {CodeEntry[]} 消解后的条目（按 code 排序）
 */
function resolveConflicts(entries) {
  /** @type {Map<string, CodeEntry>} code → 首个条目 */
  const byCode = new Map();
  for (const entry of entries) {
    if (!byCode.has(entry.code)) {
      byCode.set(entry.code, entry);
    }
  }

  const seenKeys = new Map();
  for (const entry of byCode.values()) {
    const existing = seenKeys.get(entry.key);
    if (existing && existing.code !== entry.code) {
      entry.key = `${entry.module.toUpperCase()}_${entry.key}`;
    }
    seenKeys.set(entry.key, entry);
  }

  return [...byCode.values()].sort((a, b) => a.code.localeCompare(b.code));
}

/**
 * 生成 TS 产物内容
 *
 * @param {CodeEntry[]} entries 消解后的条目
 * @param {Map<string, string>} modules 模块元信息
 * @returns {string} TS 文件内容
 */
function renderTypeScript(entries, modules) {
  const lines = [];
  const generatedAt = new Date().toISOString().slice(0, 10);
  const moduleList = [...modules.entries()].map(([m, d]) => `${m}(${d})`).join('、');

  lines.push('/**');
  lines.push(' * 错误码常量（自动生成，禁止手改）');
  lines.push(' *');
  lines.push(` * <p>由 bash/gen-error-codes.mjs 于 ${generatedAt} 从后端 ydsz-cloud 静态提取生成，`);
  lines.push(' * 共 ' + entries.length + ' 个错误码，来源模块：' + moduleList + '。');
  lines.push(' * 后端新增/修改错误码后运行 pnpm gen:error-codes 重新生成；');
  lines.push(' * CI 通过 gen:error-codes:check 门禁拦截手改与漂移。');
  lines.push(' *');
  lines.push(' * @path comm/effects/request/src/error-codes.generated.ts');
  lines.push(' * @author ydsz-team');
  lines.push(' * @since 4.1.0');
  lines.push(' */');
  lines.push('');
  lines.push('export const GeneratedErrorCode = {');

  let currentSegment = '';
  for (const entry of entries) {
    const segment = entry.code[0];
    if (segment !== currentSegment) {
      currentSegment = segment;
      lines.push(`  // ===== ${segment} 段 =====`);
    }
    lines.push(`  /** ${entry.message} */`);
    lines.push(`  ${entry.key}: '${entry.code}',`);
  }
  lines.push('} as const;');
  lines.push('');
  lines.push('/**');
  lines.push(' * 错误码元信息');
  lines.push(' */');
  lines.push('export interface GeneratedErrorCodeMeta {');
  lines.push('  /** 错误码 */');
  lines.push('  code: string;');
  lines.push('  /** 默认中文消息 */');
  lines.push('  message: string;');
  lines.push('  /** 后端 i18n 消息键 */');
  lines.push('  i18nKey?: string;');
  lines.push('  /** 来源模块 */');
  lines.push('  module: string;');
  lines.push('  /** 后端枚举常量名 */');
  lines.push('  enumName: string;');
  lines.push('  /** 后端声明的 HTTP 状态码 */');
  lines.push('  httpStatus?: number;');
  lines.push('  /** 是否可重试 */');
  lines.push('  retryable?: boolean;');
  lines.push('}');
  lines.push('');
  lines.push('/**');
  lines.push(' * 错误码元信息映射（与 GeneratedErrorCode 同源生成）');
  lines.push(' */');
  lines.push('export const GENERATED_ERROR_CODE_META: Record<string, GeneratedErrorCodeMeta> = {');
  for (const entry of entries) {
    const fields = [
      `code: '${entry.code}'`,
      `message: '${entry.message.replace(/'/g, "\\'")}'`,
      entry.i18nKey ? `i18nKey: '${entry.i18nKey}'` : undefined,
      `module: '${entry.module}'`,
      `enumName: '${entry.enumName}'`,
      entry.httpStatus ? `httpStatus: ${entry.httpStatus}` : undefined,
      entry.retryable ? 'retryable: true' : undefined,
    ].filter(Boolean);
    lines.push(`  ${entry.key}: { ${fields.join(', ')} },`);
  }
  lines.push('};');
  lines.push('');
  return lines.join('\n');
}

/** 内容哈希（lock 基线） */
function hashContent(content) {
  return createHash('sha256').update(content, 'utf8').digest('hex');
}

function main() {
  const checkMode = process.argv.includes('--check');
  const { entries, modules, files } = scanBackendCodes();

  if (entries.length === 0) {
    console.error('[gen-error-codes] 未解析到任何错误码，请检查后端仓库路径');
    process.exit(1);
  }

  const resolved = resolveConflicts(entries);
  const ts = renderTypeScript(resolved, modules);
  const hash = hashContent(ts);

  if (checkMode) {
    const baseline = existsSync(OUTPUT_LOCK) ? readFileSync(OUTPUT_LOCK, 'utf8').trim() : '';
    if (baseline !== hash) {
      console.error('[gen-error-codes] 错误码契约漂移：后端错误码定义与前端生成产物不一致。');
      console.error('  请运行 pnpm gen:error-codes 重新生成并随本次变更一并提交。');
      process.exit(1);
    }
    console.log(`[gen-error-codes] --check 通过：${resolved.length} 个错误码（${files} 个源文件）无漂移`);
    return;
  }

  writeFileSync(OUTPUT_TS, ts, 'utf8');
  writeFileSync(OUTPUT_LOCK, `${hash}\n`, 'utf8');
  console.log(`[gen-error-codes] 已生成 ${resolved.length} 个错误码（来自 ${files} 个源文件）`);
  console.log(`  产物: ${OUTPUT_TS}`);
  console.log(`  lock: ${OUTPUT_LOCK}`);
}

main();
