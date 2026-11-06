/**
 * require-generic-props 规则 — Props/Emits 必须使用 TypeScript 泛型语法。
 *
 * <p>对应《云顶编码规范》SFC-002：
 * `defineProps<{ ... }>()` / `defineEmits<{ ... }>()`，
 * 禁止运行时的 `defineProps({ ... })` 对象签名（类型推导能力弱、无编译期校验）。
 *
 * <p>豁免：无 props/emits 声明的组件。
 *
 * @path conf/lint-configs/eslint-plugin-ydsz-ui/rules/require-generic-props.mjs
 * @author ydsz-team
 * @since 26.11.06
 */

export default {
  meta: {
    docs: {
      category: 'ydsz-ui',
      description: 'Props/Emits 必须使用 TS 泛型语法（SFC-002）',
    },
    messages: {
      objectProps:
        'defineProps 使用了运行时对象签名，请改为泛型形式 defineProps<{ ... }>()（SFC-002）。',
      objectEmits:
        'defineEmits 使用了运行时对象签名，请改为泛型形式 defineEmits<{ ... }>()（SFC-002）。',
    },
    schema: [],
    type: 'problem',
  },
  create(context) {
    return {
      CallExpression(node) {
        const callee = node.callee;
        if (!callee || callee.type !== 'Identifier') return;

        const arg = node.arguments[0];
        if (!arg) return;

        if (callee.name === 'defineProps' && arg.type === 'ObjectExpression') {
          context.report({ messageId: 'objectProps', node });
        }

        if (callee.name === 'defineEmits' && arg.type === 'ObjectExpression') {
          context.report({ messageId: 'objectEmits', node });
        }
      },
    };
  },
};
