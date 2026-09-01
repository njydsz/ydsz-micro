/**
 * @YDSZ-core/shared 包的 unbuild 构建配置：多入口拆分打包，与 exports 子路径一一对应。
 *
 * @path comm\@core\base\shared\build.config.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import { defineBuildConfig } from 'unbuild';

/**
 * 基础工具包的构建配置：按能力域拆成多个入口，各自独立成 bundle。
 *
 * 产物形态：每个入口产出独立的 `.mjs` + `.cjs` + `.d.ts`，输出路径与入口路径同构
 * （`src/cache/index` → `dist/cache/index.mjs`）。这样 `package.json#exports`
 * 里的 `./cache`、`./utils`、`./semver` 等子路径才能精确命中对应产物，
 * 避免「引一个工具函数却拉整个包」。
 *
 * externals 处理：同样交给 unbuild 从 `dependencies` 推导。本包依赖面较宽
 * （dayjs、lodash.*、tailwind-merge、@ctrl/tinycolor、`@tanstack/vue-store` 等），
 * 全部保持外部引用：既让宿主应用复用同一份依赖实例（store 的订阅关系必须单例），
 * 也避免把 lodash 这类 CJS 依赖内联进 ESM 产物时产生 interop 包装问题。
 *
 * `clean: true` 在每次构建前清空 dist，防止历史残留的旧入口产物被 exports 误命中。
 *
 * @returns unbuild 构建配置
 * @since 1.0.0
 */
export default defineBuildConfig({
  clean: true,
  declaration: true,
  entries: [
    'src/store',
    'src/constants/index',
    'src/utils/index',
    'src/color/index',
    'src/cache/index',
    'src/global-state',
    'src/semver',
  ],
});
