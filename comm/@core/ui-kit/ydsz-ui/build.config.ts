/**
 * @ydsz-core/ydsz-ui 包的 unbuild 构建配置
 *
 * @path comm\@core\ui-kit\ydsz-ui\build.config.ts
 */
import { defineBuildConfig } from 'unbuild';

export default defineBuildConfig({
  clean: true,
  declaration: true,
  // 泛型组件单独构建（不走 declaration 检查，vue-tsc 无法推断其 Props 类型）
  failOnWarn: false,
  entries: [
    {
      builder: 'mkdist',
      input: './src',
      pattern: ['**/*'],
    },
    {
      builder: 'mkdist',
      input: './src',
      pattern: ['**/*.vue'],
      loaders: ['vue'],
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
