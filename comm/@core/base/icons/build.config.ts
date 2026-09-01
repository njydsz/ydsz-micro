/**
 * @YDSZ-core/icons 包的 unbuild 构建配置：单入口打包为 ESM + CJS 双格式。
 *
 * @path comm\@core\base\icons\build.config.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import { defineBuildConfig } from 'unbuild';

/**
 * 图标包的构建配置：以 rollup 为构建器，把 `src/index` 打成单一 bundle。
 *
 * 产物形态：`dist/index.mjs`（ESM）+ `dist/index.cjs`（CJS）+ `dist/index.d.ts`。
 * 选 rollup 而非 mkdist，是因为本包对外只有一个聚合入口，消费方总是
 * `import { XxxIcon } from '@YDSZ-core/icons'`，整体打包比逐文件转译更利于消费端 tree-shaking。
 *
 * externals 处理：这里**不显式声明** `externals`，交由 unbuild 从 `package.json`
 * 的 `dependencies` / `peerDependencies` 自动推导。因此 `vue`、`@iconify/vue`、
 * `lucide-vue-next` 只保留 import 语句而不被内联，由宿主应用安装并去重 ——
 * 一旦误打包进产物，就会出现多份 Vue 实例、图标运行时被重复注册的问题。
 *
 * `declaration: true` 由 rollup-plugin-dts 从源码类型推导 `.d.ts`；因为本包会用
 * `defineComponent` 动态生成图标组件，声明文件是消费方拿到组件类型的唯一来源。
 *
 * @returns unbuild 构建配置
 * @since 1.0.0
 */
export default defineBuildConfig({
  clean: true,
  declaration: true,
  entries: ['src/index'],
});
