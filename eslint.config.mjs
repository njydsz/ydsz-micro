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
    // 构建期配置（bundlelib），未纳入任何 tsconfig project
    '**/build.config.ts',
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

// chrome/ DevTools 扩展（MV3）运行于扩展宿主与页面环境，与 bash/ 同理：
// 显式枚举 chrome.* API 与浏览器全局量而非引入 globals 依赖，契合「最小化外部依赖」原则。
// （v4.4.1 修复：此前未注入导致 chrome/ 下 59 处 no-undef 误报）
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

export default config;
