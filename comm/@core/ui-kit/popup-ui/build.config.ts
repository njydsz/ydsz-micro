/**
 * @YDSZ-core/popup-ui 包的 unbuild 构建配置：mkdist 逐文件转译，不打包。
 *
 * @path comm\@core\ui-kit\popup-ui\build.config.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import { defineBuildConfig } from 'unbuild';

/**
 * 弹层 UI 包的构建配置：mkdist 保留目录结构输出。
 *
 * 产物形态：src 下的 `.vue` / `.ts` 逐个转译，路径与源码同构。弹层体系按
 * modal / drawer / alert 分目录，各自带有命令式 API（`-api.ts`），
 * 逐文件转译能让「只用 Modal」的场景不必连带 drawer 的实现。
 *
 * externals 处理：mkdist 不解析依赖，import 原样保留。弹层的打开/关闭状态由
 * `@YDSZ-core/shared` 的全局 store 承载，外部化保证命令式 API 与组件读到同一份状态，
 * 否则 `modalApi.open()` 之后组件侧不会响应。
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
