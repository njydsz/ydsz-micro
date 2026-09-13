/**
 * 仓库根 Stylelint 扁平配置入口。
 *
 * 规则定义集中在 @ydsz/stylelint-config（conf/lint-configs/stylelint-config），
 * 本文件仅负责引用。
 *
 * @path stylelint.config.mjs
 */
import config from '@ydsz/stylelint-config';

/**
 * 仓库根 Stylelint 配置（默认导出）。
 *
 * 所有规则定义集中在 @ydsz/stylelint-config，本文件仅负责引用导出。
 *
 * @default config —— Stylelint 配置对象
 * @path stylelint.config.mjs
 */
export default config;
