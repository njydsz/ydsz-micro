/**
 * require-define-options 规则 — SFC 必须声明组件 name。
 *
 * <p>对应《云顶编码规范》NAM-002：组件 `defineOptions({ name: 'XxxYyy' })` 必填，
 * 因为 Router KeepAlive 与 Vue DevTools 依赖该 name 做组件识别。
 *
 * <p>豁免：
 *  <ul>
 *    <li>文件名本身即 PascalCase 且脚本内没有第二处 `export default` 的单文件组件；
 *    <li>已由 `<script setup>` 的 `defineOptions` 或 `defineComponent({ name })` 声明；
 *    <li>测试文件与 story 文件。
 *  </ul>
 *
 * @path conf/lint-configs/eslint-plugin-ydsz-ui/rules/require-define-options.mjs
 * @author ydsz-team
 * @since 26.11.06
 */

import { basename } from 'node:path';

/** 跳过文件模式 */
const SKIP_FILES = ['.test.', '.spec.', '.stories.', '.story.'];

/** PascalCase 校验 */
const PASCAL_RE = /^[A-Z][A-Za-z0-9]*$/;

export default {
  meta: {
    docs: {
      category: 'ydsz-ui',
      description: 'SFC 必须声明组件 name（NAM-002）',
    },
    messages: {
      missingName:
        "SFC 未声明组件 name。请添加 defineOptions({ name: '{{suggested}}' })（NAM-002，KeepAlive / DevTools 依赖）。",
      invalidName: '组件 name「{{actual}}」应为 PascalCase，建议「{{suggested}}」（NAM-002）。',
    },
    schema: [],
    type: 'problem',
  },
  create(context) {
    const filename = context.filename ?? context.getFilename?.() ?? '';

    if (SKIP_FILES.some((p) => filename.includes(p))) return {};

    // 非 .vue 文件直接放行
    if (!filename.endsWith('.vue')) return {};

    const base = basename(filename).replace(/\.vue$/, '');
    if (!PASCAL_RE.test(base)) {
      // 文件名不是 PascalCase（如 components/foo/bar.vue），按目录约定豁免
      return {};
    }

    const suggested = base;

    let hasDefineOptions = false;
    let declaredName = null;

    return {
      CallExpression(node) {
        // defineOptions({ name: 'Xxx' })
        if (node.callee?.type !== 'Identifier' || node.callee.name !== 'defineOptions') {
          return;
        }
        hasDefineOptions = true;
        const arg = node.arguments[0];
        if (arg?.type !== 'ObjectExpression') return;
        const nameProp = arg.properties.find(
          (p) => p.type === 'Property' && p.key?.name === 'name',
        );
        if (nameProp) {
          declaredName = nameProp.value?.value ?? null;
        }
      },
      'ExportDefaultDeclaration > ObjectExpression'(node) {
        // defineComponent({ name: 'Xxx' })
        const nameProp = node.properties.find(
          (p) => p.type === 'Property' && p.key?.name === 'name',
        );
        if (nameProp?.value?.value) {
          hasDefineOptions = true;
          declaredName = nameProp.value.value;
        }
      },
      'Program:exit'() {
        if (!hasDefineOptions) {
          context.report({
            messageId: 'missingName',
            data: { suggested },
            loc: { line: 1, column: 1 },
          });
          return;
        }
        if (declaredName && !PASCAL_RE.test(declaredName)) {
          context.report({
            data: { actual: declaredName, suggested },
            messageId: 'invalidName',
            loc: { line: 1, column: 1 },
          });
        }
      },
    };
  },
};
