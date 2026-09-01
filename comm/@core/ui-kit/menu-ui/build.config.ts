/**
 * @YDSZ-core/menu-ui 包的 unbuild 构建配置：mkdist 全量转译 + 资源原样拷贝。
 *
 * @path comm\@core\ui-kit\menu-ui\build.config.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import { defineBuildConfig } from 'unbuild';

/**
 * 菜单 UI 包的构建配置：三段 mkdist entries，覆盖资源、SFC 与 TS。
 *
 * 产物形态：三段 entries 都指向 `./src`，靠 `pattern` 分工 ——
 *  1. `pattern: ['**\/*']` 兜底：把 SFC/TS 之外的文件（样式、JSON 等）原样拷进 dist，
 *     缺了这一段，运行时按需加载的静态资源会 404；
 *  2. `loaders: ['vue']` 转译 SFC；
 *  3. `loaders: ['js']` + `format: 'esm'` 转译 TS。
 * 三段存在重叠匹配，后两段以更精确的 pattern 覆盖兜底段的转译结果，
 * 属于 mkdist 的常见写法而非冗余。
 *
 * externals 处理：mkdist 不解析依赖，全部 import 原样保留。菜单递归渲染依赖
 * `@YDSZ-core/shared` 的路由工具与单例状态，外部化是递归菜单能与宿主路由保持
 * 同一份数据的前提。
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
