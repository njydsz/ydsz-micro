#!/usr/bin/env node --experimental-strip-types
/**
 * Figma Token Sync CLI — 命令行入口。
 *
 * <p>用法：
 * <pre>{@code
 * # 导出当前 tokens 为 Figma JSON 格式
 * node --experimental-strip-types comm/@core/ui-kit/design-tokens/src/figma-cli.mts export [output.json]
 *
 * # 校验 Figma 导出 JSON 与当前 tokens 的差异
 * node --experimental-strip-types comm/@core/ui-kit/design-tokens/src/figma-cli.mts check [figma-export.json]
 *
 * # 输出 Figma Token Studio 插件安装指南
 * node --experimental-strip-types comm/@core/ui-kit/design-tokens/src/figma-cli.mts guide
 * }</pre>
 *
 * @path comm/@core/ui-kit/design-tokens/src/figma-cli.mts
 * @author ydsz-ai
 * @since 26.09.19
 */

import { writeFileSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import {
  exportToFigma,
  importFromFigma,
  generateFigmaPluginConfig,
  type FigmaTokenFile,
  type TokenDiff,
} from './figma-sync.ts';

const [,, command, ...args] = process.argv;

/**
 * CLI 主逻辑：按 command 分发到对应操作。
 */
function runCli(): void {
  switch (command) {
    case 'export':
      handleExport(args[0]);
      break;
    case 'check':
      handleCheck(args[0]);
      break;
    case 'guide':
      handleGuide();
      break;
    default:
      console.error(`未知命令：${command}`);
      console.error('可用命令：export | check | guide');
      process.exit(1);
  }
}

/**
 * 导出 tokens 为 Figma JSON 文件。
 */
function handleExport(outputPath?: string): void {
  const json = exportToFigma();
  const out = resolve(outputPath ?? 'ydsz-tokens.json');
  writeFileSync(out, `${JSON.stringify(json, null, 2)}\n`, 'utf8');
  console.log(`✓ Tokens 已导出至 ${out}`);
}

/**
 * 校验 Figma 导出 JSON 与当前 tokens 的差异。
 */
function handleCheck(inputPath?: string): void {
  if (!inputPath) {
    console.error('请指定 Figma 导出 JSON 文件路径');
    process.exit(1);
  }
  const figmaData: FigmaTokenFile = JSON.parse(readFileSync(resolve(inputPath), 'utf8'));
  const diffs: TokenDiff[] = importFromFigma(figmaData);
  if (diffs.length === 0) {
    console.log('✓ Tokens 无差异，设计与代码完全对齐。');
    return;
  }
  console.error(`✗ 发现 ${diffs.length} 项差异：`);
  for (const diff of diffs) {
    console.error(`  [${diff.type}] ${diff.path}: 期望="${diff.expected}" 实际="${diff.actual}"`);
  }
  process.exit(1);
}

/**
 * 输出 Figma Token Studio 插件安装指南。
 */
function handleGuide(): void {
  const { plugin, steps } = generateFigmaPluginConfig();
  console.log(`插件：${plugin}`);
  console.log('使用步骤：');
  for (const step of steps) {
    console.log(`  ${step}`);
  }
}

runCli();
