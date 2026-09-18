#!/usr/bin/env node
/**
 * check-locales.mts — 国际化 key 一致性校验（中英双语门禁）
 *
 * <p>遍历全仓所有语言目录（comm / main / apps/*），以 zh-CN 为基线校验
 * en-US 的 key 集合一致性。三层校验维度：
 * <ol>
 *   <li>目录完整性 — 各 langs 目录下应存在 zh-CN / en-US 两个语种子目录</li>
 *   <li>文件完整性 — 每个语种目录内需包含与基线相同的 JSON 模块文件</li>
 *   <li>Key 一致性 — 每个 JSON 模块的叶子 key 路径集合必须与基线相同</li>
 * </ol>
 *
 * <p>语言目录结构约定：{@code langs/<lang>/<module>.json}
 * （成对出现在同一 langs 目录下）。
 *
 * <p>设计契合「最小化外部依赖、绝对可控」原则：零第三方依赖，原生 Node 实现。
 * 配套脚本：{@code pnpm check:i18n}；CI 门禁见 .github/workflows/ci.yml。
 *
 * @usage
 *   node bash/check-locales.mts          # 全量校验，有差异退出码 1
 *
 * @path bash\check-locales.mts
 * @author ydsz-team
 * @since 4.5.0
 */

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const MICRO_ROOT = join(import.meta.dirname, '..');

/** 基线语种 — 作为 key 集合的事实来源 */
const BASELINE_LANG = 'zh-CN';

/** 全量语种清单 — 与 SUPPORT_LANGUAGES 常量及 comm/locales 目录保持同步 */
const ALL_LANGUAGES = ['zh-CN', 'en-US'];

/** 需要校验的语种（排除基线自身） */
const TARGET_LANGUAGES = ALL_LANGUAGES.filter((lang) => lang !== BASELINE_LANG);

/** 语言搜索根：公共层 + 主应用 + 各子应用 */
const SEARCH_ROOTS = [
  'comm/locales/src/langs',
  'main/src/locales/langs',
  ...readdirSync(join(MICRO_ROOT, 'apps'))
    .filter((name) => !name.startsWith('.'))
    .map((name) => `apps/${name}/src/locales/langs`),
];

/** 递归收集 JSON 对象的全部叶子 key 路径（点号连接） */
function collectKeys(obj: Record<string, unknown>, prefix = ''): string[] {
  const keys: string[] = [];
  for (const [key, value] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      keys.push(...collectKeys(value as Record<string, unknown>, path));
    } else {
      keys.push(path);
    }
  }
  return keys;
}

// =====================================================================/
// 主流程
// =====================================================================/

let totalDiffs = 0;
const reportLines: string[] = [];
let dirsChecked = 0;

for (const root of SEARCH_ROOTS) {
  const rootPath = join(MICRO_ROOT, root);
  const baselineDir = join(rootPath, BASELINE_LANG);

  if (!existsSync(baselineDir) || !statSync(baselineDir).isDirectory()) {
    continue;
  }

  const baselineFiles = readdirSync(baselineDir).filter((f) => f.endsWith('.json'));
  dirsChecked += 1;

  for (const lang of TARGET_LANGUAGES) {
    const langDir = join(rootPath, lang);

    // 维度 1: 目录完整性
    if (!existsSync(langDir)) {
      reportLines.push(`[缺失目录] ${root}/${lang}/`);
      totalDiffs += 1;
      continue;
    }

    // 维度 2: 文件完整性 + 维度 3: Key 一致性
    for (const file of baselineFiles) {
      const baselineFile = join(baselineDir, file);
      const targetFile = join(langDir, file);

      if (!existsSync(targetFile)) {
        reportLines.push(`[缺失文件] ${root}/${lang}/${file}`);
        totalDiffs += 1;
        continue;
      }

      try {
        const baselineJson = JSON.parse(readFileSync(baselineFile, 'utf-8'));
        const targetJson = JSON.parse(readFileSync(targetFile, 'utf-8'));
        const baselineKeys = collectKeys(baselineJson);
        const targetKeys = collectKeys(targetJson);
        const baselineSet = new Set(baselineKeys);
        const targetSet = new Set(targetKeys);

        const missingInTarget = baselineKeys.filter((k) => !targetSet.has(k));
        const extraInTarget = targetKeys.filter((k) => !baselineSet.has(k));

        if (missingInTarget.length > 0 || extraInTarget.length > 0) {
          reportLines.push(`[key 不一致] ${root}/${lang}/${file}`);
          for (const k of missingInTarget) {
            reportLines.push(`  - ${lang} 缺失: ${k}`);
          }
          for (const k of extraInTarget) {
            reportLines.push(`  - ${BASELINE_LANG} 缺失: ${k}`);
          }
          totalDiffs += missingInTarget.length + extraInTarget.length;
        }
      } catch (error) {
        reportLines.push(`[解析失败] ${root}/${lang}/${file}: ${(error as Error).message}`);
        totalDiffs += 1;
      }
    }
  }
}

// =====================================================================/
// 输出报告
// =====================================================================/

if (totalDiffs === 0) {
  console.log(
    `[check:i18n] 全语种校验通过 ✓ — 已检查 ${dirsChecked} 个语言根 × ${TARGET_LANGUAGES.length} 个语种`,
  );
  process.exit(0);
}

console.error(`[check:i18n] 发现 ${totalDiffs} 处翻译差异（已检查 ${dirsChecked} 个语言根）：\n`);
console.error(reportLines.join('\n'));
console.error('\n请补齐缺失的翻译文件/目录后重试（以 zh-CN 为基线事实来源）。');
process.exit(1);
