#!/usr/bin/env node
/**
 * check-locales.mjs — 国际化 key 一致性校验
 *
 * 遍历全仓所有语言目录（comm / main / apps/*），对每种语言文件
 * 递归对比 zh-CN 与 en-US 的 key 集合，存在缺失 key 时输出差异并退出码非 0。
 * 语言目录结构约定：langs/<lang>/<module>.json（成对出现在同一 langs 目录下）。
 *
 * 设计契合「最小化外部依赖、绝对可控」原则：零第三方依赖，原生 Node 实现。
 * 配套脚本：`pnpm check:i18n`；CI 门禁见 .github/workflows/ci.yml。
 *
 * 用法:
 *   node bash/check-locales.mjs          # 校验，有差异退出码 1
 *
 * @path bash/check-locales.mjs
 * @author ydsz-team
 * @since 4.4.0
 */

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const MICRO_ROOT = join(import.meta.dirname, '..');
const BASELINE_LANG = 'zh-CN';
const TARGET_LANG = 'en-US';

/** 语言搜索根：公共层 + 主应用 + 各子应用 */
const SEARCH_ROOTS = [
  'comm/locales/src/langs',
  'main/src/locales/langs',
  ...readdirSync(join(MICRO_ROOT, 'apps'))
    .filter((name) => !name.startsWith('.'))
    .map((name) => `apps/${name}/src/locales/langs`),
];

/** 递归收集 JSON 对象的全部叶子 key 路径 */
function collectKeys(obj, prefix = '') {
  const keys = [];
  for (const [key, value] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      keys.push(...collectKeys(value, path));
    } else {
      keys.push(path);
    }
  }
  return keys;
}

/** 对比两组 key，返回 diff 描述列表 */
function diffKeys(baselineKeys, targetKeys) {
  const baselineSet = new Set(baselineKeys);
  const targetSet = new Set(targetKeys);
  return [
    ...baselineKeys.filter((k) => !targetSet.has(k)).map((k) => `${TARGET_LANG} 缺失: ${k}`),
    ...targetKeys.filter((k) => !baselineSet.has(k)).map((k) => `${BASELINE_LANG} 缺失: ${k}`),
  ];
}

// ======================================================================
// 主流程：逐语言根、逐模块文件对比 zh-CN vs en-US
// ======================================================================

let totalDiffs = 0;
const reportLines = [];

for (const root of SEARCH_ROOTS) {
  const rootPath = join(MICRO_ROOT, root);
  const baselineDir = join(rootPath, BASELINE_LANG);
  const targetDir = join(rootPath, TARGET_LANG);
  if (!existsSync(baselineDir) || !existsSync(targetDir)) continue;

  for (const file of readdirSync(baselineDir).filter((f) => f.endsWith('.json'))) {
    const targetFile = join(targetDir, file);
    if (!existsSync(targetFile)) {
      reportLines.push(`[缺失文件] ${root}/${TARGET_LANG}/${file}`);
      totalDiffs += 1;
      continue;
    }

    const baselineJson = JSON.parse(readFileSync(join(baselineDir, file), 'utf-8'));
    const targetJson = JSON.parse(readFileSync(targetFile, 'utf-8'));
    const diffs = diffKeys(collectKeys(baselineJson), collectKeys(targetJson));

    if (diffs.length > 0) {
      reportLines.push(`[${root}] ${file}`);
      reportLines.push(...diffs.map((d) => `  - ${d}`));
      totalDiffs += diffs.length;
    }
  }
}

if (totalDiffs === 0) {
  console.log('[check:i18n] 全部语言文件的 zh-CN / en-US key 集合一致 ✓');
  process.exit(0);
}

console.error(`[check:i18n] 发现 ${totalDiffs} 处翻译 key 差异：\n`);
console.error(reportLines.join('\n'));
console.error('\n请补齐缺失的翻译 key 后重试（以代码事实为准，禁止空翻译）。');
process.exit(1);
