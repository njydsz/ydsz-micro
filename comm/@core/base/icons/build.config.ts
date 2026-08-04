/**
 * build.config 模块
 *
 * @path comm\@core\base\icons\build.config.ts
 * @author remi-team
 * @since 1.0.0
 */
import { defineBuildConfig } from 'unbuild';

export default defineBuildConfig({
  clean: true,
  declaration: true,
  entries: ['src/index'],
});
