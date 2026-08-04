/**
 * build.config 组合式函数
 *
 * @path comm\@core\composables\build.config.ts
 * @author remi-team
 * @since 1.0.0
 */
import { defineBuildConfig } from 'unbuild';

export default defineBuildConfig({
  clean: true,
  declaration: true,
  entries: ['src/index'],
});
