/**
 * 仓库根 Stylelint 扁平配置入口。
 *
 * 规则定义集中在 @ydsz/stylelint-config（conf/lint-configs/stylelint-config），
 * 本文件仅负责引用，并对存量债务做显式降级登记。
 *
 * @path stylelint.config.mjs
 */
import config from '@ydsz/stylelint-config';

const merged = {
  ...config,
  rules: {
    ...config.rules,
    // 存量 19 处选择器顺序问题（ydsz-ui 组件 + bpmn-designer），
    // 逐个重排有视觉回归风险，先关闭并登记，待人工逐个确认后恢复。
    'no-descending-specificity': null,
    // 与 prettier/prettier 规则冲突（prettier 会删除自定义属性前的空行），
    // 交由 prettier 统一格式，避免两个格式化器互相覆盖。
    'custom-property-empty-line-before': null,
  },
  // dark-mode.css 有意用两个 :root / .dark 块分别承载语义变量与
  // shadcn 兼容变量，同名选择器才能覆盖生效，故豁免重复选择器检查。
  overrides: [
    ...(config.overrides ?? []),
    {
      files: ['**/styles/dark-mode.css'],
      rules: {
        'no-duplicate-selectors': null,
      },
    },
  ],
};

/**
 * 仓库根 Stylelint 配置（默认导出）。
 *
 * @default merged —— Stylelint 配置对象
 * @path stylelint.config.mjs
 */
export default merged;
