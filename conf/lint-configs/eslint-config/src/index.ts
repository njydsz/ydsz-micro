/**
 * YDSZ 前端 ESLint 9 扁平配置 — 云顶编码规范执行层
 *
 * 强制规则（对应《云顶编码规范》）：
 * - §3.1 禁止 any：`@typescript-eslint/no-explicit-any: error`
 * - §14.5 统一日志：`no-console: error`（业务代码全面禁止 console，统一使用 createLogger；logger.ts 实现层豁免）
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
 * - `no-console` 全面禁止（error）：业务代码一律使用 `createLogger`（@YDSZ-core/shared/utils）
 *   统一日志，禁止在生产路径直接调用 console.*（§14.5）。
 * - 过渡期允许的 warn/error 已在 comm 组件 codemod 完成后收紧（见仓库 codemod 记录）。
 * - logger.ts 是统一日志模块的实现文件，豁免 no-console。
 */
const ydszRules: Linter.RulesRecord = {
  // §3.1 禁止 any
  '@typescript-eslint/no-explicit-any': 'error',
  // §14.5 生产环境全面禁止 console（业务代码必须改用 createLogger）
  'no-console': 'error',
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

/**
 * TS 文件（.ts/.mts/.cts）规则
 *
 * 说明：core 的 `no-undef`/`no-unused-vars` 对 TS 语义不生效（浏览器/Node 全局量、
 * 函数类型参数等会被误报），故关闭并交由 `@typescript-eslint` 类型感知规则接管
 * （与 typescript-eslint 官方 recommended 的处置一致）。
 */
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
      // core 规则不识别 TS 类型信息，交由 @typescript-eslint 规则接管（同官方推荐）
      'no-undef': 'off',
      'no-unused-vars': 'off',
    },
  };
}

/**
 * Vue SFC 规则（.vue 文件，template 使用 vue-eslint-parser）
 *
 * 说明：script 部分同样由 TS 语义处理，core 的 `no-undef`/`no-unused-vars`
 * 对 vue-eslint-parser 中内嵌的 TS 代码不适用（HTML 全局量/组件标签等会被误报），
 * 统一交由 @typescript-eslint 规则接管。
 */
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
      // core 规则不识别内嵌 TS 语义，交由 @typescript-eslint 规则接管
      'no-undef': 'off',
      'no-unused-vars': 'off',
      // §4.6 v-for 必须绑定 key（vue 插件内置校验）
      'vue/require-v-for-key': 'error',
      // §7.1 XSS 防护：禁止裸 v-html，必须使用 v-safe-html（DOMPurify 白名单指令）
      // 自定义指令 v-safe-html 不受影响，从源头拦截 XSS 点状遗漏回归
      'vue/no-v-html': 'error',
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
    // 统一日志模块实现文件：内部需直接调用 console.*，豁免 no-console
    // （配合 §14.5：业务代码必须使用 createLogger，仅实现层可直用 console）
    {
      files: [
        '**/utils/logger.ts',
        '**/@core/base/shared/src/utils/logger.ts',
      ],
      rules: {
        'no-console': 'off',
      },
    },
    // 第三方生成组件库（shadcn-ui）：由 CLI 生成，含受控 any 透传，
    // 豁免 no-explicit-any 避免污染红线统计（云顶规范 §3.1 第三方生成件豁免）；
    // stories 演示示例允许 console（§14.5 约束面向浏览器业务代码，不适用于生成件演示）
    {
      files: ['**/@core/ui-kit/shadcn-ui/**/*.ts', '**/@core/ui-kit/shadcn-ui/**/*.vue'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
        'no-console': 'off',
      },
    },
    // Node CLI / Vite 构建插件：console 是 CLI 输出与插件日志的标准实践
    // （§14.5 面向浏览器业务代码，Node 侧工具不适用 createLogger 约束）
    {
      files: [
        'bash/**/*.{ts,mjs,cts,mts}',
        'conf/vite-config/src/**/*.ts',
        'conf/node-utils/src/**/*.ts',
        'conf/tailwind-config/src/**/*.ts',
        'conf/lint-configs/**/*.ts',
        'comm/effects/micro-kernel/src/vite-plugin-manifest.ts',
      ],
      rules: {
        'no-console': 'off',
      },
    },
    // 子应用独立运行入口（standalone-main）与 mock 初始化：开发辅助输出，不属于生产业务路径
    {
      files: [
        '**/src/standalone-main.ts',
        '**/src/mock/**/*.ts',
      ],
      rules: {
        'no-console': 'off',
      },
    },
    // Service Worker：浏览器侧基础设施，生命周期（注册/注销/不支持）日志属于运行期可观测输出，
    // 与 Node 工具同属「非业务路径」，豁免 no-console（§14.5 面向业务代码）
    {
      files: ['**/service-worker.ts'],
      rules: {
        'no-console': 'off',
      },
    },
  ];
}

/** ESLint 类型导出（供 defineConfig 消费方类型推导） */
export type { ESLint };
