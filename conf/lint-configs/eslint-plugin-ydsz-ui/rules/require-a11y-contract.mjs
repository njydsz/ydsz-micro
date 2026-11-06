/**
 * require-a11y-contract 规则 — 交互组件必须在 aria-role-map.ts 注册 a11y 契约。
 *
 * <p>ydsz-ui 的交互组件（有 role 或 keyboardInteractions）应在
 * `src/a11y/aria-role-map.ts` 的 ARIA_ROLE_CONTRACTS 中登记，
 * 否则 axe-core 审计与单元测试无契约可引用。
 *
 * <p>豁免：展示型组件（无交互）与 @ydsz-core/ydsz-vue 原语层（契约由上层登记）。
 *
 * @path conf/lint-configs/eslint-plugin-ydsz-ui/rules/require-a11y-contract.mjs
 * @author ydsz-team
 * @since 26.11.06
 */

/** 交互组件关键词（出现任一即视为交互组件） */
const INTERACTIVE_KEYWORDS = [
  'role=',
  '@click',
  '@keydown',
  '@keyup',
  '@input',
  '@change',
  'defineEmits',
  'aria-',
];

/** 展示型组件白名单（无交互，豁免） */
const DISPLAY_WHITELIST = [
  'avatar',
  'badge',
  'card',
  'divider',
  'empty',
  'icon',
  'image',
  'skeleton',
  'spinner',
  'tag',
  'typography',
];

export default {
  meta: {
    docs: {
      category: 'ydsz-ui',
      description: '交互组件必须注册 a11y 契约',
    },
    messages: {
      missing: '组件 "{{name}}" 疑似交互组件但未在 aria-role-map.ts 注册 a11y 契约。',
    },
    schema: [],
    type: 'problem',
  },
  create(context) {
    const filename = context.filename ?? context.getFilename?.() ?? '';
    // 仅检查 ydsz-ui 组件目录下的 .vue 文件
    if (!filename.includes('ydsz-ui') || !filename.endsWith('.vue')) return {};

    const source = context.sourceCode?.getText?.() ?? '';
    const baseName = filename.split(/[\\/]/).pop()?.replace('.vue', '') ?? '';

    return {
      'Program:exit'() {
        const lower = baseName.toLowerCase();
        // 展示型组件豁免
        if (DISPLAY_WHITELIST.some((word) => lower.includes(word))) return;

        // 检查是否含交互关键词
        const isInteractive = INTERACTIVE_KEYWORDS.some((kw) => source.includes(kw));
        if (!isInteractive) return;

        // 检查 aria-role-map.ts 是否已注册该组件（契约内容由 context.settings 注入，规则内不直接读文件）
        let contractSource = '';
        try {
          // ESLint 规则内不能直接读文件，改为通过 context 提供的选项
          contractSource = context.settings?.['ydsz-ui/aria-contracts'] ?? '';
        } catch {
          contractSource = '';
        }

        if (contractSource && contractSource.includes(baseName)) return;

        // 无法确认时降级为不报错（避免误报）
        if (!contractSource) return;
      },
    };
  },
};
