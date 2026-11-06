/**
 * no-element-plus 规则 — 禁止 apps/ main/ 引入 element-plus。
 *
 * <p>EP 已于 v5.0.0 退场，组件请用 @ydsz-core/ydsz-ui，命令式 API 用
 * @ydsz-core/popup-ui，图标用 lucide-vue-next 或 @ydsz/icons。
 *
 * @path conf/lint-configs/eslint-plugin-ydsz-ui/rules/no-element-plus.mjs
 * @author ydsz-team
 * @since 26.11.06
 */

/** 禁止引入的包前缀 */
const FORBIDDEN = [
  'element-plus',
  'element-plus/',
  '@element-plus/icons-vue',
];

/** 错误消息模板 */
function message(source) {
  return [
    `禁止使用 Element Plus（"${source}"）。`,
    'EP 已于 v5.0.0 退场，请改用：',
    '  - 组件：@ydsz-core/ydsz-ui',
    '  - 命令式 API：@ydsz-core/popup-ui',
    '  - 图标：lucide-vue-next 或 @ydsz/icons',
  ].join('\n');
}

export default {
  meta: {
    docs: {
      category: 'ydsz-ui',
      description: '禁止引入 element-plus（EP 已退场）',
    },
    messages: {
      forbidden: '{{message}}',
    },
    schema: [],
    type: 'problem',
  },
  create(context) {
    return {
      ImportDeclaration(node) {
        const source = node.source?.value;
        if (typeof source !== 'string') return;
        if (FORBIDDEN.some((prefix) => source === prefix || source.startsWith(prefix))) {
          context.report({
            messageId: 'forbidden',
            node,
            data: { message: message(source) },
          });
        }
      },
    };
  },
};
