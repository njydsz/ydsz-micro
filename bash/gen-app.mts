#!/usr/bin/env node
/**
 * 子应用脚手架生成器（一站式）。
 *
 * 一条命令从模板生成新的微应用，自动完成：
 *   - package.json（含 workspace 引用与 scripts，对齐现行子应用依赖）
 *   - vite.config.mts（YDSZ + 端口配置）
 *   - tsconfig.json（继承 @ydsz/tsconfig）
 *   - src/main.ts / app.vue（标准生命周期导出，createSubApp 工厂模式）
 *   - src/preferences.ts / adapter / store / router / locales 骨架
 *   - .env / .env.development / .env.production / .env.analyze
 *   - postcss.config.mjs / tailwind.config.mjs
 *   - index.html
 *   - src/views/dashboard/index.tsx（欢迎页）
 *   - 自动注册到 comm/constants/src/micro-apps.ts 的 MICRO_APPS 数组
 *   - 自动重新生成 bash/deploy/nginx-sub-apps.conf
 *   - 自动在根 package.json 添加 dev:{name} 脚本
 *
 * 两种调用模式：
 *   1. 命令行参数的 CI / 脚本模式（向后兼容）：
 *      pnpm gen:app report-web 数据报表 /ydsz-report 5611
 *   2. 交互式 prompt（无参数时自动进入）：
 *      pnpm gen:app → 依次输入应用名、标题、路由前缀、端口…
 *
 * @example
 *   pnpm gen:app report-web "数据报表" /ydsz-report 5611
 *
 * @path bash/gen-app.mts
 * @author ydsz-team
 * @since 4.5.0
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import { execSync } from 'node:child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

// ==================== 常量 ====================

const MICRO_APPS_FILE = path.join(root, 'comm/constants/src/micro-apps.ts');
const NGINX_CONF_FILE = path.join(root, 'bash/deploy/nginx-sub-apps.conf');
const ROOT_PKG_FILE = path.join(root, 'package.json');

// 已占用的端口（从 MICRO_APPS 注册表实时读取 + 现有 apps 目录扫描）
const TAKEN_PORTS = new Set<number>();
const TAKEN_NAMES = new Set<string>();
const TAKEN_BASENAMES = new Set<string>();

// ==================== 初始化扫描 ====================

function scanExistingApps(): void {
  // 从 apps 目录扫描
  const appsDir = path.join(root, 'apps');
  if (fs.existsSync(appsDir)) {
    for (const entry of fs.readdirSync(appsDir, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        TAKEN_NAMES.add(entry.name);
      }
    }
  }

  // 从 MICRO_APPS 注册表读取（正则提取，与 gen-nginx-conf.mts 同策略）
  if (fs.existsSync(MICRO_APPS_FILE)) {
    const content = fs.readFileSync(MICRO_APPS_FILE, 'utf-8');
    const arrayStart = content.indexOf('export const MICRO_APPS');
    if (arrayStart !== -1) {
      const bracketStart = content.indexOf('[', arrayStart);
      const bracketEnd = content.indexOf('];', bracketStart);
      if (bracketStart !== -1 && bracketEnd !== -1) {
        const arrayContent = content.slice(bracketStart, bracketEnd);
        // 提取 name
        const nameRegex = /name:\s*['"`]([^'"`]+)['"`]/g;
        let m: RegExpExecArray | null;
        while ((m = nameRegex.exec(arrayContent)) !== null) {
          TAKEN_NAMES.add(m[1]);
        }
        // 提取 devPort
        const portRegex = /devPort:\s*(\d+)/g;
        while ((m = portRegex.exec(arrayContent)) !== null) {
          TAKEN_PORTS.add(Number.parseInt(m[1], 10));
        }
        // 提取 activeRule
        const ruleRegex = /activeRule:\s*['"`]([^'"`]+)['"`]/g;
        while ((m = ruleRegex.exec(arrayContent)) !== null) {
          TAKEN_BASENAMES.add(m[1]);
        }
      }
    }
  }
}

// ==================== 交互式 prompt ====================

function createPrompt() {
  return createInterface({ input: stdin, output: stdout });
}

async function ask(rl: ReturnType<typeof createPrompt>, question: string, defaultValue?: string): Promise<string> {
  const hint = defaultValue ? ` [${defaultValue}]` : '';
  const answer = await rl.question(`  ${question}${hint}: `);
  const trimmed = answer.trim();
  return trimmed || (defaultValue ?? '');
}

async function askPort(rl: ReturnType<typeof createPrompt>, question: string, defaultValue: number): Promise<number> {
  const raw = await ask(rl, question, String(defaultValue));
  const parsed = Number.parseInt(raw, 10);
  if (Number.isNaN(parsed) || parsed < 1024 || parsed > 65535) {
    console.error(`  ❌ 端口无效（需 1024-65535）：${raw}`);
    return askPort(rl, question, defaultValue);
  }
  return parsed;
}

function suggestBasename(name: string): string {
  // 优先规则：去掉 -web 前缀 → 加 /ydsz- 前缀
  const stripped = name.replace(/-web$/, '').replace(/^ydsz-/, '');
  return `/${stripped}`;
}

function suggestPort(): number {
  // 下一个空闲端口，从 5611 开始递增
  for (let p = 5611; p < 6000; p++) {
    if (!TAKEN_PORTS.has(p)) return p;
  }
  return 6000;
}

function suggestOrder(): number {
  // 当前最大 order + 1
  let maxOrder = 100;
  if (fs.existsSync(MICRO_APPS_FILE)) {
    const content = fs.readFileSync(MICRO_APPS_FILE, 'utf-8');
    const orderRegex = /order:\s*(\d+)/g;
    let m: RegExpExecArray | null;
    while ((m = orderRegex.exec(content)) !== null) {
      const v = Number.parseInt(m[1], 10);
      if (v > maxOrder) maxOrder = v;
    }
  }
  return maxOrder + 1;
}

function suggestRedirect(basename: string): string {
  return `${basename}/dashboard`;
}

// ==================== 参数解析 ====================

interface AppConfig {
  name: string;
  title: string;
  routePrefix: string;
  port: number;
  icon: string;
  skeletonType: 'dashboard' | 'default' | 'detail' | 'form' | 'list';
  redirect: string;
  order: number;
}

async function resolveArgs(): Promise<AppConfig> {
  const [nameArg, titleArg, routePrefixArg, portStr] = process.argv.slice(2);

  // 无参数 → 进入交互式 prompt
  if (!nameArg) {
    const rl = createPrompt();
    console.log('\n🚀 YDSZ 子应用脚手架 — 交互模式\n');

    // App name
    let name = '';
    while (!name) {
      name = await ask(rl, '应用名（如 report-web）');
      if (!name) {
        console.log('  ❌ 应用名必填');
        continue;
      }
      if (TAKEN_NAMES.has(name)) {
        console.log(`  ❌ 应用名 "${name}" 已被占用`);
        name = '';
        continue;
      }
      if (!/^[a-z][a-z0-9-]*-web$/.test(name)) {
        console.log('  ⚠️  命名规范：小写字母开头，以 -web 结尾（如 report-web）');
      }
    }

    // Title
    const title = await ask(rl, '应用标题（中文）', name.replace(/-web$/, '')).then((t) => t || name.replace(/-web$/, ''));

    // Route prefix (basename)
    let routePrefix = routePrefixArg || suggestBasename(name);
    routePrefix = await ask(rl, '路由前缀（activeRule）', routePrefix);
    if (!routePrefix.startsWith('/')) routePrefix = `/${routePrefix}`;

    // Port
    const port = await askPort(rl, '开发端口', suggestPort());

    // Icon
    const icon = await ask(rl, '菜单图标（lucide 名）', 'lucide:box');

    // Skeleton type
    const skeletonRaw = await ask(rl, '骨架屏类型（dashboard/default/detail/form/list）', 'dashboard');
    const skeletonType = (['dashboard', 'default', 'detail', 'form', 'list'].includes(skeletonRaw) ? skeletonRaw : 'dashboard') as AppConfig['skeletonType'];

    // Redirect
    const defaultRedirect = suggestRedirect(routePrefix);
    const redirect = await ask(rl, '默认跳转路径', defaultRedirect);

    await rl.close();
    console.log();

    return {
      name,
      title,
      routePrefix,
      port,
      icon,
      skeletonType,
      redirect,
      order: suggestOrder(),
    };
  }

  // 命令行模式（向后兼容）
  const name = nameArg;
  if (TAKEN_NAMES.has(name)) {
    console.error(`应用 ${name} 已存在`);
    process.exit(1);
  }

  const title = titleArg || name.replace(/-web$/, '');
  const routePrefix = routePrefixArg || `/${name.replace(/-web$/, '')}`;
  const port = Number.parseInt(portStr || String(suggestPort()), 10);

  return {
    name,
    title,
    routePrefix,
    port,
    icon: 'lucide:box',
    skeletonType: 'default',
    redirect: `${routePrefix}/dashboard`,
    order: suggestOrder(),
  };
}

// ==================== 目录创建 ====================

function ensureDirs(appDir: string): void {
  const dirs = [
    'src',
    'src/adapter',
    'src/adapter/component',
    'src/api/core',
    'src/api/sdk',
    'src/layouts',
    'src/locales/langs/zh-CN',
    'src/locales/langs/en-US',
    'src/router/routes/modules',
    'src/store',
    'src/utils',
    'src/views/dashboard',
    'src/views/fallback',
  ];
  for (const d of dirs) {
    fs.mkdirSync(path.join(appDir, d), { recursive: true });
  }
}

// ==================== 文件内容生成器 ====================

function genPackageJson(cfg: AppConfig): string {
  const pkgJson = {
    name: `@ydsz/${cfg.name}`,
    version: '1.0.0',
    private: true,
    type: 'module',
    YDSZ: { shareStrategy: 'core' },
    scripts: {
      build: 'pnpm vite build --mode production',
      'build:analyze': 'pnpm vite build --mode analyze',
      dev: 'pnpm vite --mode development',
      preview: 'vite preview',
    },
    imports: { '#/*': './src/*' },
    dependencies: {
      '@ydsz/access': 'workspace:*',
      '@ydsz/common-ui': 'workspace:*',
      '@ydsz/constants': 'workspace:*',
      '@ydsz/hooks': 'workspace:*',
      '@ydsz/icons': 'workspace:*',
      '@ydsz/layouts': 'workspace:*',
      '@ydsz/locales': 'workspace:*',
      '@ydsz/monitor': 'workspace:*',
      '@ydsz/notification': 'workspace:*',
      '@ydsz/plugins': 'workspace:*',
      '@ydsz/preferences': 'workspace:*',
      '@ydsz/request': 'workspace:*',
      '@ydsz/shared-auth': 'workspace:*',
      '@ydsz/shared-business': 'workspace:*',
      '@ydsz/stores': 'workspace:*',
      '@ydsz/styles': 'workspace:*',
      '@ydsz/types': 'workspace:*',
      '@ydsz/utils': 'workspace:*',
      '@ydsz-core/popup-ui': 'workspace:*',
      '@ydsz-core/shared': 'workspace:*',
      '@ydsz-core/ydsz-ui': 'workspace:*',
      '@vueuse/core': 'catalog:',
      dayjs: 'catalog:',
      pinia: 'catalog:',
      vue: 'catalog:',
      'vue-i18n': 'catalog:',
      'vue-router': 'catalog:',
    },
    devDependencies: {
      vite: 'catalog:',
    },
    license: 'MIT',
  };
  return JSON.stringify(pkgJson, null, 2) + '\n';
}

function genViteConfig(cfg: AppConfig): string {
  return `import { defineConfig } from '@ydsz/vite-config';

export default defineConfig(async () => {
  return {
    application: {},
    vite: {
      base: '/',
      server: {
        port: ${cfg.port},
        cors: true,
        host: '0.0.0.0',
        headers: { 'Access-Control-Allow-Origin': '*' },
        proxy: {
          '/api': {
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\\/api/, ''),
            target: 'http://localhost:9000',
            ws: true,
          },
        },
      },
    },
  };
});
`;
}

function genTsconfig(): string {
  return JSON.stringify(
    {
      $schema: 'https://json.schemastore.org/tsconfig',
      extends: '@ydsz/tsconfig/web-app.json',
      compilerOptions: {
        composite: true,
        baseUrl: '.',
        paths: { '#/*': ['./src/*'] },
        types: ['vite/client'],
      },
      include: ['src/**/*.ts', 'src/**/*.tsx', 'src/**/*.vue'],
    },
    null,
    2,
  ) + '\n';
}

function genIndexHtml(cfg: AppConfig): string {
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
    <meta
      name="viewport"
      content="width=device-width, initial-scale=1.0"
    />
    <!-- 由 vite 注入 VITE_APP_TITLE 变量，在 .env 文件内配置 -->
    <title><%= VITE_APP_TITLE %></title>
    <link rel="icon" href="/favicon.ico" />
    <!--
      第三方字体与第三方统计已从本页移除（B0-8）：
      · 内联 <script> 与跨域 <link rel=stylesheet> 在 CSP（script-src 'self' 'strict-dynamic'、
        style-src 与 font-src 仅 'self'）下既不会执行也不会加载，即生产上这两段一直是死的；
      · rel=preconnect 与 dns-prefetch 不受 CSP 约束，仍会向第三方域发起 DNS+TCP+TLS 探测。
      如需站点统计：由使用方决策后改为第一方外链 JS，并在 bash/deploy/security-headers.conf
      的 script-src 显式放行分析域。如需指定字体：自托管 woff2（见上方 preload 注释）。
    -->
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
`;
}

function genEnvFiles(cfg: AppConfig): { base: string; dev: string; prod: string; analyze: string } {
  const namespace = cfg.name.replace(/-web$/, '').replace(/-/g, '-');
  return {
    base: `VITE_APP_TITLE=${cfg.title}
VITE_APP_NAMESPACE=YDSZ-${namespace}
VITE_APP_VERSION=1.0.0
VITE_APP_STORE_SECURE_KEY=YDSZ-pmis-2026-secure-key
`,
    dev: `VITE_PORT=${cfg.port}
VITE_BASE=/
VITE_GLOB_API_URL=/api
VITE_DEVTOOLS=false
VITE_INJECT_APP_LOADING=true
`,
    prod: `VITE_BASE=/${cfg.name}/
VITE_GLOB_API_URL=/api
VITE_COMPRESS=gzip,brotli
VITE_PWA=false
VITE_ROUTER_HISTORY=history
VITE_INJECT_APP_LOADING=true
VITE_ARCHIVER=true
`,
    analyze: `VITE_BASE=/
VITE_GLOB_API_URL=/api
VITE_VISUALIZER=true
`,
  };
}

function genPostcss(): string {
  return `export { default } from '@ydsz/tailwind-config/postcss';\n`;
}

function genTailwind(): string {
  return `export { default } from '@ydsz/tailwind-config';\n`;
}

function genMainTs(cfg: AppConfig): string {
  return `import { createSubApp } from '@ydsz/shared-auth';

import '@ydsz/styles';
import '@ydsz/styles/ele';

import { initComponentAdapter } from './adapter/component';
import { initSetupYDSZForm } from './adapter/form';
import RootApp from './app.vue';
import { setupI18n } from './locales';
import { overridesPreferences } from './preferences';
import { createRouterGuard, initRoutes } from './router/guard';
import { routes } from './router/routes';

/**
 * ${cfg.title} 子应用入口。
 *
 * 导出 micro-kernel 需要的标准生命周期：{ bootstrap, mount, unmount, update }。
 * micro-kernel 通过动态 import 加载此入口并调用 lifecycle 方法。
 *
 * @path apps/${cfg.name}/src/main.ts
 * @since 1.0.0
 */
export const { bootstrap, mount, unmount, update } = createSubApp({
  appName: '${cfg.name}',
  basename: '${cfg.routePrefix}',
  routes,
  rootComponent: RootApp,
  preferencesOverrides: overridesPreferences,
  initRoutes,
  guard: createRouterGuard,
  async onSetup(app) {
    await initComponentAdapter();
    /** 初始化 YDSZ 表单适配器（绑定组件类型映射与校验规则）。 */
    await initSetupYDSZForm();
    await setupI18n(app);
  },
});
`;
}

function genAppVue(): string {
  return `<script lang="ts" setup>
import { ToastProvider } from '@ydsz/notification';

defineOptions({ name: 'App' });
</script>

<template>
  <ToastProvider />
  <RouterView />
</template>
`;
}

function genPreferencesTs(cfg: AppConfig): string {
  return `import { defineOverridesPreferences } from '@ydsz/preferences';

/**
 * ${cfg.title} 子应用偏好覆盖。
 *
 * 子应用作为内容区嵌入基座，隐藏侧边栏，固定主题。
 *
 * @path apps/${cfg.name}/src/preferences.ts
 * @since 1.0.0
 */
export const overridesPreferences = defineOverridesPreferences({
  app: {
    name: import.meta.env.VITE_APP_TITLE,
    defaultHomePath: '${cfg.routePrefix}/dashboard',
  },
  theme: {
    mode: 'light',
    builtinType: 'deep-blue',
    colorPrimary: 'hsl(211 98% 52%)',
  },
  sidebar: {
    hidden: true,
  },
});
`;
}

function genAdapterComponent(): string {
  return `export {
  initComponentAdapter,
  type ComponentType,
} from '@ydsz/shared-business';
`;
}

function genAdapterForm(cfg: AppConfig): string {
  return `import { createSetupYDSZForm } from '@ydsz/shared-auth';

import type { ComponentType } from './component';

/**
 * 表单适配器：绑定组件类型映射与全局校验规则。
 *
 * @path apps/${cfg.name}/src/adapter/form.ts
 * @since 1.0.0
 */
export const { useYDSZForm, z, YDSZFormSchema } = createSetupYDSZForm<ComponentType>();

export async function initSetupYDSZForm(): Promise<void> {
  // 组件类型映射与校验规则已在 createSetupYDSZForm 中完成
}
`;
}

function genApiRequest(): string {
  return `export {
  baseRequestClient,
  initSharedRequest,
  requestClient,
} from '@ydsz/shared-auth';
`;
}

function genApiIndex(): string {
  return `export * from './core';
export { requestClient, baseRequestClient } from './request';
`;
}

function genApiCoreIndex(): string {
  return `export * from '@ydsz/shared-auth/auth-api';
`;
}

function genStoreAuth(): string {
  return `export { createSharedAuthStore } from '@ydsz/shared-auth';

export const useAuthStore = createSharedAuthStore();
`;
}

function genStoreIndex(): string {
  return `export * from './auth';
`;
}

function genRouterGuard(cfg: AppConfig): string {
  return `import type { Router } from 'vue-router';

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

function genRouterIndex(): string {
  return `import type { RouteRecordRaw } from 'vue-router';

import { createRouter, createWebHistory } from 'vue-router';

import { createRouterGuard, initRoutes } from './guard';
import { routes } from './routes';

const router = createRouter({
  history: createWebHistory(import.meta.env.VITE_BASE),
  routes: routes as RouteRecordRaw[],
  scrollBehavior: () => ({ left: 0, top: 0 }),
});

initRoutes(router);
createRouterGuard(router);

export { router };
`;
}

function genRoutesIndex(): string {
  return `import type { RouteRecordRaw } from 'vue-router';

import { mergeRouteModules } from '@ydsz/utils';

import { coreRoutes, fallbackNotFoundRoute } from './core';

const modules = import.meta.glob('./modules/**/*.ts', { eager: true }) as Record<
  string,
  { default: RouteRecordRaw[] }
>;

const dynamicRoutes = mergeRouteModules(modules);

export const accessRoutes = [...coreRoutes, ...dynamicRoutes];

export const routes = [...accessRoutes, fallbackNotFoundRoute];
`;
}

function genRoutesCore(cfg: AppConfig): string {
  return `import type { RouteRecordRaw } from 'vue-router';

import DashboardView from '#/views/dashboard/index.vue';
import FallbackNotFound from '#/views/fallback/not-found.vue';

export const coreRoutes: RouteRecordRaw[] = [
  {
    component: DashboardView,
    meta: { skeletonType: '${cfg.skeletonType}', title: '${cfg.title}' },
    name: '${cfg.name.replace(/-web$/, '').replace(/-/g, '')}Dashboard',
    path: '${cfg.routePrefix}',
    redirect: '${cfg.redirect}',
  },
  {
    component: DashboardView,
    meta: { skeletonType: '${cfg.skeletonType}', title: '${cfg.title}' },
    name: '${cfg.name.replace(/-web$/, '').replace(/-/g, '')}Home',
    path: '${cfg.routePrefix}/dashboard',
  },
];

export const fallbackNotFoundRoute: RouteRecordRaw = {
  component: FallbackNotFound,
  meta: { hideInMenu: true, title: 'Fallback' },
  name: 'FallbackNotFound',
  path: '/:pathMatch(.*)*',
};
`;
}

function genLocalesIndex(): string {
  return `/**
 * 国际化配置入口 — 通过 @ydsz/shared-auth 的 createSubAppI18n 工厂装配。
 *
 * @path apps/@app@/src/locales/index.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import { createSubAppI18n } from '@ydsz/shared-auth';

const modules = import.meta.glob('./langs/**/*.json');

export const { $t, elementLocale, setupI18n } = createSubAppI18n({ modules });
`;
}

function genLocalePage(title: string): string {
  return JSON.stringify({ page: { title, welcome: `${title} — 欢迎使用`, description: '子应用模板，开始开发！' } }, null, 2) + '\n';
}

function genDashboardVue(cfg: AppConfig): string {
  const componentName = cfg.name.replace(/-web$/, '').replace(/-/g, '_');
  return `<script lang="ts" setup>
import { computed } from 'vue';

defineOptions({ name: '${componentName}_dashboard' });

const appName = computed(() => '${cfg.name}');
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-8">
    <div class="mx-auto max-w-4xl">
      <!-- 顶部欢迎卡片 -->
      <div class="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <div class="flex items-center gap-4">
          <div class="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
            <span class="text-2xl font-bold text-blue-600">{{ appName.charAt(0).toUpperCase() }}</span>
          </div>
          <div>
            <h1 class="text-2xl font-bold text-slate-800">{{ $t('page.welcome') || '${cfg.title}' }}</h1>
            <p class="mt-1 text-sm text-slate-500">{{ $t('page.description') || '子应用模板' }}</p>
          </div>
        </div>
      </div>

      <!-- 信息卡片 -->
      <div class="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div class="rounded-lg border border-slate-200 bg-white p-5">
          <p class="text-xs font-medium uppercase tracking-wide text-slate-400">应用名</p>
          <p class="mt-1 text-lg font-semibold text-slate-700">{{ appName }}</p>
        </div>
        <div class="rounded-lg border border-slate-200 bg-white p-5">
          <p class="text-xs font-medium uppercase tracking-wide text-slate-400">路由前缀</p>
          <p class="mt-1 text-lg font-semibold text-slate-700">${cfg.routePrefix}</p>
        </div>
        <div class="rounded-lg border border-slate-200 bg-white p-5">
          <p class="text-xs font-medium uppercase tracking-wide text-slate-400">开发端口</p>
          <p class="mt-1 text-lg font-semibold text-slate-700">${cfg.port}</p>
        </div>
      </div>

      <!-- 下一步提示 -->
      <div class="mt-6 rounded-lg border border-blue-100 bg-blue-50 p-5">
        <h3 class="text-sm font-semibold text-blue-800">下一步</h3>
        <ul class="mt-2 list-inside list-disc space-y-1 text-sm text-blue-700">
          <li>在 src/router/routes/modules/ 下定义子路由</li>
          <li>在 src/api/ 中声明 API 调用</li>
          <li>在 src/views/ 中创建页面组件</li>
          <li>运行 <code class="rounded bg-blue-100 px-1.5 py-0.5 text-xs font-mono">pnpm dev:${cfg.name.replace(/-web$/, '')}</code> 启动开发</li>
        </ul>
      </div>
    </div>
  </div>
</template>
`;
}

function genNotFoundVue(): string {
  return `<script lang="ts" setup>
defineOptions({ name: 'FallbackNotFound' });
</script>

<template>
  <div class="flex h-full items-center justify-center">
    <span class="text-lg text-slate-500">页面不存在</span>
  </div>
</template>
`;
}

// ==================== MICRO_APPS 自动注册 ====================

function registerMicroApp(cfg: AppConfig): void {
  if (!fs.existsSync(MICRO_APPS_FILE)) {
    console.warn(`  ⚠️  MICRO_APPS 文件不存在：${MICRO_APPS_FILE}`);
    console.warn('     跳过自动注册，请手动添加。');
    return;
  }

  let content = fs.readFileSync(MICRO_APPS_FILE, 'utf-8');

  // 检查是否已存在
  if (content.includes(`name: '${cfg.name}'`)) {
    console.warn(`  ⚠️  ${cfg.name} 已在 MICRO_APPS 中，跳过。`);
    return;
  }

  // 构造新条目
  const newEntry = `  {
    name: '${cfg.name}',
    packageName: '@ydsz/${cfg.name}',
    activeRule: '${cfg.routePrefix}',
    redirect: '${cfg.redirect}',
    title: '${cfg.title}',
    icon: '${cfg.icon}',
    order: ${cfg.order},
    devPort: ${cfg.port},
    skeletonType: '${cfg.skeletonType}',
  },`;

  // 在最后一个 entry 后、数组闭合 ]; 前插入
  // 找到 ]; 位置
  const arrayStart = content.indexOf('export const MICRO_APPS');
  if (arrayStart === -1) {
    console.warn('  ⚠️  未找到 MICRO_APPS 导出，跳过自动注册。');
    return;
  }

  const closeBracket = content.indexOf('];', arrayStart);
  if (closeBracket === -1) {
    console.warn('  ⚠️  MICRO_APPS 数组格式异常，跳过自动注册。');
    return;
  }

  // 在 ]; 之前插入新条目（带缩进对齐）
  const before = content.slice(0, closeBracket);
  const after = content.slice(closeBracket);

  // 确保前一行有逗号
  const trimmed = before.replace(/,\s*$/, '');
  const needsComma = !trimmed.endsWith(',');

  const updated = trimmed + (needsComma ? ',' : '') + '\n' + newEntry + '\n' + after;

  fs.writeFileSync(MICRO_APPS_FILE, updated, 'utf-8');
  console.info(`  ✓ MICRO_APPS 自动注册完成`);
}

// ==================== nginx 配置自动更新 ====================

function addNginxLocation(cfg: AppConfig): void {
  // 直接调用已有的 gen-nginx-conf.mts，保证生成逻辑统一
  try {
    execSync('node ./bash/gen-nginx-conf.mts', {
      cwd: root,
      stdio: 'inherit',
    });
    console.info('  ✓ nginx 子应用配置已自动生成');
  } catch {
    console.warn('  ⚠️  nginx 配置生成失败，请手动运行：pnpm run gen:nginx');
  }
}

// ==================== 根 package.json dev 脚本 ====================

function addRootDevScript(cfg: AppConfig): void {
  if (!fs.existsSync(ROOT_PKG_FILE)) {
    return;
  }

  const pkg = JSON.parse(fs.readFileSync(ROOT_PKG_FILE, 'utf-8'));
  const shortName = cfg.name.replace(/-web$/, '');
  const scriptKey = `dev:${shortName}`;

  if (!pkg.scripts) pkg.scripts = {};
  if (pkg.scripts[scriptKey]) {
    console.info(`  ⚠️  根 package.json 已有 ${scriptKey}，跳过`);
    return;
  }

  // 找到 dev:* 脚本的最后一个位置插入，保持连贯
  const scriptKeys = Object.keys(pkg.scripts);
  const devScriptIndices = scriptKeys
    .map((k, i) => ({ k, i }))
    .filter(({ k }) => k.startsWith('dev:'))
    .map(({ i }) => i);

  let insertIndex: number;
  if (devScriptIndices.length > 0) {
    insertIndex = devScriptIndices[devScriptIndices.length - 1] + 1;
  } else {
    // 没有 dev:* 脚本时，放在 dev 脚本后
    const devIndex = scriptKeys.indexOf('dev');
    insertIndex = devIndex >= 0 ? devIndex + 1 : scriptKeys.length;
  }

  // 重建 scripts 对象，在指定位置插入
  const newScripts: Record<string, string> = {};
  let inserted = false;
  for (let i = 0; i < scriptKeys.length; i++) {
    if (i === insertIndex && !inserted) {
      newScripts[scriptKey] = `pnpm -F @ydsz/${cfg.name} run dev`;
      inserted = true;
    }
    newScripts[scriptKeys[i]] = pkg.scripts[scriptKeys[i]];
  }
  if (!inserted) {
    newScripts[scriptKey] = `pnpm -F @ydsz/${cfg.name} run dev`;
  }

  pkg.scripts = newScripts;
  fs.writeFileSync(ROOT_PKG_FILE, JSON.stringify(pkg, null, 2) + '\n', 'utf-8');
  console.info(`  ✓ 根 package.json 新增脚本：${scriptKey}`);
}

// ==================== 主流程 ====================

async function main(): Promise<void> {
  // 扫描现有应用
  scanExistingApps();

  // 解析参数（交互或命令行）
  const cfg = await resolveArgs();

  const appDir = path.join(root, 'apps', cfg.name);

  // 再次检查是否已存在（交互式模式下已校验过）
  if (fs.existsSync(appDir)) {
    console.error(`应用 ${cfg.name} 已存在于 apps/${cfg.name}/`);
    process.exit(1);
  }

  console.info(`[GenApp] 开始生成子应用: ${cfg.name}`);
  console.info(`[GenApp] 标题: ${cfg.title}`);
  console.info(`[GenApp] 路由前缀: ${cfg.routePrefix}`);
  console.info(`[GenApp] 端口: ${cfg.port}`);
  console.info(`[GenApp] 图标: ${cfg.icon}`);
  console.info(`[GenApp] 骨架屏: ${cfg.skeletonType}\n`);

  // 1. 创建目录结构
  ensureDirs(appDir);
  console.info('[GenApp] 目录结构已创建');

  // 2. 生成所有文件
  fs.writeFileSync(path.join(appDir, 'package.json'), genPackageJson(cfg));
  fs.writeFileSync(path.join(appDir, 'vite.config.mts'), genViteConfig(cfg));
  fs.writeFileSync(path.join(appDir, 'tsconfig.json'), genTsconfig());
  fs.writeFileSync(path.join(appDir, 'index.html'), genIndexHtml(cfg));

  const envFiles = genEnvFiles(cfg);
  fs.writeFileSync(path.join(appDir, '.env'), envFiles.base);
  fs.writeFileSync(path.join(appDir, '.env.development'), envFiles.dev);
  fs.writeFileSync(path.join(appDir, '.env.production'), envFiles.prod);
  fs.writeFileSync(path.join(appDir, '.env.analyze'), envFiles.analyze);

  fs.writeFileSync(path.join(appDir, 'postcss.config.mjs'), genPostcss());
  fs.writeFileSync(path.join(appDir, 'tailwind.config.mjs'), genTailwind());

  fs.writeFileSync(path.join(appDir, 'src', 'main.ts'), genMainTs(cfg));
  fs.writeFileSync(path.join(appDir, 'src', 'app.vue'), genAppVue());
  fs.writeFileSync(path.join(appDir, 'src', 'preferences.ts'), genPreferencesTs(cfg));

  fs.writeFileSync(path.join(appDir, 'src', 'adapter', 'component', 'index.ts'), genAdapterComponent());
  fs.writeFileSync(path.join(appDir, 'src', 'adapter', 'form.ts'), genAdapterForm(cfg));

  fs.writeFileSync(path.join(appDir, 'src', 'api', 'request.ts'), genApiRequest());
  fs.writeFileSync(path.join(appDir, 'src', 'api', 'index.ts'), genApiIndex());
  fs.writeFileSync(path.join(appDir, 'src', 'api', 'core', 'index.ts'), genApiCoreIndex());

  fs.writeFileSync(path.join(appDir, 'src', 'store', 'auth.ts'), genStoreAuth());
  fs.writeFileSync(path.join(appDir, 'src', 'store', 'index.ts'), genStoreIndex());

  fs.writeFileSync(path.join(appDir, 'src', 'router', 'guard.ts'), genRouterGuard(cfg));
  fs.writeFileSync(path.join(appDir, 'src', 'router', 'index.ts'), genRouterIndex());
  fs.writeFileSync(path.join(appDir, 'src', 'router', 'routes', 'index.ts'), genRoutesIndex());
  fs.writeFileSync(path.join(appDir, 'src', 'router', 'routes', 'core.ts'), genRoutesCore(cfg));

  fs.writeFileSync(path.join(appDir, 'src', 'locales', 'index.ts'), genLocalesIndex());
  fs.writeFileSync(path.join(appDir, 'src', 'locales', 'langs', 'zh-CN', 'page.json'), genLocalePage(cfg.title));
  fs.writeFileSync(path.join(appDir, 'src', 'locales', 'langs', 'en-US', 'page.json'), genLocalePage(cfg.title));

  fs.writeFileSync(path.join(appDir, 'src', 'views', 'dashboard', 'index.vue'), genDashboardVue(cfg));
  fs.writeFileSync(path.join(appDir, 'src', 'views', 'fallback', 'not-found.vue'), genNotFoundVue());

  console.info('[GenApp] 所有源文件已生成\n');

  // 3. 自动注册
  console.info('[GenApp] 开始自动注册...');
  registerMicroApp(cfg);
  addNginxLocation(cfg);
  addRootDevScript(cfg);

  // 4. 生成总结
  console.info(`
✅ 子应用 '${cfg.name}' 生成成功！

┌─────────────────────────────────────────────────────────────────┐
│  📦  应用信息                                                      │
├─────────────────────────────────────────────────────────────────┤
│  应用名:    ${cfg.name.padEnd(45)}│
│  标  题:    ${cfg.title.padEnd(45)}│
│  路由前缀:  ${cfg.routePrefix.padEnd(45)}│
│  端  口:    ${String(cfg.port).padEnd(45)}│
│  包  名:    ${`@ydsz/${cfg.name}`.padEnd(45)}│
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  🚀 下一步                                                       │
├─────────────────────────────────────────────────────────────────┤
│  1. pnpm --filter=@ydsz/${cfg.name} dev                          │
│  2. 打开浏览器访问 http://localhost:${cfg.port}${cfg.routePrefix}/dashboard    │
│  3. MICRO_APPS 注册: ✓ 已自动完成                                  │
│  4. nginx 配置:   ✓ 已自动生成                                     │
│  5. 根 dev 脚本:  ✓ 已新增 dev:${cfg.name.replace(/-web$/, '')}                  │
└─────────────────────────────────────────────────────────────────┘

📂 目录结构:
  apps/${cfg.name}/
  ├── package.json
  ├── vite.config.mts
  ├── tsconfig.json
  ├── index.html
  ├── .env / .env.development / .env.production / .env.analyze
  ├── postcss.config.mjs
  ├── tailwind.config.mjs
  └── src/
      ├── main.ts
      ├── app.vue
      ├── preferences.ts
      ├── adapter/
      │   ├── component/index.ts
      │   └── form.ts
      ├── api/
      │   ├── index.ts
      │   ├── request.ts
      │   └── core/index.ts
      ├── store/
      │   ├── index.ts
      │   └── auth.ts
      ├── router/
      │   ├── index.ts
      │   ├── guard.ts
      │   └── routes/
      │       ├── index.ts
      │       └── core.ts
      ├── locales/
      │   ├── index.ts
      │   └── langs/
      │       ├── zh-CN/page.json
      │       └── en-US/page.json
      └── views/
          ├── dashboard/index.vue
          └── fallback/not-found.vue
`);
}

main().catch((err: unknown) => {
  console.error('执行失败：', err);
  process.exit(1);
});
