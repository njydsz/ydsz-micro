/**
 * @YDSZ-core/layout-ui 包的 unbuild 构建配置：以 mkdist 逐文件转译，不打包。
 *
 * @path comm\@core\ui-kit\layout-ui\build.config.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import { defineBuildConfig } from 'unbuild';

/**
 * 布局 UI 包的构建配置：用 mkdist 保留目录结构输出。
 *
 * 产物形态：src 下的 `.vue` 与 `.ts` 逐个转译，路径与源码同构。布局组件按
 * header / sidebar / content / footer / tabbar 分文件，逐文件转译让消费端可以只引
 * 需要的那一个，而不必拉起整棵布局树。
 *
 * externals 处理：mkdist 不解析依赖，天然不内联任何 import。`vue` 与
 * `@YDSZ-core/*` 全部外部化，保证布局里用到的 shared 单例（偏好、断点状态）
 * 与宿主应用是同一份，否则会出现侧栏折叠状态不同步。
 *
 * 两段 entries 的分工：`loaders: ['vue']` 负责 SFC，`loaders: ['js']` + `format: 'esm'`
 * 负责 TS。拆成两段是因为 mkdist 的 loader 按扩展名路由，合并写法无法同时覆盖两类文件。
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
