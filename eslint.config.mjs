/**
 * 仓库根 ESLint 9 扁平配置入口。
 *
 * 规则定义集中在 @ydsz/eslint-config（conf/lint-configs/eslint-config），
 * 本文件仅负责引用与项目级覆盖。
 *
 * @path eslint.config.mjs
 */
import { defineConfig } from '@ydsz/eslint-config';

const config = defineConfig();

// 归档目录（含生成代码参考文件）及根级配置文件不参与 lint
config.unshift({
  ignores: [
    '**/archived/**',
    '**/.generated-archived/**',
    'vitest.config.ts',
    'eslint.config.mjs',
    // 根级工具配置（工具加载器不支持 .mts，不可转 TS）
    'commitlint.config.mjs',
    'stylelint.config.mjs',
    // 构建期配置（bundlelib），未纳入任何 tsconfig project
    '**/build.config.ts',
    // 第三方 vendor 产物（importmap 离线回退资源，非本仓源码）：
    // main/public/vendor 下为 cdn.jsdelivr.net 的 axios / vxe-pc-ui 等原生 ESM 副本，
    // 由 bug 修复或升级时整包替换，不遵循本仓编码规范，故不参与 lint。
    '**/public/vendor/**',
    // 智能体工作区：临时脚本与一次性校验工具，生命周期短于任何规范约束周期
    '.workbuddy/**',
    // Chrome 扩展（4.1.0 起 .ts 化），由 chrome-shim.d.ts + chrome/tsconfig.json 独立 type-check，
    // 不再通过主仓 ESLint 项目 lint（避免 chrome.* no-undef 误报与 any 禁令冲突）。
    'chrome/**/*.ts',
    'chrome/dist/**',
    // Mock Service Worker（npm msw 库产物，不可转 TS）
    '**/public/mockServiceWorker.js',
  ],
});

// bash/ 运维脚本（.mjs/.js）运行于 Node 环境：
// 共享配置仅对 TS/Vue 关闭 no-undef，纯 JS 脚本需显式注入 Node 全局量，
// 否则 console/process/fetch 等被误报（v4.4.0 修复存量 lint 债务）。
// 显式枚举而非引入 globals 依赖，契合「最小化外部依赖」原则。
const nodeGlobals = {
  AbortController: 'readonly',
  AbortSignal: 'readonly',
  atob: 'readonly',
  Blob: 'readonly',
  Buffer: 'readonly',
  btoa: 'readonly',
  clearInterval: 'readonly',
  clearTimeout: 'readonly',
  console: 'readonly',
  crypto: 'readonly',
  fetch: 'readonly',
  FormData: 'readonly',
  global: 'writable',
  Headers: 'readonly',
  performance: 'readonly',
  process: 'readonly',
  queueMicrotask: 'readonly',
  Request: 'readonly',
  Response: 'readonly',
  setInterval: 'readonly',
  setTimeout: 'readonly',
  structuredClone: 'readonly',
  TextDecoder: 'readonly',
  TextEncoder: 'readonly',
  URL: 'readonly',
  URLSearchParams: 'readonly',
};

config.unshift({
  files: ['bash/**/*.{mjs,js}'],
  languageOptions: {
    globals: nodeGlobals,
  },
});

// chrome/ DevTools 扩展（MV3）已迁移至 TypeScript（chrome/*.ts），
// 不再纳入主仓 ESLint 项目（类型由 chrome-shim.d.ts 承载，不经过主 tsconfig）。
// 仅对残留静态资源（.json / .html）放行；所有 .ts 文件通过 chrome/tsconfig.json 独立 type-check。
config.push({
  files: ['chrome/**/*.{json,html}'],
  languageOptions: {
    globals: {},
  },
  rules: {
    '@typescript-eslint/no-unused-vars': 'off',
  },
});

// chrome/ DevTools 扩展（MV3）运行于扩展宿主与页面环境，与 bash/ 同理：
// 显式枚举 chrome.* API 与浏览器全局量而非引入 globals 依赖，契合「最小化外部依赖」原则。
// （v4.4.1 修复：此前未注入导致 chrome/ 下 59 处 no-undef 误报）
// @deprecated 自 4.1.0 .js 迁移至 .ts 后，此规则仅保留以防回潮；一般不再触发。
const chromeGlobals = {
  ...nodeGlobals,
  // 浏览器 / 页面全局量
  CustomEvent: 'readonly',
  DOMParser: 'readonly',
  document: 'readonly',
  Element: 'readonly',
  Event: 'readonly',
  EventTarget: 'readonly',
  location: 'readonly',
  MessageChannel: 'readonly',
  MessagePort: 'readonly',
  MutationObserver: 'readonly',
  navigator: 'readonly',
  Node: 'readonly',
  requestAnimationFrame: 'readonly',
  cancelAnimationFrame: 'readonly',
  self: 'writable',
  sessionStorage: 'readonly',
  localStorage: 'readonly',
  window: 'writable',
  XMLHttpRequest: 'readonly',
  // Chrome 扩展（MV3）命名空间与 DevTools API
  chrome: 'writable',
};

config.unshift({
  files: ['chrome/**/*.js'],
  languageOptions: {
    globals: chromeGlobals,
  },
});

// 注意：扁平配置中后出现的条目优先级更高，项目级覆盖必须 push 到末尾，
// 否则会被 @ydsz/eslint-config 的同名规则覆盖（unshift 无效，2026-09-01 修正）。

// @ydsz/monitor 的面包屑机制需拦截 console.warn/error 作为事件源，
// 属基础设施职责而非业务日志（规范 §14.5 针对"生产环境打印日志"的场景豁免）。
config.push({
  files: ['comm/effects/monitor/src/**/*.ts'],
  rules: {
    'no-console': 'off',
  },
});

// Vite 构建期配置（vite.config.*.mts）运行于 Node 构建进程而非浏览器运行时，
// console 是构建期诊断（如 trace 插件输出模块解析链）的合理通道，
// 不适用规范 §14.5「生产环境禁止打印日志」条款。
config.push({
  files: ['**/vite.config.*.mts'],
  rules: {
    'no-console': 'off',
  },
});

// TS 函数重载 / interface 声明合并（如 ydszAlert、$t 的多签名）是合法 TS 模式，
// no-redeclare 不理解 TS 语义；类型正确性由 tsc 保证，故对 TS/Vue 关闭。
config.push({
  files: ['**/*.{ts,tsx,vue,mts,cts}'],
  rules: {
    'no-redeclare': 'off',
  },
});

// 游离于全部 tsconfig project 之外的文件（allowDefaultProject 不支持 ** 通配，
// 无法覆盖子目录），关闭 projectService 以回退为无类型感知解析：
// - comm/@core/base/design/vite.config.mts：design 包构建期配置
// - comm/effects/mock-service/src/handlers.ts：mock 契约（依赖运行时 spec 泛型）
config.push({
  files: [
    'comm/@core/base/design/vite.config.mts',
    'comm/effects/mock-service/src/handlers.ts',
  ],
  languageOptions: {
    parserOptions: {
      projectService: false,
      allowDefaultProject: [],
    },
  },
});

// =====================================================================
// Monorepo 包层级约束（2026-09-01 P1-6）
// --------------------------------------------------------------------
//  目标：防止循环依赖、逆向依赖，确保 DDD-like 分层稳定。
//
//  层级（从底到顶）：
//    L0 comm/@core/*        基础层（UI kit / composables / feature-flags）
//    L1 comm/{constants,stores,styles,types,utils,icons,locales,preferences}
//    L2 comm/effects/*      效果层（request / access / shared-auth / shared-business ...）
//    L3 apps/*              应用层（system-web / userinfo-web / ...）
//
//  约束规则：
//    - L0 不允许 import L1/L2/L3
//    - L1 不允许 import L2/L3
//    - L2 不允许 import L3
//    - L3 不允许横向 import 其他 apps/*
//
// =====================================================================

// L0: comm/@core/* — 基础层，禁止引用效果层和应用层
config.push({
  files: ['comm/@core/**/*.{ts,tsx,vue}'],
  rules: {
    'no-restricted-imports': [
      'error',
      {
        patterns: [
          {
            group: ['@ydsz/effects/*', '@ydsz/*-web/*', 'comm/effects/*', 'apps/*'],
            message:
              '基础层 (comm/@core) 禁止引用效果层 (comm/effects) 或应用层 (apps)。若确需跨层，请在 @ydsz/eslint-config 申请豁免。',
          },
        ],
      },
    ],
  },
});

// L0b: comm/{constants,stores,styles,types,utils,icons,locales,preferences} — 公共工具层
config.push({
  files: [
    'comm/constants/**/*.{ts,tsx,vue}',
    'comm/stores/**/*.{ts,tsx,vue}',
    'comm/styles/**/*.{ts,tsx,vue}',
    'comm/types/**/*.{ts,tsx,vue}',
    'comm/utils/**/*.{ts,tsx,vue}',
    'comm/icons/**/*.{ts,tsx,vue}',
    'comm/locales/**/*.{ts,tsx,vue}',
    'comm/preferences/**/*.{ts,tsx,vue}',
  ],
  rules: {
    'no-restricted-imports': [
      'error',
      {
        patterns: [
          {
            group: ['@ydsz/effects/*', 'comm/effects/*', 'apps/*'],
            message:
              '公共工具层禁止引用效果层 (comm/effects) 或应用层 (apps)。',
          },
        ],
      },
    ],
  },
});

// L2: comm/effects/* — 效果层，禁止引用应用层
config.push({
  files: ['comm/effects/**/*.{ts,tsx,vue}'],
  rules: {
    'no-restricted-imports': [
      'error',
      {
        patterns: [
          {
            group: ['apps/*', '@ydsz/*-web/*'],
            message:
              '效果层 (comm/effects) 禁止引用应用层 (apps)。若需跨应用共享能力，请提升至 comm/effects 或 @core。',
          },
        ],
      },
    ],
  },
});

// L3: apps/* — 应用层，禁止横向引用其他 apps/*
config.push({
  files: ['apps/**/*.{ts,tsx,vue}'],
  rules: {
    'no-restricted-imports': [
      'error',
      {
        patterns: [
          {
            group: ['apps/*'],
            message:
              '应用层 (apps) 禁止横向引用其他子应用。跨应用共享能力必须下沉至 comm/ 层。',
          },
        ],
      },
    ],
  },
});

// =====================================================================
// EP 退场门禁（v5.0.0 闭环）
// --------------------------------------------------------------------
// apps/ 与 main/ 禁止新增 from 'element-plus' import（error 级硬阻断）。
//
// 违规即 P0 阻断；业务侧组件替换为 @ydsz-core/ydsz-ui，命令式 API 替换为
// @ydsz-core/popup-ui (confirm/prompt/alert) 或 @ydsz/notification (showToast)。
// =====================================================================

config.push({
  files: ['apps/**/*.{ts,tsx,vue,mts}', 'main/**/*.{ts,tsx,vue,mts}'],
  rules: {
    'no-restricted-imports': [
      'error',
      {
        paths: [
          {
            name: 'element-plus',
            message:
              'EP 退场 (v5.0.0)：apps/main 禁止 from "element-plus"。组件请使用 @ydsz-core/ydsz-ui；命令式 API 请使用 @ydsz-core/popup-ui。',
          },
          {
            name: 'element-plus/*',
            message:
              'EP 退场 (v5.0.0)：apps/main 禁止 from "element-plus/*"。请使用 @ydsz-core/ydsz-ui 对应模块。',
          },
          {
            name: '@element-plus/icons-vue',
            message:
              'EP 退场 (v5.0.0)：apps/main 禁止 @element-plus/icons-vue。请使用 lucide-vue-next 或 @ydsz/icons。',
          },
        ],
      },
    ],
  },
});

// =====================================================================
// TS 门禁：禁止新增 .js / .mjs 回潮（v5.0 全量 TypeScript）
// --------------------------------------------------------------------
// 适用范围：apps/ comm/ bash/ main/ 源码目录（排除工具配置、dist 构建产物、vendor）；
// 已经在 lefthook + ESLint glob 之外，本规则做兜底：防止有人绕过 lefthook 直接
// commit 新增 .js / .mjs 源文件。
//
// 允许的 .mjs 文件（根级工具配置，工具加载器不支持 .mts）：
//   eslint.config.mjs  commitlint.config.mjs  stylelint.config.mjs
// 以及 dist/、node_modules/、public/vendor/ 下的编译产物（已在 ignores 列表）。
// =====================================================================

const noJsPlugin = {
  rules: {
    'no-js-or-mjs-source': {
      meta: {
        type: 'problem',
        docs: {
          description: '禁止在源码目录新增 .js / .mjs 文件，防止 TS 回潮',
        },
        messages: {
          noJsSource:
            '🚫 禁止 .js / .mjs 回潮："{{name}}" 应使用 .ts / .mts 扩展名。请将文件重命名并补充类型标注。',
        },
        schema: [],
      },
      create(context) {
        return {
          Program(node) {
            const fp = context.filename;
            const jsLike = /\.(m)?js$/;
            if (!jsLike.test(fp)) return;
            // 根级工具配置：工具加载器（ESLint/commitlint/stylelint CLI）不支持 .mts
            const toolConfig =
              /(?:^|[\/])(?:eslint|commitlint|stylelint)\.config\.(m)?js$/;
            // Babel/Rollup 构建期配置也多为特殊文件
            const buildConfig = /(?:^|\/)\.babelrc(?:\.js)?$/;
            if (toolConfig.test(fp) || buildConfig.test(fp)) return;
            context.report({
              node,
              loc: { line: 1, column: 0 },
              messageId: 'noJsSource',
              data: { name: fp.replace(context.cwd || process.cwd(), '.') },
            });
          },
        };
      },
    },
  },
};

config.push({
  plugins: { 'ts-gate': noJsPlugin },
  rules: {
    'ts-gate/no-js-or-mjs-source': 'error',
  },
});

/**
 * 仓库根 ESLint 扁平配置（默认导出）。
 *
 * 规则定义与项目级覆盖集中在本文件；具体规则实现见 @ydsz/eslint-config。
 *
 * @default config —— ESLint 9 扁平配置数组
 * @path eslint.config.mjs
 */
export default config;
