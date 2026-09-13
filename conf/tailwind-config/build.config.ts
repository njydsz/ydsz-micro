/**
 * build.config 配置模块
 *
 * @path conf\tailwind-config\build.config.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import { defineBuildConfig } from 'unbuild';

/**
 * Tailwind 配置包的 unbuild 构建入口。
 *
 * 产物包含：src/index（Tailwind preset + 工具函数）与
 * src/postcss.config（PostCSS 插件集合），CJS + ESM 双格式输出。
 *
 * @default —— unbuild 构建配置对象
 */
export default defineBuildConfig({
  clean: true,
  declaration: true,
  entries: ['src/index', './src/postcss.config'],
  rollup: {
    emitCJS: true,
  },
});
