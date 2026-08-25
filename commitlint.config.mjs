/**
 * Commitlint 配置 — 遵循 Conventional Commits（云顶规范 §18.6）
 *
 * 类型枚举与 README「Git 规范」章节保持一致。
 *
 * @path commitlint.config.mjs
 */
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      ['feat', 'fix', 'style', 'perf', 'refactor', 'revert', 'test', 'docs', 'chore', 'ci'],
    ],
  },
};
