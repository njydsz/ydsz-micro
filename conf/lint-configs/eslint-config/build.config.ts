/**
 * @file ESLint 配置包构建配置
 * @author YDSZ Team
 * @since 2026-08-23
 */

import { defineBuildConfig } from 'unbuild';

export default defineBuildConfig({
  entries: ['src/index.ts'],
  declaration: true,
  clean: true,
  rollup: {
    emitCJS: false,
    esbuild: {
      target: 'es2022',
    },
  },
});
