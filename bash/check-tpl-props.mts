#!/usr/bin/env node
/**
 * 模板"布尔 prop 误写为字符串字面量"门禁 —— 防止漏冒号的绑定静默失效。
 *
 * 缺陷形态（实测存在于本仓，非假想）：
 *   `<YdTable loading="isLoading">`、`<Page loading="isLoading">`、`<div loading="detailLoading">`
 *   —— 少写前导冒号，Vue 把**变量名本身**当字符串传进去。后果分三种，都坏：
 *     1) 目标组件有 `loading?: boolean`（YdTable）：`'isLoading'` 是真值 → 遮罩常驻，数据永远"在加载"；
 *     2) 目标组件没有该 prop（Page 只有 title/description/autoContentHeight/...）：属性落到根 DOM，
 *        加载态形同不存在，且 vue-tsc 未接入时无人报警；
 *     3) 目标是原生 `<div>`：`loading` 不是 div 的属性，纯属空写，遮罩永不出现。
 *   三种都只在"用户等半天没反应"时暴露，dev/build/单测全绿 —— 典型的必须靠门禁拦住的类别。
 *
 * 判据（只在足够精确时才报错，宁漏勿冤）：
 *   仅检查**状态型布尔属性白名单**（loading/disabled/visible/expanded/... 见 BOOLEAN_STATE_PROPS），
 *   值为"裸标识符"（`^[A-Za-z][A-Za-z0-9_]+$`，不含空格/连字符/点/插值，且不等于属性名本身），
 *   **且该标识符在同一 SFC 里被 const/let/var 声明过**（直书或解构）。
 *   于是 `loading="lazy"`、`fixed="right"`、`size="small"`、`prop="duration"`
 *   这些合法字面量不会被冤枉：它们要么不在白名单，要么文件里没有同名声明。
 *   已绑定的 `:loading="isLoading"`、`v-loading="isLoading"`、`v-bind:loading="x"` 一律跳过。
 *
 * 用法：
 *   node ./bash/check-tpl-props.mts             # 校验全仓
 *   node ./bash/check-tpl-props.mts --self-test # 用夹具证明门禁会拦、且不冤枉
 *
 * @path bash/check-tpl-props.mts
 * @author ydsz-team
 * @since 4.6.0
 */

import {
  existsSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative, resolve, sep } from 'node:path';

/** 未绑定的状态属性命中 */
interface UnboundHit {
  /** 属性名 */
  attr: string;
  /** 相对根目录的文件路径 */
  file: string;
  /** 被当成字符串的本地变量名 */
  ident: string;
  /** 1 起始行号 */
  line: number;
}

/** 只可能取布尔值的模板属性；取值型属性（size/type/fixed/variant）不在列，避免误报 */
const BOOLEAN_STATE_PROPS = [
  'auto-content-height',
  'checked',
  'clearable',
  'closable',
  'collapsible',
  'disabled',
  'expanded',
  'indeterminate',
  'is-loading',
  'loading',
  'multiple',
  'readonly',
  'refreshing',
  'selected',
  'spinning',
  'visible',
];

/** 跳过的目录（构建产物与依赖树不参与扫描） */
const SKIP_DIRS = new Set(['.git', '.turbo', 'coverage', 'dist', 'node_modules']);

/** 与布尔属性名重叠的后缀（如 v-loading 里的 loading）靠前导字符排除 */
const TAG_ATTR_RE = new RegExp(
  `(?:^|[\\s/<])(${BOOLEAN_STATE_PROPS.join('|')})="([A-Za-z][A-Za-z0-9_]+)"`,
  'g',
);

/**
 * 判定标识符是否在该 SFC 内被声明为本地变量。
 *
 * @param name 标识符
 * @param source 文件全文
 * @return 是否已声明
 */
function isDeclaredIdent(name: string, source: string): boolean {
  const patterns = [
    new RegExp(`(?:const|let|var)\\s+${name}\\b`),
    new RegExp(`(?:const|let|var)\\s*\\{[^}]*\\b${name}\\b`),
    new RegExp(`(?:const|let|var)\\s*\\[[^\\]]*\\b${name}\\b`),
  ];
  return patterns.some((re) => re.test(source));
}

/**
 * 递归列出目录下的 .vue 文件（跳过构建产物）。
 *
 * @param root 起始目录
 * @return 相对 root 的文件路径列表
 */
function listVueFiles(root: string): string[] {
  const out: string[] = [];
  const walk = (dir: string): void => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        if (!SKIP_DIRS.has(entry.name)) walk(join(dir, entry.name));
      } else if (entry.isFile() && entry.name.endsWith('.vue')) {
        out.push(relative(root, join(dir, entry.name)).split(sep).join('/'));
      }
    }
  };
  if (existsSync(root)) walk(root);
  return out;
}

/**
 * 取出 SFC 根 `<template>` 块。根模板恒在第 0 列，插槽模板有缩进，故以行首标签定位。
 *
 * @param source 文件全文
 * @return { startLine, text }；无根模板时返回 null
 */
function extractRootTemplate(source: string): null | { startLine: number; text: string } {
  const lines = source.split(/\r?\n/);
  const startLine = lines.findIndex((line) => /^<template[\s>]/.test(line));
  if (startLine < 0) return null;
  let endLine = lines.length - 1;
  for (let i = lines.length - 1; i > startLine; i -= 1) {
    if (/^<\/template>/.test(lines[i])) {
      endLine = i;
      break;
    }
  }
  return { startLine, text: lines.slice(startLine, endLine + 1).join('\n') };
}

/**
 * 扫描单个 SFC，返回未绑定的状态型布尔属性命中。
 *
 * @param fileRel 相对根目录的文件路径（仅用于报告）
 * @param source 文件全文
 * @return 命中列表
 */
function findUnboundProps(fileRel: string, source: string): UnboundHit[] {
  const tpl = extractRootTemplate(source);
  if (!tpl) return [];
  const hits: UnboundHit[] = [];
  for (const match of tpl.text.matchAll(TAG_ATTR_RE)) {
    const [, attr, ident] = match as unknown as [string, string, string];
    // `clearable="clearable"` 这类与属性名同字的字面量是显式意图，不算漏冒号
    if (ident === attr || ident === attr.replaceAll('-', '')) continue;
    if (!isDeclaredIdent(ident, source)) continue;
    hits.push({
      attr,
      file: fileRel,
      ident,
      line: tpl.startLine + tpl.text.slice(0, match.index).split('\n').length,
    });
  }
  return hits;
}

/**
 * 扫描整棵目录树。
 *
 * @param root 仓库或夹具根目录
 * @return 命中列表
 */
function scan(root: string): UnboundHit[] {
  const hits: UnboundHit[] = [];
  for (const rel of listVueFiles(root)) {
    hits.push(...findUnboundProps(rel, readFileSync(join(root, rel), 'utf-8')));
  }
  return hits;
}

/** 夹具：迷你 SFC，覆盖应拦（hit-*）与不应冤枉（clean-* / legal-*）两类 */
function fixtureFiles(): Record<string, string> {
  return {
    'clean-bound.vue': `<template>\n  <YdTable :loading="isLoading" fixed="right" size="small" />\n</template>\n<script setup lang="ts">\nconst isLoading = ref(false);\n</script>\n`,
    'clean-directive.vue': `<template>\n  <Page v-loading="isLoading" />\n  <img loading="lazy" />\n</template>\n<script setup lang="ts">\nconst isLoading = ref(false);\n</script>\n`,
    'clean-slot-template.vue': `<template>\n  <YdTable :data="rows">\n    <template #default="{ row }">\n      <YdButton :disabled="row.locked">{{ row.name }}</YdButton>\n    </template>\n  </YdTable>\n</template>\n<script setup lang="ts">\nconst rows = ref([]);\n</script>\n`,
    'hit-destructured.vue': `<template>\n  <YdButton disabled="isDisabled">ok</YdButton>\n</template>\n<script setup lang="ts">\nconst { isDisabled } = useFeatureFlags();\n</script>\n`,
    'hit-loading.vue': `<template>\n  <YdTable loading="isLoading" border />\n</template>\n<script setup lang="ts">\nconst isLoading = ref(false);\n</script>\n`,
    // `prop="duration"` 合法：取值来自数据模型字段名，且不在布尔属性白名单内
    'legal-prop-name.vue': `<template>\n  <YdTableColumn prop="duration" label="cost" />\n</template>\n<script setup lang="ts">\nconst duration = ref(0);\n</script>\n`,
  };
}

/**
 * 用夹具证明门禁"会拦、且不冤枉"。
 * 反例必须逐项命中——命中数不足即门禁本身失效（形同虚设的检查比没有检查更危险）。
 */
function selfTest(): void {
  const root = mkdtempSync(join(tmpdir(), 'ydsz-tpl-props-'));
  try {
    const fixtures = fixtureFiles();
    for (const [name, content] of Object.entries(fixtures)) {
      writeFileSync(join(root, name), content, 'utf-8');
    }
    const hits = scan(root);
    const rendered = hits.map((h) => `${h.file}:${h.attr}="${h.ident}"`);
    const required = ['hit-loading.vue:loading="isLoading"', 'hit-destructured.vue:disabled="isDisabled"'];
    const forbidden = [
      'clean-bound.vue:loading="isLoading"',
      'clean-directive.vue:loading="isLoading"',
      'legal-prop-name.vue:prop="duration"',
    ];
    const problems: string[] = [];
    for (const needle of required) {
      if (!rendered.includes(needle)) problems.push(`反例未命中: ${needle}`);
    }
    for (const needle of forbidden) {
      if (rendered.includes(needle)) problems.push(`合法写法被冤枉: ${needle}`);
    }
    if (hits.length !== required.length) {
      problems.push(`命中数 ${hits.length} 与期望 ${required.length} 不符：${rendered.join(', ')}`);
    }
    if (listVueFiles(root).length !== Object.keys(fixtures).length) {
      problems.push('夹具文件未被全部扫描到（遍历失效，门禁可能空跑）');
    }
    if (problems.length > 0) {
      console.error('[check:tpl] 门禁自检失败：');
      for (const problem of problems) console.error(`  - ${problem}`);
      process.exit(1);
    }
    console.log(
      `[check:tpl] 门禁自检通过 ✓ — 反例命中 ${required.length}/${required.length} 项，` +
        `合法写法 0 冤枉，夹具文件 ${Object.keys(fixtures).length} 个全部参与`,
    );
  } finally {
    rmSync(root, { force: true, recursive: true });
  }
}

function main(): void {
  const args = process.argv.slice(2);
  if (args.includes('--self-test')) {
    selfTest();
    return;
  }
  const unknown = args.filter((arg) => arg !== '--self-test');
  if (unknown.length > 0) {
    console.error(`[check:tpl] 未知参数: ${unknown.join(' ')}（可用：--self-test）`);
    process.exit(1);
  }
  const root = resolve(import.meta.dirname, '..');
  const files = listVueFiles(root);
  const hits = scan(root);
  if (files.length === 0) {
    console.error('[check:tpl] 一个 .vue 文件都没扫到 —— 门禁空跑，直接判失败');
    process.exit(1);
  }
  if (hits.length > 0) {
    console.error(`[check:tpl] 发现 ${hits.length} 处未绑定的状态型布尔属性：`);
    for (const hit of hits) {
      console.error(
        `  ${hit.file}:${hit.line}  ${hit.attr}="${hit.ident}"  ——  ${hit.ident} 是本文件里的变量，` +
          `应写成 :${hit.attr}="${hit.ident}"（组件无此 prop 时改用 v-loading 等指令）`,
      );
    }
    process.exit(1);
  }
  console.log(`[check:tpl] 模板绑定校验通过 ✓ — ${files.length} 个 .vue 文件无未绑定状态属性`);
}

main();
