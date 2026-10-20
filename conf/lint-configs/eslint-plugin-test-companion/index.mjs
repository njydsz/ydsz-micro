/**
 * 测试伴生 ESLint 插件 — 强制要求业务 Vue 组件拥有 .test.ts 伴生文件。
 *
 * @path conf/lint-configs/eslint-plugin-test-companion/index.mjs
 * @author ydsz-team
 * @since 26.10.14
 */

import requireTestCompanion from './rules/require-test-companion.mjs';

export default {
  rules: {
    'require-test-companion': requireTestCompanion,
  },
};
