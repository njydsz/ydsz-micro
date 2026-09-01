/**
 * @YDSZ-core/tabs-ui 包的 unbuild 构建配置：mkdist 逐文件转译，不打包。
 *
 * @path comm\@core\ui-kit\tabs-ui\build.config.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import { defineBuildConfig } from 'unbuild';

/**
 * 标签页 UI 包的构建配置：mkdist 保留目录结构输出。
 *
 * 产物形态：src 下的 `.vue` / `.ts` 逐个转译，路径与源码同构。标签页涉及
 * keep-alive 缓存与拖拽排序（依赖 sortablejs），逐文件转译能把这些较重依赖
 * 隔离在真正用到的文件里，不随整包进入消费端。
 *
 * externals 处理：mkdist 不解析依赖，import 原样保留。注意本包依赖
 * `@YDSZ-core/composables` 提供的拖拽能力，而后者又依赖 `@YDSZ-core/shared`；
 * 全部外部化才能保证 keep-alive 的缓存表与宿主应用共用一份。
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
