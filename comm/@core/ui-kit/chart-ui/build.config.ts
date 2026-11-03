/**
 * @ydsz-core/chart-ui 包的 unbuild 构建配置：mkdist 逐文件转译，不打包。
 *
 * @path comm\@core\ui-kit\chart-ui\build.config.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import { defineBuildConfig } from 'unbuild';

/**
 * 图表 UI 包的构建配置：mkdist 保留目录结构输出。
 *
 * 产物形态：src 下的 `.vue` / `.ts` 逐个转译，路径与源码同构。逐文件转译能让消费端
 * 精确引入单个图表组件族，避免把 ECharts 运行时打进无关场景。
 *
 * externals 处理：mkdist 不解析依赖，import 原样保留；ECharts 由消费端解析，
 * 保证 `import('echarts')` 的懒加载语义在产物里不丢失。
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
