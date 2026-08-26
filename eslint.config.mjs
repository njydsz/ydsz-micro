/**
 * 仓库根 ESLint 9 扁平配置入口。
 *
 * 规则定义集中在 @ydsz/eslint-config（conf/lint-configs/eslint-config），
 * 本文件仅负责引用与项目级覆盖。
 *
 * @path eslint.config.mjs
 */
import { defineConfig } from '@ydsz/eslint-config';

const config = defineConfig();

// 归档目录（含生成代码参考文件）及根级配置文件不参与 lint
config.unshift({
  ignores: ['**/archived/**', '**/.generated-archived/**', 'vitest.config.ts', 'eslint.config.mjs'],
});

export default config;
