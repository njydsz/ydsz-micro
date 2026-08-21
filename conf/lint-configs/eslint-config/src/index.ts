/**
 * YDSZ 前端 ESLint 9 扁平配置 — 云顶编码规范执行层
 *
 * 强制规则（对应《云顶编码规范》）：
 * - §3.1 禁止 any：`@typescript-eslint/no-explicit-any: error`
 * - §14.5 统一日志：`no-console: error`（仅允许 warn/error 过渡，logger.ts 豁免）
 * - §3.5 类型导入：`@typescript-eslint/consistent-type-imports`
 * - §4.6 v-for key、§18.5 提交前检查等由 vue/ts 基础规则承载
 *
 * @path conf/lint-configs/eslint-config/src/index.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import type { ESLint, Linter } from 'eslint';

import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import pluginVue from 'eslint-plugin-vue';
import vueParser from 'vue-eslint-parser';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';

/**
 * 云顶编码规范强制规则集。
 *
 * 说明：
 * - `no-console` 采用 `allow: ['warn', 'error']` 过渡策略——先禁止调试残留的
 *   log/debug/info，warn/error 保留到 logger 迁移完成后收紧（配合 §14.5）。
 * - logger.ts 是统一日志模块的实现文件，豁免 no-console。
 */
const ydszRules: Linter.RulesRecord = {
  // §3.1 禁止 any
  '@typescript-eslint/no-explicit-any': 'error',
  // §14.5 生产环境禁止 console（过渡期允许 warn/error）
  'no-console': ['error', { allow: ['warn', 'error'] }],
  // §3.5 类型导入使用 type 关键字
  '@typescript-eslint/consistent-type-imports': [
    'error',
    { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
  ],
  // 未使用变量/参数报错（与 tsconfig noUnusedLocals/noUnusedParameters 对齐）
  '@typescript-eslint/no-unused-vars': [
    'error',
    { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
  ],
  // §18.2 禁止解析 `require()` 之外的 CommonJS（ESM 项目）
  '@typescript-eslint/no-require-imports': 'error',
  // 空对象类型禁止（应使用 Record）
  '@typescript-eslint/no-empty-object-type': 'error',
};

/** TS 文件（.ts/.mts/.cts）规则 */
function tsConfig(): Linter.Config {
  return {
    files: ['**/*.{ts,mts,cts,tsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        projectService: true,
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
    },
    rules: {
      ...tseslint.configs.recommended.rules,
      ...ydszRules,
    },
  };
}

/** Vue SFC 规则（.vue 文件，template 使用 vue-eslint-parser） */
function vueConfig(): Linter.Config {
  return {
    files: ['**/*.vue'],
    languageOptions: {
      parser: vueParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        parser: tsParser,
        extraFileExtensions: ['.vue'],
      },
    },
    plugins: {
      vue: pluginVue,
      '@typescript-eslint': tseslint,
    },
    rules: {
      ...pluginVue.configs['flat/recommended'].rules,
      ...ydszRules,
      // §4.6 v-for 必须绑定 key（vue 插件内置校验）
      'vue/require-v-for-key': 'error',
      // §4.1 script setup 优先（非 setup 的 script 报错）
      'vue/component-api-style': ['error', ['script-setup']],
      // §4.4 组件多词命名
      'vue/multi-word-component-names': 'off',
    },
  };
}

/**
 * 导出 YDSZ ESLint 扁平配置。
 *
 * 使用方式（仓库根 eslint.config.mjs）：
 * ```js
 * import { defineConfig } from '@ydsz/eslint-config';
 * export default defineConfig();
 * ```
 */
export function defineConfig(): Linter.Config[] {
  return [
    // 全局忽略
    {
      ignores: [
        '**/node_modules/**',
        '**/dist/**',
        '**/coverage/**',
        '**/.turbo/**',
        '**/*.d.ts',
        '**/*.d.mts',
        '**/*.d.cts',
      ],
    },
    // 基础 JS 规则
    js.configs.recommended,
    // TS 规则
    tsConfig(),
    // Vue 规则
    vueConfig(),
    // 与 Prettier 兼容（关闭格式类规则）
    prettier,
  ];
}

/** ESLint 类型导出（供 defineConfig 消费方类型推导） */
export type { ESLint };
