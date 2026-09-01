/**
 * build.config 配置模块
 *
 * @path conf\node-utils\build.config.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import { defineBuildConfig } from 'unbuild';

/**
 * node-utils 包的构建配置。
 */
export default defineBuildConfig({
  clean: true,
  declaration: true,
  entries: ['src/index'],
});
