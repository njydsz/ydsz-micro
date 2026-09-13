/**
 * build.config 配置模块
 *
 * @path conf\vite-config\build.config.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import { defineBuildConfig } from 'unbuild';

/**
 * Vite 共享配置包的 unbuild 构建入口。
 *
 * 以 src/index 单入口打包，产出 ESM + CJS + .d.ts（declaration 产物），
 * 供子应用通过 @ydsz/vite-config 引用共享 resolve、plugins 与 proxy 配置。
 *
 * @default —— unbuild 构建配置对象
 */
export default defineBuildConfig({
  clean: true,
  declaration: true,
  entries: ['src/index'],
});
