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

export default config;
