#!/usr/bin/env node
/**
 * 子应用脚手架生成器 — 一条命令完成新建子应用的全部配置。
 *
 * 背景：
 *   新建子应用此前需手工改动 10 处（注册表、根 package.json 脚本、env、
 *   vite.config、tsconfig、router/routes、router/guard、locales、app.vue、
 *   preferences），任何一处遗漏都会导致「本地跑通但微前端加载失败」，
 *   且这类问题只能在运行时发现。
 *
 * 生成内容：
 *   apps/<name>-web/ 下全套骨架（package.json / vite.config / tsconfig /
 *   index.html / .env.* / src 下 main.ts、app.vue、preferences.ts、adapter、
 *   layouts、locales、router、views），并自动追加注册表条目与根脚本。
 *
 * 用法：
 *   pnpm gen:subapp <name> [--title <中文标题>] [--port <端口>] [--module <首页模块>]
 *
 * 示例：
 *   pnpm gen:subapp crm --title 客户关系 --port 5620 --module customer
 *
 * @path bash/gen-subapp.mts
 * @author ydsz-team
 * @since 4.3.2
 */

import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const APP_BASE = '/ydsz-';

interface Options {
  /** 子应用名（kebab-case），最终目录名 <name>-web */
  name: string;
  /** 中文标题，用于注册表 title */
  title: string;
  /** 开发服务器端口 */
  port: number;
  /** 首页模块名，用于默认首页路径与路由模块文件名 */
  module: string;
  /**
   * 路由 history 模式：`'web'`（默认）或 `'hash'`。
   * hash 模式适用于静态托管无 rewrite 规则的场景。
   */
  routerHistory: 'web' | 'hash';
}

// ==================== 参数解析 ====================

function parseArgs(argv: string[]): Options {
  const positional: string[] = [];
  const flags: Record<string, string> = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg?.startsWith('--')) {
      flags[arg.slice(2)] = argv[i + 1] ?? '';
      i++;
    } else if (arg) {
      positional.push(arg);
    }
  }

  const name = positional[0];
  if (!name) {
    console.error(
      '❌ 缺少子应用名。用法：pnpm gen:subapp <name> [--title <标题>] [--port <端口>] [--module <模块>]',
    );
    process.exit(1);
  }
  if (!/^[a-z][a-z0-9-]*$/.test(name)) {
    console.error(
      `❌ 子应用名 "${name}" 不合法：需为小写字母开头的 kebab-case（如 crm、order-center）`,
    );
    process.exit(1);
  }

  return {
    name,
    title: flags.title || name,
    port: Number(flags.port) || findFreePort(),
    module: flags.module || name,
    routerHistory: flags.history === 'hash' ? 'hash' : 'web',
  };
}

/** 取已注册子应用的最大端口 +1，避免端口冲突 */
function findFreePort(): number {
  let max = 5600;
  for (const app of listExistingApps()) {
    const vite = join(ROOT_DIR, 'apps', app, 'vite.config.mts');
    if (!existsSync(vite)) continue;
    const content = readFileSync(vite, 'utf-8');
    const m = /port:\s*(\d+)/.exec(content);
    if (m) max = Math.max(max, Number(m[1]));
  }
  return max + 1;
}

/** 列出 apps/ 下已有子应用目录 */
function listExistingApps(): string[] {
  const appsDir = join(ROOT_DIR, 'apps');
  if (!existsSync(appsDir)) return [];
  return readdirSync(appsDir)
    .filter((entry) => {
      const abs = join(appsDir, entry);
      return statSync(abs).isDirectory() && !entry.startsWith('.');
    });
}

// ==================== 模板 ====================

function pkgJson(name: string): string {
  return `{
  "name": "@ydsz/${name}-web",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "build": "pnpm vite build --mode production",
    "build:analyze": "pnpm vite build --mode analyze",
    "dev": "pnpm vite --mode development",
    "preview": "vite preview",
    "test": "vitest run",
    "test:e2e": "playwright test"
  },
  "imports": {
    "#/*": "./src/*"
  },
  "dependencies": {
    "@vueuse/core": "catalog:",
    "@ydsz/access": "workspace:*",
    "@ydsz/common-ui": "workspace:*",
    "@ydsz/constants": "workspace:*",
    "@ydsz/hooks": "workspace:*",
    "@ydsz/icons": "workspace:*",
    "@ydsz/layouts": "workspace:*",
    "@ydsz/locales": "workspace:*",
    "@ydsz/monitor": "workspace:*",
    "@ydsz/notification": "workspace:*",
    "@ydsz/plugins": "workspace:*",
    "@ydsz/preferences": "workspace:*",
    "@ydsz/request": "workspace:*",
    "@ydsz/shared-auth": "workspace:*",
    "@ydsz/shared-business": "workspace:*",
    "@ydsz/stores": "workspace:*",
    "@ydsz/styles": "workspace:*",
    "@ydsz/types": "workspace:*",
    "@ydsz-core/popup-ui": "workspace:*",
    "@ydsz-core/shared": "workspace:*",
    "@ydsz/utils": "workspace:*",
    "@ydsz-core/ydsz-ui": "workspace:*",
    "dayjs": "catalog:",
    "pinia": "catalog:",
    "vue": "catalog:",
    "vue-i18n": "catalog:",
    "vue-router": "catalog:"
  },
  "devDependencies": {
    "vite": "catalog:",
    "@vue/test-utils": "catalog:",
    "vitest": "catalog:",
    "happy-dom": "catalog:",
    "@playwright/test": "catalog:"
  },
  "license": "MIT",
  "YDSZ": {
    "shareStrategy": "core-ui"
  }
}
`;
}

function viteConfig(name: string, port: number): string {
  return `/**
 * ${name} 子应用 Vite 构建配置。
 *
 * @remarks
 * 开发服务器固定端口 ${port}，/api 请求代理至本地 9000 端口。
 *
 * @author ydsz-team
 * @since 1.0.0
 */
import { defineConfig, withVendorExternals } from '@ydsz/vite-config';

/**
 * ${name} 子应用 / Vite 构建配置（默认导出）。
 *
 * <p>基于 @ydsz/vite-config 共享配置扩展；开发端口 ${port}，/api 代理至本地 9000。
 *
 * @default —— Vite defineConfig 产物
 */
export default defineConfig(async () => {
  return {
    application: {},
    vite: withVendorExternals({
      base: '/',
      plugins: [],
      server: {
        port: ${port},
        cors: true,
        host: '0.0.0.0',
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
        proxy: {
          // /api 必须原样转发：剥掉 /api 由网关 StripPrefix=1 负责，代理再剥一次会全量 404
          '/api': {
            changeOrigin: true,
            target: 'http://localhost:9000',
            ws: true,
          },
        },
      },
    }),
  };
});
`;
}

function tsconfig(): string {
  return `{
  "$schema": "https://json.schemastore.org/tsconfig",
  "extends": "@ydsz/tsconfig/web-app.json",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "#/*": ["./src/*"]
    },
    "types": ["vite/client"]
  },
  "references": [{ "path": "./tsconfig.node.json" }],
  "include": ["src/**/*.ts", "src/**/*.tsx", "src/**/*.vue"]
}
`;
}

function tsconfigNode(): string {
  return `{
  "$schema": "https://json.schemastore.org/tsconfig",
  "extends": "@ydsz/tsconfig/node.json",
  "compilerOptions": {
    "composite": true,
    "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.node.tsbuildinfo",
    "noEmit": false
  },
  "include": [
    "vite.config.mts",
    "postcss.config.mts",
    "tailwind.config.mts",
    "playwright.config.ts",
    "e2e/**/*.ts"
  ]
}
`;
}

function indexHtml(_title: string): string {
  return `<!doctype html>
<html lang="zh">
  <head>
    <meta charset="UTF-8" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1" />
    <meta name="renderer" content="webkit" />
    <meta name="description" content="A Modern Back-end Management System" />
    <meta name="keywords" content="YDSZ Admin Vue3 Vite" />
    <meta name="author" content="YDSZ" />
    <!--
      不得禁用缩放：maximum-scale=1 / user-scalable=0 会让低视力用户无法放大页面，
      违反 WCAG 2.1 AA 1.4.4（Resize Text）。bash/check-html-head.mts 会拦此类写法。
    -->
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title><%= VITE_APP_TITLE %></title>
    <link rel="icon" href="/favicon.ico" />
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
`;
}

function envDevelopment(name: string, port: number): string {
  return `VITE_PORT=${port}
VITE_BASE=/
VITE_GLOB_API_URL=/api
VITE_DEVTOOLS=false
VITE_INJECT_APP_LOADING=true

VITE_APP_TITLE=${name}
`;
}

function envProduction(name: string): string {
  return `VITE_BASE=/ydsz-${name}-web/
VITE_GLOB_API_URL=/api
VITE_COMPRESS=gzip,brotli
VITE_PWA=false
VITE_ROUTER_HISTORY=history
VITE_INJECT_APP_LOADING=true
VITE_ARCHIVER=true
`;
}

function mainTs(name: string, _module: string, routerHistory: 'web' | 'hash' = 'web'): string {
  const historyLine =
    routerHistory === 'hash'
      ? `  // hash history：静态托管无 rewrite 规则时使用\n  routerHistory: 'hash',\n`
      : '';
  return `/**
 * 应用入口文件 — 使用 createSubApp 工厂标准化生命周期
 *
 * @path apps\\${name}-web\\src\\main.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import { createSubApp } from '@ydsz/shared-auth';
import '@ydsz/styles';

import { initComponentAdapter } from './adapter/component';
import { initSetupYDSZForm } from './adapter/form';
import RootApp from './app.vue';
import { setupI18n } from './locales';
import { overridesPreferences } from './preferences';
import { createRouterGuard, initRoutes } from './router/guard';
import { routes } from './router/routes';

export const { bootstrap, mount, unmount, update } = createSubApp({
  appName: '${name}-web',
  basename: '${APP_BASE}${name}',
${historyLine}  routes,
  rootComponent: RootApp,
  preferencesOverrides: overridesPreferences,
  initRoutes,
  guard: createRouterGuard,
  async onSetup(app) {
    await initComponentAdapter();
    await initSetupYDSZForm();
    await setupI18n(app);
  },
});
`;
}

function appVue(): string {
  return `<!--
 * 应用根组件
 *
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
import { ToastProvider } from '@ydsz/notification';

defineOptions({ name: 'App' });
</script>

<template>
  <ToastProvider />
  <RouterView />
</template>
`;
}

function preferencesTs(name: string, module: string): string {
  return `/**
 * preferences 模块
 *
 * @author ydsz-team
 * @since 1.0.0
 */
import { defineOverridesPreferences } from '@ydsz/preferences';

/**
 * 应用偏好覆盖配置。
 *
 * 在 @ydsz/preferences 默认值基础上按 ${name}-web 诉求定制。
 */
export const overridesPreferences = defineOverridesPreferences({
  app: {
    name: import.meta.env.VITE_APP_TITLE,
    defaultHomePath: '${APP_BASE}${name}/${module}',
  },
});
`;
}

function adapterComponent(): string {
  return `/**
 * 表单组件适配器（应用级 re-export）
 *
 * 统一实现已提取至 @ydsz/shared-business，此处保留应用级入口以兼容既有导入路径。
 *
 * @author ydsz-team
 * @since 1.1.0
 */
export { initComponentAdapter, type ComponentType } from '@ydsz/shared-business';
`;
}

function adapterForm(): string {
  return `/**
 * 表单适配器 — 统一表单组件配置
 *
 * @author ydsz-team
 * @since 1.0.0
 */
import { setupYDSZForm } from '@ydsz/shared-business';

/** 初始化表单组件适配器 */
export function initSetupYDSZForm(): void {
  setupYDSZForm();
}
`;
}

function adapterVxeTable(): string {
  return `/**
 * VXE Table 适配器 — 表格组件配置
 *
 * @author ydsz-team
 * @since 1.0.0
 */
import { setupVXETable } from '@ydsz/shared-business';

/** 初始化 VXE Table 适配器 */
export function initVXETable(): void {
  setupVXETable();
}
`;
}

function layoutsIndex(): string {
  return `/**
 * 布局入口
 *
 * @author ydsz-team
 * @since 1.0.0
 */
export { default as BasicLayout } from './basic.vue';
`;
}

function layoutsBasicVue(): string {
  return `<!--
 * 基础布局
 *
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
defineOptions({ name: 'BasicLayout' });
</script>

<template>
  <div class="h-full w-full overflow-auto">
    <RouterView />
  </div>
</template>
`;
}

function localesIndex(): string {
  return `/**
 * 国际化配置入口 — 通过 @ydsz/shared-auth 的 createSubAppI18n 工厂装配。
 *
 * @author ydsz-team
 * @since 1.0.0
 */
import { createSubAppI18n } from '@ydsz/shared-auth';

const modules = import.meta.glob('./langs/**/*.json');

export const { $t, setupI18n } = createSubAppI18n({ modules });
`;
}

function localeFile(name: string, title: string): string {
  return JSON.stringify(
    {
      app: { name: title },
      common: { empty: '暂无数据', loading: '加载中...' },
    },
    null,
    2,
  );
}

function routerIndex(): string {
  return `/**
 * 路由实例入口
 *
 * <p>创建并导出 Vue Router 实例，初始化 history 模式（hash / web history）。
 * <p>供 main.ts 注入到 Vue App 使用。
 *
 * @author ydsz-team
 * @since 1.0.0
 */
import { createRouter, createWebHashHistory, createWebHistory } from 'vue-router';

import { resetStaticRoutes } from '@ydsz/utils';

import { createRouterGuard, initRoutes } from './guard';
import { routes } from './routes';

const router = createRouter({
  history:
    import.meta.env.VITE_ROUTER_HISTORY === 'hash'
      ? createWebHashHistory(import.meta.env.VITE_BASE)
      : createWebHistory(import.meta.env.VITE_BASE),
  routes,
  scrollBehavior: (to, _from, savedPosition) => {
    if (savedPosition) {
      return savedPosition;
    }
    return to.hash ? { behavior: 'smooth', el: to.hash } : { left: 0, top: 0 };
  },
});

/**
 * 重置路由：清空动态注册的路由并恢复静态基础路由。
 * 用于登出或切换账号后避免旧路由残留。
 */
const resetRoutes = () => resetStaticRoutes(router, routes);

initRoutes(router);

createRouterGuard(router);

export { resetRoutes, router };
`;
}

function routerGuard(): string {
  return `/**
 * 路由守卫 — 统一通过 shared-auth 包提供的标准化守卫注册。
 *
 * 子应用无需重复实现 commonGuard / authGuard / permissionGuard / initRoutes。
 *
 * @author ydsz-team
 * @since 2.0.0
 */
import type { Router } from 'vue-router';

import { createSubAppRouterGuard, initRoutes as sharedInitRoutes } from '@ydsz/shared-auth/guards';

import { accessRoutes } from '#/router/routes';

function createRouterGuard(router: Router) {
  createSubAppRouterGuard(router, accessRoutes);
}

function initRoutes(router: Router) {
  sharedInitRoutes(router, accessRoutes);
}

export { createRouterGuard, initRoutes };
`;
}

function routerAccess(): string {
  return `/**
 * 路由权限配置
 *
 * @author ydsz-team
 * @since 1.0.0
 */
export const routePermissions = {};
`;
}

function routesIndex(): string {
  return `/**
 * 路由配置入口，聚合所有路由模块
 *
 * @author ydsz-team
 * @since 1.0.0
 */
import type { RouteRecordRaw } from 'vue-router';

import { mergeRouteModules, traverseTreeValues } from '@ydsz/utils';

import { coreRoutes, fallbackNotFoundRoute } from './core';

const dynamicRouteFiles = import.meta.glob('./modules/**/*.ts', {
  eager: true,
});

/** 动态路由 */
const dynamicRoutes: RouteRecordRaw[] = mergeRouteModules(dynamicRouteFiles);

const staticRoutes: RouteRecordRaw[] = [];
const externalRoutes: RouteRecordRaw[] = [];

/** 路由列表，由基本路由、外部路由和 404 兜底路由组成 */
const routes: RouteRecordRaw[] = [...coreRoutes, ...externalRoutes, fallbackNotFoundRoute];

/** 基本路由列表，这些路由不需要进入权限拦截 */
const coreRouteNames = traverseTreeValues(coreRoutes, (route) => route.name);

/** 有权限校验的路由列表，包含动态路由和静态路由 */
const accessRoutes = [...dynamicRoutes, ...staticRoutes];
export { accessRoutes, coreRouteNames, routes };
`;
}

function routesCore(): string {
  return `/**
 * 核心路由配置（根路由 + 404 兜底）
 *
 * @remarks
 * 路由结构收敛到 \`@ydsz/shared-auth\` 的 \`createCoreRoutes\`，此处仅注入
 * 子应用侧的布局与兜底组件。
 *
 * @author ydsz-team
 * @since 1.0.0
 */
import { createCoreRoutes } from '@ydsz/shared-auth';

const { coreRoutes, fallbackNotFoundRoute } = createCoreRoutes({
  basicLayout: () => import('#/layouts/basic.vue'),
  notFoundComponent: () => import('#/views/fallback/not-found.vue'),
});

export { coreRoutes, fallbackNotFoundRoute };
`;
}

function routeModule(name: string, module: string, title: string): string {
  return `/**
 * ${title} 路由模块
 *
 * @author ydsz-team
 * @since 1.0.0
 */
import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '${APP_BASE}${name}/${module}',
    name: '${pascal(module)}Index',
    component: () => import('#/views/${module}/index.vue'),
    meta: { title: '${title}' },
  },
];

export default routes;
`;
}

function notFoundVue(): string {
  return `<!--
 * 404 页面
 *
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
import { useI18n } from 'vue-i18n';

defineOptions({ name: 'NotFound' });

const { t } = useI18n();
</script>

<template>
  <div class="flex h-full flex-col items-center justify-center gap-4">
    <h1 class="text-4xl font-bold text-muted-foreground">404</h1>
    <p class="text-muted-foreground">{{ t('common.empty') }}</p>
    <a class="text-primary hover:underline" href="/">{{ t('common.empty') }}</a>
  </div>
</template>
`;
}

function viewIndexVue(name: string, module: string, title: string): string {
  return `<!--
 * ${title} 首页
 *
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
import { useI18n } from 'vue-i18n';

defineOptions({ name: '${pascal(module)}Index' });

const { t } = useI18n();
</script>

<template>
  <div class="p-6">
    <h1 class="text-2xl font-semibold">${title}</h1>
    <p class="mt-2 text-muted-foreground">{{ t('common.empty') }}</p>
  </div>
</template>
`;
}

function notFoundTest(): string {
  return `/**
 * 404 页面组件测试
 *
 * @author ydsz-team
 * @since 1.0.0
 */
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import NotFound from './not-found.vue';

describe('NotFound', () => {
  it('渲染 404 标识', () => {
    const wrapper = mount(NotFound, {
      global: { stubs: ['router-link'] },
    });

    expect(wrapper.text()).toContain('404');
  });
});
`;
}

function viewIndexTest(name: string, module: string): string {
  return `/**
 * ${module} 首页组件测试
 *
 * @author ydsz-team
 * @since 1.0.0
 */
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { describe, expect, it } from 'vitest';

import ${pascal(module)}Index from './index.vue';

describe('${pascal(module)}Index', () => {
  it('渲染首页容器', () => {
    setActivePinia(createPinia());
    const wrapper = mount(${pascal(module)}Index, {
      global: { stubs: ['router-link'] },
    });

    expect(wrapper.classes()).toContain('p-6');
  });
});
`;
}

/** kebab-case → PascalCase */
function pascal(s: string): string {
  return s
    .split('-')
    .map((part) => (part ? part[0].toUpperCase() + part.slice(1) : part))
    .join('');
}

// ==================== 文件写入 ====================

interface FileSpec {
  /** 相对 apps/<name>-web 的路径 */
  path: string;
  content: string;
}

function buildFileSpecs(opts: Options): FileSpec[] {
  const { name, title, port, module } = opts;
  return [
    { path: 'package.json', content: pkgJson(name) },
    { path: 'vite.config.mts', content: viteConfig(name, port) },
    { path: 'tsconfig.json', content: tsconfig() },
    { path: 'tsconfig.node.json', content: tsconfigNode() },
    { path: 'index.html', content: indexHtml(title) },
    { path: '.env.development', content: envDevelopment(name, port) },
    { path: '.env.production', content: envProduction(name) },
    { path: 'src/main.ts', content: mainTs(name, module, opts.routerHistory) },
    { path: 'src/app.vue', content: appVue() },
    { path: 'src/preferences.ts', content: preferencesTs(name, module) },
    { path: 'src/adapter/component/index.ts', content: adapterComponent() },
    { path: 'src/adapter/form.ts', content: adapterForm() },
    { path: 'src/adapter/vxe-table.ts', content: adapterVxeTable() },
    { path: 'src/layouts/index.ts', content: layoutsIndex() },
    { path: 'src/layouts/basic.vue', content: layoutsBasicVue() },
    { path: 'src/locales/index.ts', content: localesIndex() },
    {
      path: 'src/locales/langs/zh-CN/business.json',
      content: localeFile(name, title),
    },
    {
      path: 'src/locales/langs/en-US/business.json',
      content: localeFile(name, title),
    },
    { path: 'src/router/index.ts', content: routerIndex() },
    { path: 'src/router/guard.ts', content: routerGuard() },
    { path: 'src/router/access.ts', content: routerAccess() },
    { path: 'src/router/routes/index.ts', content: routesIndex() },
    { path: 'src/router/routes/core.ts', content: routesCore() },
    {
      path: `src/router/routes/modules/${module}.ts`,
      content: routeModule(name, module, title),
    },
    { path: 'src/views/fallback/not-found.vue', content: notFoundVue() },
    {
      path: 'src/views/fallback/not-found.test.ts',
      content: notFoundTest(),
    },
    {
      path: `src/views/${module}/index.vue`,
      content: viewIndexVue(name, module, title),
    },
    {
      path: `src/views/${module}/index.test.ts`,
      content: viewIndexTest(name, module),
    },
  ];
}

// ==================== 注册表与根脚本改写 ====================

/** 在 MICRO_APPS 数组末尾追加条目 */
function appendRegistryEntry(opts: Options): void {
  const file = join(ROOT_DIR, 'comm/constants/src/micro-apps.ts');
  if (!existsSync(file)) {
    console.warn(`⚠️  未找到注册表文件 ${file}，跳过自动登记（请手工添加）`);
    return;
  }
  const content = readFileSync(file, 'utf-8');
  const { name, title, port, module } = opts;

  const entry = `  {
    name: '${name}-web',
    packageName: '@ydsz/${name}-web',
    activeRule: '${APP_BASE}${name}',
    redirect: '${APP_BASE}${name}/${module}',
    title: '${title}',
    icon: 'lucide:box',
    order: 999,
    devPort: ${port},
    skeletonType: 'list',
  },
`;

  // 定位数组收尾：最后一个 `];` 之前插入
  const anchor = /^\];$/m;
  if (!anchor.test(content)) {
    console.warn('⚠️  注册表结构不符合预期（未找到 `];`），跳过自动登记');
    return;
  }
  const updated = content.replace(anchor, `${entry}];`);
  writeFileSync(file, updated, 'utf-8');
  console.log(`✓ 已追加注册表条目：${name}-web`);
}

/** 在根 package.json 追加 dev/build 脚本 */
function appendRootScripts(opts: Options): void {
  const file = join(ROOT_DIR, 'package.json');
  const content = readFileSync(file, 'utf-8');
  const { name } = opts;

  const anchor = /^ {2}"scripts": \{$/m;
  if (!anchor.test(content)) {
    console.warn('⚠️  根 package.json 未找到 scripts 块，跳过自动登记');
    return;
  }

  const scripts = `    "dev:${name}": "pnpm -F @ydsz/${name}-web run dev",
    "build:${name}": "pnpm -F @ydsz/${name}-web run build",
`;
  const updated = content.replace(anchor, `$&\n${scripts.trimEnd()}`);
  writeFileSync(file, updated, 'utf-8');
  console.log(`✓ 已追加根脚本：dev:${name} / build:${name}`);
}

// ==================== 主流程 ====================

function main(): void {
  const opts = parseArgs(process.argv.slice(2));
  const { name, title } = opts;
  const appDir = join(ROOT_DIR, 'apps', `${name}-web`);

  if (existsSync(appDir)) {
    console.error(`❌ 目录已存在：${appDir}`);
    process.exit(1);
  }

  // 1. 写文件
  const specs = buildFileSpecs(opts);
  for (const spec of specs) {
    const abs = join(appDir, spec.path);
    mkdirSync(dirname(abs), { recursive: true });
    writeFileSync(abs, spec.content, 'utf-8');
  }
  console.log(`✓ 已生成 ${specs.length} 个文件 → apps/${name}-web/`);

  // 2. 改写注册表与根脚本
  appendRegistryEntry(opts);
  appendRootScripts(opts);

  // 3. 提示后续步骤
  console.log(`
✅ 子应用骨架已就绪：${name}-web（${title}）

后续步骤（按顺序）：
  1. pnpm install                                    # 安装 workspace 依赖（必须，否则类型解析失败）
  2. pnpm gen:registry                               # 重新生成部署注册表
  3. 登记类型基线（新项目必须显式登记，见 check-app-typecheck.mts）：
       pnpm type-check                                # 先跑一次拿到错误数
       node ./bash/check-app-typecheck.mts --update-baseline
  4. pnpm dev:${name}                                # 启动该子应用开发服务器
  5. 在 comm/constants/src/micro-apps.ts 调整 order 与 icon
  6. 按需补充分页词条 src/locales/langs/*/page.json
`);
}

main();
