/**
 * @YDSZ-core/composables 包的 unbuild 构建配置：单入口聚合全部组合式函数。
 *
 * @path comm\@core\composables\build.config.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import { defineBuildConfig } from 'unbuild';

/**
 * 组合式函数包的构建配置：以 rollup 单入口打包。
 *
 * 产物形态：`dist/index.mjs` + `.cjs` + `.d.ts`，并被标记为 `sideEffects: false`，
 * 消费端未引用的 useXxx 会被 tree-shaking 掉。组合式函数之间没有文件级资源依赖，
 * 无需保留目录结构，因此选 rollup 而非 mkdist。
 *
 * externals 处理：依赖 unbuild 从 `dependencies` 推导。`@YDSZ-core/shared` 是
 * workspace 依赖且必须外部化 —— 它持有全局 store 与广播通道的单例，
 * 若被内联进本包产物，就会与宿主应用里的另一份 shared 各持一份状态，
 * 跨标签页同步与偏好设置会静默失效。
 *
 * @returns unbuild 构建配置
 * @since 1.0.0
 */
export default defineBuildConfig({
  clean: true,
  declaration: true,
  entries: ['src/index'],
});
