/**
 * 云顶 UI 组件库 ESLint 插件 — 守护 ydsz-ui / ydsz-vue 的架构与规范约束。
 *
 * 规则：
 *  - no-element-plus：禁止 apps/ main/ 引入 element-plus（EP 已退场 v5.0.0）；
 *  - require-a11y-contract：交互组件必须在 aria-role-map.ts 注册 a11y 契约；
 *  - no-hardcoded-chinese：模板与 TS 逻辑禁止硬编码中文文案（须走 i18n）。
 *
 * @path conf/lint-configs/eslint-plugin-ydsz-ui/index.mjs
 * @author ydsz-team
 * @since 26.11.06
 */

import noElementPlus from './rules/no-element-plus.mjs';
import requireA11yContract from './rules/require-a11y-contract.mjs';
import noHardcodedChinese from './rules/no-hardcoded-chinese.mjs';

export default {
  meta: {
    name: '@ydsz-core/eslint-plugin-ydsz-ui',
    version: '1.0.0',
  },
  rules: {
    'no-element-plus': noElementPlus,
    'require-a11y-contract': requireA11yContract,
    'no-hardcoded-chinese': noHardcodedChinese,
  },
};
