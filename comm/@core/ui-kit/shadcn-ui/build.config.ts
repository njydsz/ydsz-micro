/**
 * @YDSZ-core/shadcn-ui 包的 unbuild 构建配置：mkdist 全量转译 + 资源原样拷贝。
 *
 * @path comm\@core\ui-kit\shadcn-ui\build.config.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import { defineBuildConfig } from 'unbuild';

/**
 * 基础组件库的构建配置：三段 mkdist entries，覆盖资源、SFC 与 TS。
 *
 * 产物形态：三段 entries 同指 `./src`，按 `pattern` 分工 ——
 *  1. `pattern: ['**\/*']` 兜底拷贝非 SFC/TS 文件（样式、字库等），避免运行时资源缺失；
 *  2. `loaders: ['vue']` 转译 SFC；
 *  3. `loaders: ['js']` + `format: 'esm'` 转译 TS。
 * 本包是 ui-kit 中被依赖最多的一层，保持逐文件输出让上层可以精确引入单个组件。
 *
 * externals 处理：mkdist 不解析依赖，import 原样保留。这里尤其关键：组件大量使用
 * `class-variance-authority` 与 `tailwind-merge`，若被内联，cva 的变体表与
 * tailwind-merge 的冲突判定表会各存一份，导致同类 Tailwind class 合并结果不一致。
 *
 * 注意：`package.json#exports` 目前把 `.` 同时指向 `./src/index.ts`（development 与
 * default 条件），dist 产物尚未生效，构建配置更多用于保证链路可用；切换 default
 * 到 dist 前请勿改动本文件的输出结构。
 *
 * @returns unbuild 构建配置
 * @since 1.0.0
 */
export default defineBuildConfig({
  clean: true,
  declaration: true,
  entries: [
    {
      builder: 'mkdist',
      input: './src',

      pattern: ['**/*'],
    },
    {
      builder: 'mkdist',
      input: './src',
      loaders: ['vue'],
      pattern: ['**/*.vue'],
    },
    {
      builder: 'mkdist',
      format: 'esm',
      input: './src',
      loaders: ['js'],
      pattern: ['**/*.ts'],
    },
  ],
});
