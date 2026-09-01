/**
 * 云顶编码规范合规扫描器（vsh check-standard）
 *
 * 以代码事实为准，对 apps/ comm/ main/ 逐项核验《前端模块-云顶编码规范》19 章
 * 中的【强制】条款，输出结构化违规清单。
 *
 * 判定口径严格对齐规范原文：
 * - §3.1  业务代码（apps/*、comm/effects/*、main/* 非生成件）严禁 any
 * - §4.1  `<script setup>` 优先，结构顺序 script → template → style
 * - §4.4  组件文件名与组件名使用 PascalCase
 * - §4.6  v-for 禁止索引作为 key
 * - §5.3  首屏外图片必须 loading="lazy"
 * - §14.5 生产环境禁止 console.*
 * - §15.1 SFC ≤1000 行 / 逻辑文件 ≤500 行 / 数据文件 ≤1000 行（需 @data-file）
 * - §15.3 函数行数 ≤50 行
 *
 * 用法：pnpm vsh:check-standard
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

const ROOT = process.cwd();

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

// ---------------------------------------------------------------------------
// 类型
// ---------------------------------------------------------------------------

interface Violation {
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

type Severity = Violation['severity'];

// ---------------------------------------------------------------------------
// 工具
// ---------------------------------------------------------------------------

const violations: Violation[] = [];

function add(
  rule: string,
  file: string,
  line: number,
  message: string,
  severity: Severity,
): void {
  violations.push({ rule, file, line, message, severity });
}

function rel(abs: string): string {
  return relative(ROOT, abs).split(sep).join('/');
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

const TS_FILES = walk(join(ROOT, 'apps'), ['.ts'])
  .concat(walk(join(ROOT, 'comm'), ['.ts']))
  .concat(walk(join(ROOT, 'main'), ['.ts']));

const VUE_FILES = walk(join(ROOT, 'apps'), ['.vue'])
  .concat(walk(join(ROOT, 'comm'), ['.vue']))
  .concat(walk(join(ROOT, 'main'), ['.vue']));

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

function checkAny(): void {
  for (const file of [...TS_FILES, ...VUE_FILES]) {
    const p = rel(file);
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
      for (const { re, label } of ANY_PATTERNS) {
        re.lastIndex = 0;
        if (re.test(line)) {
          add('§3.1', p, i + 1, `${label}：${trimmed.slice(0, 90)}`, 'P1');
        }
      }
    }
  }
}

// ---------------------------------------------------------------------------
// §4.1 script setup 优先 + 结构顺序
// ---------------------------------------------------------------------------

function checkSfcStructure(): void {
  for (const file of VUE_FILES) {
    const p = rel(file);
    const content = read(file);
    if (!content) continue;

    const hasScript = /<script[\s>]/.test(content);
    const hasSetup = /<script[^>]*\bsetup\b[^>]*>/.test(content);
    const hasTemplate = /<template[\s>]/.test(content);

    if (!hasScript) continue;

    if (!hasSetup) {
      add('§4.1', p, 0, 'SFC 未使用 <script setup> 语法', 'P2');
    }

    // 结构顺序：script → template → style
    if (hasSetup && hasTemplate) {
      const scriptIdx = content.search(/<script[^>]*\bsetup\b[^>]*>/);
      const templateIdx = content.search(/<template[\s>]/);
      if (templateIdx >= 0 && scriptIdx > templateIdx) {
        add(
          '§4.1',
          p,
          0,
          'SFC 结构顺序违规：<template> 应位于 <script setup> 之后',
          'P2',
        );
      }
    }
  }
}

// ---------------------------------------------------------------------------
// §4.4 组件文件名 PascalCase
// ---------------------------------------------------------------------------

function checkComponentNaming(): void {
  for (const file of VUE_FILES) {
    const p = rel(file);
    const base = p.split('/').pop() ?? '';
    if (base === 'index.vue') continue; // index.vue 是目录组件约定，单独统计
    if (EXEMPT_FILE_PATTERN.test(p)) continue;
    if (!/^[A-Z]/.test(base)) {
      add('§4.4', p, 0, `组件文件名应为 PascalCase，当前：${base}`, 'P2');
    }
  }
}

// ---------------------------------------------------------------------------
// §4.6 v-for 禁止索引 key
// ---------------------------------------------------------------------------

const INDEX_KEY_RE = /:key\s*=\s*["'](index|i|idx|idx2|_\w*)["']/g;

function checkVForKey(): void {
  for (const file of VUE_FILES) {
    const p = rel(file);
    const content = read(file);
    if (!content) continue;
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      INDEX_KEY_RE.lastIndex = 0;
      const line = lines[i] ?? '';
      if (INDEX_KEY_RE.test(line)) {
        add('§4.6', p, i + 1, `v-for 使用索引作为 key：${line.trim().slice(0, 80)}`, 'P1');
      }
    }
  }
}

// ---------------------------------------------------------------------------
// §5.3 图片懒加载
// ---------------------------------------------------------------------------

function checkImageLazy(): void {
  for (const file of VUE_FILES) {
    const p = rel(file);
    const content = read(file);
    if (!content || !/<img[\s>]/.test(content)) continue;

    // 提取所有 <img ...> 标签（支持多行）
    const imgRe = /<img\b[\s\S]*?>/g;
    let m: RegExpExecArray | null;
    while ((m = imgRe.exec(content)) !== null) {
      const tag = m[0];
      const offset = content.slice(0, m.index).split('\n').length;
      if (!/loading\s*=\s*["']lazy["']/.test(tag)) {
        add(
          '§5.3',
          p,
          offset,
          `<img> 缺少 loading="lazy"（首屏内图片可豁免，需人工确认）`,
          'P2',
        );
      }
    }
  }
}

// ---------------------------------------------------------------------------
// §14.5 生产环境禁止 console
// ---------------------------------------------------------------------------

const CONSOLE_RE = /\bconsole\s*\.\s*(log|info|warn|error|debug)\s*\(/g;

function checkConsole(): void {
  const scan = [...TS_FILES, ...VUE_FILES];
  for (const file of scan) {
    const p = rel(file);
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
      CONSOLE_RE.lastIndex = 0;
      if (CONSOLE_RE.test(line)) {
        add('§14.5', p, i + 1, `直接使用 console，应改用 logger：${trimmed.slice(0, 80)}`, 'P1');
      }
    }
  }
}

// ---------------------------------------------------------------------------
// §15.1 文件行数
// ---------------------------------------------------------------------------

function isDataFile(content: string): boolean {
  // 判定工具：不含函数体与控制流语法即视为声明/资源类文件
  return !/\bfunction\b|=>\s*[{]|=>\s*[^(]*$|\bif\s*\(|\bfor\s*\(|\bwhile\s*\(|\bswitch\s*\(/.test(
    content.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, ''),
  );
}

function checkFileLength(): void {
  const all = [...TS_FILES, ...VUE_FILES];
  for (const file of all) {
    const p = rel(file);
    const content = read(file);
    if (!content) continue;
    const lines = content.split('\n').length;
    const isVue = p.endsWith('.vue');
    const isGenerated = content.includes(GENERATED_MARKER);
    const hasDataFileTag = content.includes('@data-file');
    const isTypeFile = /types?\.ts$|\.d\.ts$/.test(p);

    if (isVue) {
      if (lines > 1000) {
        add('§15.1', p, 0, `Vue SFC ${lines} 行，超过 1000 行上限`, 'P1');
      }
      continue;
    }

    if (isTypeFile) {
      if (lines > 1500) {
        add('§15.1', p, 0, `类型声明文件 ${lines} 行，超过 1500 行上限`, 'P1');
      }
      continue;
    }

    const dataLike = isDataFile(content);

    if (dataLike || isGenerated) {
      if (lines > 1000) {
        add(
          '§15.1',
          p,
          0,
          `数据/生成文件 ${lines} 行，超过 1000 行上限（需按模块拆分）`,
          'P1',
        );
      }
      if (lines > 500 && !hasDataFileTag) {
        add(
          '§15.1',
          p,
          0,
          `数据文件 ${lines} 行但缺少 // @data-file 顶部注解`,
          'P2',
        );
      }
      continue;
    }

    if (lines > 500) {
      add('§15.1', p, 0, `业务逻辑文件 ${lines} 行，超过 500 行上限`, 'P1');
    }
  }
}

// ---------------------------------------------------------------------------
// §15.3 函数行数 ≤ 50
// ---------------------------------------------------------------------------

function checkFunctionLength(): void {
  for (const file of TS_FILES) {
    const p = rel(file);
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
          add('§15.3', p, start + 1, `函数 ${name}() 共 ${len} 行，超过 50 行上限`, 'P2');
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
  { re: /(?:password|passwd|pwd)\s*[:=]\s*['"][^'"]{6,}['"]/gi, label: '疑似硬编码密码' },
  { re: /(?:secret|apiKey|api_key|token)\s*[:=]\s*['"][A-Za-z0-9_-]{16,}['"]/gi, label: '疑似硬编码密钥/Token' },
];

function checkSecrets(): void {
  for (const file of [...TS_FILES, ...VUE_FILES]) {
    const p = rel(file);
    if (EXEMPT_FILE_PATTERN.test(p)) continue;
    const content = read(file);
    if (!content) continue;
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i] ?? '';
      const trimmed = line.trim();
      if (trimmed.startsWith('*') || trimmed.startsWith('//')) continue;
      for (const { re, label } of SECRET_PATTERNS) {
        re.lastIndex = 0;
        if (re.test(line)) {
          add('§7.3', p, i + 1, `${label}：${trimmed.slice(0, 70)}`, 'P0');
        }
      }
    }
  }
}

// ---------------------------------------------------------------------------
// 主流程
// ---------------------------------------------------------------------------

function main(): void {
  checkAny();
  checkSfcStructure();
  checkComponentNaming();
  checkVForKey();
  checkImageLazy();
  checkConsole();
  checkFileLength();
  checkFunctionLength();
  checkSecrets();

  // 汇总
  const bySeverity: Record<Severity, number> = { P0: 0, P1: 0, P2: 0 };
  for (const v of violations) bySeverity[v.severity]++;

  console.log('\n=== 云顶编码规范合规扫描（vsh check-standard）===\n');
  console.log(`扫描文件：TS ${TS_FILES.length} 个 / Vue ${VUE_FILES.length} 个\n`);

  const order: Severity[] = ['P0', 'P1', 'P2'];
  for (const sev of order) {
    const list = violations.filter((v) => v.severity === sev);
    if (list.length === 0) continue;
    console.log(`--- ${sev}（${list.length} 项）---`);
    // 按规则分组
    const byRule = new Map<string, Violation[]>();
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

  console.log(
    `统计：P0 ${bySeverity.P0} / P1 ${bySeverity.P1} / P2 ${bySeverity.P2}，合计 ${violations.length} 项\n`,
  );
}

main();
