/**
 * unbuild 构建配置，定义 typings 包的打包入口与声明文件输出。
 *
 * @path comm\@core\base\typings\build.config.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import { defineBuildConfig } from 'unbuild';

/**
 * 类型包的构建配置：单入口，但真正对外输出的是 `.d.ts` 而非运行时代码。
 *
 * 产物形态：`dist/index.mjs` 基本为空壳（本包几乎没有运行时导出），
 * `dist/index.d.ts` 才是消费方实际依赖的部分。`declaration: true` 因此是必需项，
 * 关掉它整个包就失去意义。
 *
 * externals 处理：`vue` / `vue-router` 由 unbuild 从 `dependencies` 自动外部化。
 * 类型包尤其不能被打包成实体 —— 一旦把 vue 的类型内联进来，宿主应用就会出现
 * 两份结构相同但不兼容的类型声明，导致跨包赋值报类型错误。
 *
 * @returns unbuild 构建配置
 * @since 1.0.0
 */
export default defineBuildConfig({
  clean: true,
  declaration: true,
  entries: ['src/index'],
});
