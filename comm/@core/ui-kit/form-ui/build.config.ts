/**
 * @YDSZ-core/form-ui 包的 unbuild 构建配置：以 mkdist 逐文件转译，不打包。
 *
 * @path comm\@core\ui-kit\form-ui\build.config.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import { defineBuildConfig } from 'unbuild';

/**
 * 表单 UI 包的构建配置：改用 mkdist 构建器，保留源码目录结构一比一输出到 dist。
 *
 * 产物形态：不做 bundle，src 下的 `.vue` 与 `.ts` 按原目录结构逐个转译为同名文件落盘。
 * 选 mkdist 而非默认的 rollup，有两个原因：
 *  1. 表单组件依赖大量相对路径引用（组件、Schema、helper），逐文件转译能让消费端
 *     按需引入单个组件，避免整包 bundle 后被 `sideEffects` 中的 CSS 声明拖累；
 *  2. 样式与模板的对应关系随文件保留，便于排查样式覆盖顺序问题。
 *
 * externals 处理：mkdist 只做转译、不解析依赖，因此**天然不会内联**任何依赖，
 * `vue`、`vee-validate`、`zod` 以及各 `@YDSZ-core/*` workspace 包全部保持 import 原样。
 * 这也是本包能安全使用 workspace 依赖单例（如 shared 的广播通道）的前提。
 *
 * `loaders: ['js']` 处理 `.ts`：只剥离类型、不做类型检查也不生成声明合并，
 * 类型正确性由外层 `pnpm type-check` 统一保障；`declaration: true` 单独产出 `.d.ts`。
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
