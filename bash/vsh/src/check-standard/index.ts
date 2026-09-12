/**
 * 云顶编码规范合规扫描器（vsh check-standard）
 *
 * 以代码事实为准，对 apps/ comm/ main/ 逐项核验《前端模块-云顶编码规范》
 * 中的【强制】条款，返回结构化违规清单。
 *
 * 判定口径严格对齐规范原文（规则编号与规范章节一一对应）：
 * - §3.1  业务代码（apps/*、comm/effects/*、main/* 非生成件）严禁 any
 * - §4.1  `<script setup>` 优先，结构顺序 script → template → style
 * - §4.4  组件文件命名分层：UI Kit 生成件（comm/@core/ui-kit/**）PascalCase，
 *         页面级视图与业务组件 kebab-case（规范 v1.0.3 修订口径）
 * - §4.6  v-for 禁止索引作为 key
 * - §5.3  首屏外图片必须 loading="lazy"
 * - §7.1  v-html 必须经净化指令（v-safe-html），裸 v-html 视为违规
 * - §14.5 生产环境禁止 console.*
 * - §16.1 SFC ≤1000 行 / 逻辑文件 ≤500 行 / 数据文件 ≤1000 行（需 @data-file）
 * - §16.3 函数行数 ≤50 行
 * - §7.3  硬编码敏感信息（mock 数据与占位值自动豁免）
 *
 * 退出策略（CLI 侧执行）：P0/P1 计入失败，P2 仅提示不阻断。
 *
 * @path bash\vsh\src\check-standard\index.ts
 * @author ydsz-team
 * @since 1.0.0
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

// ---------------------------------------------------------------------------
// 配置
// ---------------------------------------------------------------------------

/** 跳过这些路径片段 */
const SKIP_SEGMENTS = new Set([
  'node_modules',
  'dist',
  'coverage',
  '.turbo',
  '.git',
  'build',
  '.output',
  'public',
  'vendor',
]);

/** §3.1 豁免：第三方 CLI 生成件，其受控 any 透传不可控 */
const ANY_EXEMPT_SEGMENTS = ['shadcn-ui', '__tests__', '.generated-archived'];

/** 测试 / 示例 / stories 文件：console 与 any 豁免，但行数仍受约束 */
const EXEMPT_FILE_PATTERN = /(\.test\.|\.spec\.|__tests__|\.stories\.|coverage)/i;

/** 生成件：行数豁免但需 @data-file 注解 */
const GENERATED_MARKER = 'auto-generated';

/** §7.3 豁免：mock 数据目录（伪造 token/密码不构成密钥泄露） */
const MOCK_SEGMENT = '/mock/';

/** §7.3 豁免：占位值特征（命中即视为非真实密钥） */
const PLACEHOLDER_VALUE_RE = /mock|example|sample|placeholder|dummy|test|xxxx|fixme/i;

/**
 * 判断某行是否被上一行的 eslint-disable 指令豁免。
 *
 * <p>仓库 lint 配置是例外授权的单一事实源：凡带内联豁免注释并说明
 * 理由的行，本扫描器不再重复计为违规（避免双重门禁口径漂移）。
 *
 * @param lines 源码行列表
 * @param index 当前行下标（0 起）
 * @param ruleId eslint 规则名（如 no-console / no-explicit-any）
 * @returns 是否已被豁免
 */
function isDisabledAbove(lines: string[], index: number, ruleId: string): boolean {
  if (index === 0) return false;
  const prev = (lines[index - 1] ?? '').trim();
  return prev.startsWith('//') && prev.includes('eslint-disable') && prev.includes(ruleId);
}

/** UI Kit 生成件根目录：§4.4 该目录强制 PascalCase */
const UI_KIT_SEGMENT = 'comm/@core/ui-kit/';

// ---------------------------------------------------------------------------
// 类型
// ---------------------------------------------------------------------------

/** 单条违规记录 */
export interface StandardViolation {
  /** 规范章节，如 "§4.6" */
  rule: string;
  /** 相对路径 */
  file: string;
  /** 行号（0 表示文件级） */
  line: number;
  /** 描述 */
  message: string;
  /** 优先级：P0 阻断 / P1 严重 / P2 一般 */
  severity: 'P0' | 'P1' | 'P2';
}

type Severity = StandardViolation['severity'];

/** 扫描选项 */
export interface CheckStandardOptions {
  /** 仓库根目录（默认 process.cwd()） */
  rootDir?: string;
}

// ---------------------------------------------------------------------------
// 工具
// ---------------------------------------------------------------------------

function rel(rootDir: string, abs: string): string {
  return relative(rootDir, abs).split(sep).join('/');
}

/** 递归收集文件 */
function walk(dir: string, exts: string[], out: string[] = []): string[] {
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return out;
  }
  for (const name of entries) {
    if (SKIP_SEGMENTS.has(name)) continue;
    const full = join(dir, name);
    let st;
    try {
      st = statSync(full);
    } catch {
      continue;
    }
    if (st.isDirectory()) {
      walk(full, exts, out);
    } else if (exts.some((e) => name.endsWith(e))) {
      out.push(full);
    }
  }
  return out;
}

function read(abs: string): string {
  try {
    return readFileSync(abs, 'utf8');
  } catch {
    return '';
  }
}

// ---------------------------------------------------------------------------
// §3.1 严禁 any（业务代码）
// ---------------------------------------------------------------------------

const ANY_PATTERNS: Array<{ re: RegExp; label: string }> = [
  { re: /:\s*\bany\b\s*(?=[;,)\]>=])/g, label: '显式 any 类型标注' },
  { re: /<\s*any\s*>/g, label: '泛型 any 实参' },
  { re: /\bas\s+any\b/g, label: 'as any 类型断言' },
  { re: /\bany\s*\[\s*\]/g, label: 'any[] 数组' },
  { re: /\bArray\s*<\s*any\s*>/g, label: 'Array<any>' },
  { re: /\bRecord\s*<\s*string\s*,\s*any\s*>/g, label: 'Record<string, any>' },
  { re: /\bPromise\s*<\s*any\s*>/g, label: 'Promise<any>' },
];

function checkAny(
  files: string[],
  rootDir: string,
  violations: StandardViolation[],
): void {
  for (const file of files) {
    const p = rel(rootDir, file);
    if (ANY_EXEMPT_SEGMENTS.some((s) => p.includes(s))) continue;
    if (EXEMPT_FILE_PATTERN.test(p)) continue;
    const content = read(file);
    if (!content) continue;
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i] ?? '';
      // 跳过纯注释行中的说明性文字（如"避免使用 as any"）
      const trimmed = line.trim();
      if (trimmed.startsWith('*') || trimmed.startsWith('//')) continue;
      if (isDisabledAbove(lines, i, 'no-explicit-any')) continue;
      for (const { re, label } of ANY_PATTERNS) {
        re.lastIndex = 0;
        if (re.test(line)) {
          violations.push({
            rule: '§3.1',
            file: p,
            line: i + 1,
            message: `${label}：${trimmed.slice(0, 90)}`,
            severity: 'P1',
          });
        }
      }
    }
  }
}

// ---------------------------------------------------------------------------
// §4.1 script setup 优先 + 结构顺序
// ---------------------------------------------------------------------------

function checkSfcStructure(
  vueFiles: string[],
  rootDir: string,
  violations: StandardViolation[],
): void {
  for (const file of vueFiles) {
    const p = rel(rootDir, file);
    const content = read(file);
    if (!content) continue;

    const hasScript = /<script[\s>]/.test(content);
    const hasSetup = /<script[^>]*\bsetup\b[^>]*>/.test(content);
    const hasTemplate = /<template[\s>]/.test(content);

    if (!hasScript) continue;

    if (!hasSetup) {
      violations.push({
        rule: '§4.1',
        file: p,
        line: 0,
        message: 'SFC 未使用 <script setup> 语法',
        severity: 'P2',
      });
    }

    // 结构顺序：script → template → style
    if (hasSetup && hasTemplate) {
      const scriptIdx = content.search(/<script[^>]*\bsetup\b[^>]*>/);
      const templateIdx = content.search(/<template[\s>]/);
      if (templateIdx >= 0 && scriptIdx > templateIdx) {
        violations.push({
          rule: '§4.1',
          file: p,
          line: 0,
          message: 'SFC 结构顺序违规：<template> 应位于 <script setup> 之后',
          severity: 'P2',
        });
      }
    }
  }
}

// ---------------------------------------------------------------------------
// §4.4 组件文件命名（分层口径：UI Kit PascalCase / 业务 kebab-case）
// ---------------------------------------------------------------------------

function checkComponentNaming(
  vueFiles: string[],
  rootDir: string,
  violations: StandardViolation[],
): void {
  for (const file of vueFiles) {
    const p = rel(rootDir, file);
    const base = p.split('/').pop() ?? '';
    if (base === 'index.vue') continue; // index.vue 是目录组件约定
    if (EXEMPT_FILE_PATTERN.test(p)) continue;
    const isUiKit = p.replaceAll('\\', '/').includes(UI_KIT_SEGMENT);
    const startsUpper = /^[A-Z]/.test(base);
    if (isUiKit && !startsUpper) {
      violations.push({
        rule: '§4.4',
        file: p,
        line: 0,
        message: `UI Kit 组件文件名应为 PascalCase，当前：${base}`,
        severity: 'P2',
      });
    } else if (!isUiKit && startsUpper) {
      violations.push({
        rule: '§4.4',
        file: p,
        line: 0,
        message: `业务组件/页面文件名应为 kebab-case，当前：${base}`,
        severity: 'P2',
      });
    }
  }
}

// ---------------------------------------------------------------------------
// §4.6 v-for 禁止索引 key
// ---------------------------------------------------------------------------

const INDEX_KEY_RE = /:key\s*=\s*["'](index|i|idx|idx2|_\w*)["']/g;

/**
 * 判断是否为数值区间迭代（v-for="i in n"）且以循环变量自身作 key。
 *
 * <p>区间迭代没有数组索引语义，循环变量即元素身份，用其作 key 是正确做法，
 * 不属于 §4.6 约束的「数组下标作 key」。
 *
 * @param lines 源码行列表
 * @param index 当前行下标（0 起）
 * @returns 是否为区间迭代的身份 key
 */
function isRangeLoopIdentityKey(lines: string[], index: number): boolean {
  // v-for 与 :key 常分行书写，取上方 4 行作为上下文窗口
  const window = lines.slice(Math.max(0, index - 4), index + 2).join('\n');
  const loop = /v-for\s*=\s*["']\s*(\w+)\s+in\s+/.exec(window);
  if (!loop) return false;
  const key = /:key\s*=\s*["'](\w+)["']/.exec(lines[index] ?? '');
  return key != null && key[1] === loop[1];
}

function checkVForKey(
  vueFiles: string[],
  rootDir: string,
  violations: StandardViolation[],
): void {
  for (const file of vueFiles) {
    const p = rel(rootDir, file);
    const content = read(file);
    if (!content) continue;
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      INDEX_KEY_RE.lastIndex = 0;
      const line = lines[i] ?? '';
      if (INDEX_KEY_RE.test(line)) {
        if (isRangeLoopIdentityKey(lines, i)) continue;
        // 已标注 @index-key 豁免说明（数据无稳定 ID 且只读展示）的场景跳过
        const window = lines.slice(Math.max(0, i - 2), i + 6).join('\n');
        if (window.includes('@index-key')) continue;
        violations.push({
          rule: '§4.6',
          file: p,
          line: i + 1,
          message: `v-for 使用索引作为 key：${line.trim().slice(0, 80)}`,
          severity: 'P1',
        });
      }
    }
  }
}

// ---------------------------------------------------------------------------
// §5.3 图片懒加载
// ---------------------------------------------------------------------------

function checkImageLazy(
  vueFiles: string[],
  rootDir: string,
  violations: StandardViolation[],
): void {
  for (const file of vueFiles) {
    const p = rel(rootDir, file);
    const content = read(file);
    if (!content || !/<img[\s>]/.test(content)) continue;

    // 提取所有 <img ...> 标签（支持多行）
    const imgRe = /<img\b[\s\S]*?>/g;
    let m: RegExpExecArray | null;
    while ((m = imgRe.exec(content)) !== null) {
      const tag = m[0];
      const offset = content.slice(0, m.index).split('\n').length;
      if (!/loading\s*=\s*["']lazy["']/.test(tag)) {
        violations.push({
          rule: '§5.3',
          file: p,
          line: offset,
          message: '<img> 缺少 loading="lazy"（首屏内图片可豁免，需人工确认）',
          severity: 'P2',
        });
      }
    }
  }
}

// ---------------------------------------------------------------------------
// §7.1 裸 v-html（未净化）
// ---------------------------------------------------------------------------

function checkBareVHtml(
  vueFiles: string[],
  rootDir: string,
  violations: StandardViolation[],
): void {
  for (const file of vueFiles) {
    const p = rel(rootDir, file);
    const content = read(file);
    if (!content || !content.includes('v-html')) continue;
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i] ?? '';
      const trimmed = line.trim();
      if (trimmed.startsWith('<!--')) continue;
      // 裸 v-html 判定：v-html 前不能是连字符（排除 v-safe-html 等净化指令）
      if (/(^|[^-\w])v-html\s*=/.test(line)) {
        violations.push({
          rule: '§7.1',
          file: p,
          line: i + 1,
          message: '裸 v-html 未净化，应改用 v-safe-html 或 v-text：' + trimmed.slice(0, 70),
          severity: 'P1',
        });
      }
    }
  }
}

// ---------------------------------------------------------------------------
// §14.5 生产环境禁止 console
// ---------------------------------------------------------------------------

const CONSOLE_RE = /\bconsole\s*\.\s*(log|info|warn|error|debug)\s*\(/g;

function checkConsole(
  files: string[],
  rootDir: string,
  violations: StandardViolation[],
): void {
  for (const file of files) {
    const p = rel(rootDir, file);
    // logger 实现本身允许使用 console
    if (p.endsWith('logger.ts')) continue;
    if (EXEMPT_FILE_PATTERN.test(p)) continue;
    const content = read(file);
    if (!content) continue;
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i] ?? '';
      const trimmed = line.trim();
      if (trimmed.startsWith('*') || trimmed.startsWith('//')) continue;
      if (isDisabledAbove(lines, i, 'no-console')) continue;
      // @console-allow 标记的开发期基础设施豁免（说明理由后允许使用 console）
      if (trimmed.includes('@console-allow')) continue;
      if (i > 0 && (lines[i - 1] ?? '').includes('@console-allow')) continue;
      CONSOLE_RE.lastIndex = 0;
      if (CONSOLE_RE.test(line)) {
        violations.push({
          rule: '§14.5',
          file: p,
          line: i + 1,
          message: `直接使用 console，应改用 logger：${trimmed.slice(0, 80)}`,
          severity: 'P1',
        });
      }
    }
  }
}

// ---------------------------------------------------------------------------
// §16.1 文件行数
// ---------------------------------------------------------------------------

function isDataFile(content: string): boolean {
  // 判定工具：不含函数体与控制流语法即视为声明/资源类文件
  return !/\bfunction\b|=>\s*[{]|=>\s*[^(]*$|\bif\s*\(|\bfor\s*\(|\bwhile\s*\(|\bswitch\s*\(/.test(
    content.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, ''),
  );
}

/**
 * 按编辑器口径统计行数：文件末尾的换行符不计为一行。
 *
 * @param content 源码内容
 * @returns 行数
 */
function countLines(content: string): number {
  const lines = content.split('\n');
  if (lines.length > 0 && lines[lines.length - 1] === '') lines.pop();
  return lines.length;
}

function checkFileLength(
  files: string[],
  rootDir: string,
  violations: StandardViolation[],
): void {
  for (const file of files) {
    const p = rel(rootDir, file);
    const content = read(file);
    if (!content) continue;
    const lines = countLines(content);
    const isVue = p.endsWith('.vue');
    const isGenerated = content.includes(GENERATED_MARKER);
    const hasDataFileTag = content.includes('@data-file');
    const isTypeFile = /types?\.ts$|\.d\.ts$/.test(p);

    if (isVue) {
      if (lines > 1000) {
        violations.push({
          rule: '§16.1',
          file: p,
          line: 0,
          message: `Vue SFC ${lines} 行，超过 1000 行上限`,
          severity: 'P1',
        });
      }
      continue;
    }

    if (isTypeFile) {
      // 生成件类型声明（如 openapi-typescript 的 schema.d.ts）不可手工拆分，豁免行数上限
      if (lines > 1500 && !isGenerated) {
        violations.push({
          rule: '§16.1',
          file: p,
          line: 0,
          message: `类型声明文件 ${lines} 行，超过 1500 行上限`,
          severity: 'P1',
        });
      }
      continue;
    }

    const dataLike = isDataFile(content);

    if (dataLike || isGenerated) {
      // 生成件（auto-generated 标记）由生成器产出、不可手工拆分，
      // 行数上限仅约束人工维护的数据文件；但仍要求 @data-file 注解以示豁免口径。
      if (lines > 1000 && !isGenerated) {
        violations.push({
          rule: '§16.1',
          file: p,
          line: 0,
          message: `数据/生成文件 ${lines} 行，超过 1000 行上限（需按模块拆分）`,
          severity: 'P1',
        });
      }
      // @data-file 注解仅约束人工维护的数据文件；生成件已有 auto-generated 标记
      if (lines > 500 && !hasDataFileTag && !isGenerated) {
        violations.push({
          rule: '§16.1',
          file: p,
          line: 0,
          message: '数据文件 ' + lines + ' 行但缺少 // @data-file 顶部注解',
          severity: 'P2',
        });
      }
      continue;
    }

    if (lines > 500) {
      violations.push({
        rule: '§16.1',
        file: p,
        line: 0,
        message: `业务逻辑文件 ${lines} 行，超过 500 行上限`,
        severity: 'P1',
      });
    }
  }
}

// ---------------------------------------------------------------------------
// §16.3 函数行数 ≤ 50
// ---------------------------------------------------------------------------

function checkFunctionLength(
  tsFiles: string[],
  rootDir: string,
  violations: StandardViolation[],
): void {
  for (const file of tsFiles) {
    const p = rel(rootDir, file);
    if (EXEMPT_FILE_PATTERN.test(p)) continue;
    const content = read(file);
    if (!content) continue;
    if (isDataFile(content)) continue;

    const lines = content.split('\n');
    let start = -1;
    let name = '';
    let depth = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i] ?? '';
      if (start < 0) {
        const m = /^\s*(?:export\s+)?(?:async\s+)?function\s+(\w+)/.exec(line)
          ?? /^\s*(?:export\s+)?const\s+(\w+)\s*=\s*(?:async\s*)?\(/.exec(line);
        if (m && line.trimEnd().endsWith('{')) {
          start = i;
          name = m[1] ?? '(anonymous)';
          depth = 0;
        }
        continue;
      }
      for (const ch of line) {
        if (ch === '{') depth++;
        else if (ch === '}') depth--;
      }
      if (depth <= 0 && start >= 0) {
        const len = i - start + 1;
        if (len > 50) {
          violations.push({
            rule: '§16.3',
            file: p,
            line: start + 1,
            message: `函数 ${name}() 共 ${len} 行，超过 50 行上限`,
            severity: 'P2',
          });
        }
        start = -1;
      }
    }
  }
}

// ---------------------------------------------------------------------------
// §7.3 硬编码敏感信息
// ---------------------------------------------------------------------------

const SECRET_PATTERNS: Array<{ re: RegExp; label: string }> = [
  { re: /\bsk-[A-Za-z0-9]{16,}/g, label: '疑似 OpenAI/LLM API Key' },
  { re: /\b(AKIA|ASIA)[0-9A-Z]{16}\b/g, label: '疑似 AWS Access Key' },
  {
    re: /(?:password|passwd|pwd)\s*[:=]\s*['"][^'"]{6,}['"]/gi,
    label: '疑似硬编码密码',
  },
  {
    re: /(?:secret|apiKey|api_key|token)\s*[:=]\s*['"][A-Za-z0-9_-]{16,}['"]/gi,
    label: '疑似硬编码密钥/Token',
  },
];

/**
 * 判断密钥字面量是否为占位值（变量绑定 / mock 造数），占位值不算泄露。
 *
 * <p>形如 `:password="modelValue"` 的属性绑定、`'mock-access-token-xxx'`
 * 等拼接造数均应豁免。
 *
 * @param line 待检源码行
 * @returns 是否为占位值
 */
function isPlaceholderSecret(line: string): boolean {
  const values = line.match(/['"]([^'"]+)['"]/g) ?? [];
  for (const raw of values) {
    const value = raw.slice(1, -1);
    if (PLACEHOLDER_VALUE_RE.test(value)) return true;
    // 合法标识符引用（变量绑定）而非字面量
    if (/^[A-Za-z_$][\w$.]*$/.test(value)) return true;
  }
  return false;
}

function checkSecrets(
  files: string[],
  rootDir: string,
  violations: StandardViolation[],
): void {
  for (const file of files) {
    const p = rel(rootDir, file);
    if (EXEMPT_FILE_PATTERN.test(p)) continue;
    // mock 目录为伪造造数，不构成密钥泄露
    if (p.replaceAll('\\', '/').includes(MOCK_SEGMENT)) continue;
    const content = read(file);
    if (!content) continue;
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i] ?? '';
      const trimmed = line.trim();
      if (trimmed.startsWith('*') || trimmed.startsWith('//')) continue;
      if (isPlaceholderSecret(line)) continue;
      for (const { re, label } of SECRET_PATTERNS) {
        re.lastIndex = 0;
        if (re.test(line)) {
          violations.push({
            rule: '§7.3',
            file: p,
            line: i + 1,
            message: `${label}：${trimmed.slice(0, 70)}`,
            severity: 'P0',
          });
        }
      }
    }
  }
}

// ---------------------------------------------------------------------------
// 主入口
// ---------------------------------------------------------------------------

/**
 * 执行云顶编码规范合规扫描。
 *
 * @param options 扫描选项（rootDir 默认 process.cwd()）
 * @returns 全部违规记录（P0/P1/P2 已分级）
 */
export function checkStandard(
  options: CheckStandardOptions = {},
): StandardViolation[] {
  const rootDir = options.rootDir ?? process.cwd();
  const violations: StandardViolation[] = [];

  const tsFiles = [
    ...walk(join(rootDir, 'apps'), ['.ts']),
    ...walk(join(rootDir, 'comm'), ['.ts']),
    ...walk(join(rootDir, 'main'), ['.ts']),
  ];
  const vueFiles = [
    ...walk(join(rootDir, 'apps'), ['.vue']),
    ...walk(join(rootDir, 'comm'), ['.vue']),
    ...walk(join(rootDir, 'main'), ['.vue']),
  ];

  checkAny([...tsFiles, ...vueFiles], rootDir, violations);
  checkSfcStructure(vueFiles, rootDir, violations);
  checkComponentNaming(vueFiles, rootDir, violations);
  checkVForKey(vueFiles, rootDir, violations);
  checkImageLazy(vueFiles, rootDir, violations);
  checkBareVHtml(vueFiles, rootDir, violations);
  checkConsole([...tsFiles, ...vueFiles], rootDir, violations);
  checkFileLength([...tsFiles, ...vueFiles], rootDir, violations);
  checkFunctionLength(tsFiles, rootDir, violations);
  checkSecrets([...tsFiles, ...vueFiles], rootDir, violations);

  return violations;
}

/**
 * 按严重级别与规则分组输出违规清单。
 *
 * @param violations 违规记录列表
 * @param fileCount  参与扫描的文件统计
 */
export function reportStandard(
  violations: StandardViolation[],
  fileCount: { ts: number; vue: number },
): void {
  console.log('\n=== 云顶编码规范合规扫描（vsh check-standard）===\n');
  console.log(`扫描文件：TS ${fileCount.ts} 个 / Vue ${fileCount.vue} 个\n`);

  const order: Severity[] = ['P0', 'P1', 'P2'];
  for (const sev of order) {
    const list = violations.filter((v) => v.severity === sev);
    if (list.length === 0) continue;
    console.log(`--- ${sev}（${list.length} 项）---`);
    // 按规则分组
    const byRule = new Map<string, StandardViolation[]>();
    for (const v of list) {
      const arr = byRule.get(v.rule) ?? [];
      arr.push(v);
      byRule.set(v.rule, arr);
    }
    for (const [rule, arr] of [...byRule.entries()].sort()) {
      console.log(`  [${rule}] ${arr.length} 项`);
      for (const v of arr.slice(0, 40)) {
        const loc = v.line > 0 ? `:${v.line}` : '';
        console.log(`    ${v.file}${loc} — ${v.message}`);
      }
      if (arr.length > 40) console.log(`    ... 另有 ${arr.length - 40} 项`);
    }
    console.log('');
  }

  const bySeverity: Record<Severity, number> = { P0: 0, P1: 0, P2: 0 };
  for (const v of violations) bySeverity[v.severity]++;
  console.log(
    `统计：P0 ${bySeverity.P0} / P1 ${bySeverity.P1} / P2 ${bySeverity.P2}，合计 ${violations.length} 项\n`,
  );
}
