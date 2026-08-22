/**
 * 子应用独立运行入口 — 用于脱离主应用独立开发调试
 *
 * 通过 `pnpm dev:standalone` 启动，特点：
 * 1. 自动注入 Mock 数据层（无需后端）
 * 2. 使用独立路由（/ 而非 /YDSZ-user/）
 * 3. 跳过微前端运行时，直接 mount 应用
 * 4. 保留所有业务组件/服务层代码不变
 *
 * 启动方式：
 *   pnpm dev:standalone
 *   或在 apps/userinfo-web/ 目录下：pnpm vite --mode standalone
 *
 * @path apps/userinfo-web/src/standalone-main.ts
 * @author ydsz-team
 * @since 4.0.0
 */

import { createApp } from 'vue';

import { registerAccessDirective } from '@ydsz/access';
import { registerLoadingDirective, registerSafeHtmlDirective } from '@ydsz/common-ui';
import '@ydsz/styles';
import '@ydsz/styles/ele';
import { setupMonitor } from '@ydsz/monitor';
import { initPreferences } from '@ydsz/preferences';
import { initStores } from '@ydsz/stores';

import { ElLoading } from 'element-plus';

import RootApp from './app.vue';
import { initComponentAdapter } from './adapter/component';
import { initSetupYDSZForm } from './adapter/form';
import { setupI18n } from './locales';
import { overridesPreferences } from './preferences';
import { createRouterGuard, initRoutes } from './router/guard';
import { routes } from './router/routes';
import { createRouter, createWebHistory } from 'vue-router';

// ==================== Mock 数据注入 ====================
// standalone 模式下注入 Mock 数据，模拟后端响应
// 可通过环境变量 VITE_ENABLE_MOCK=false 禁用

async function setupMockLayer(): Promise<void> {
  if (import.meta.env.VITE_ENABLE_MOCK === 'false') return;

  try {
    const { setupMockServer } = await import('./mock/setup');
    await setupMockServer();
    // @standalone-only 独立开发模式日志，不进入生产构建
    console.info('[Standalone] Mock server started');
  } catch {
    // Mock 模块可选，未实现时不影响启动
    // @standalone-only 独立开发模式日志，不进入生产构建
    console.debug('[Standalone] No mock module found, skipping');
  }
}

// ==================== 应用启动 ====================

async function bootstrap(): Promise<void> {
  const appName = 'userinfo-web';
  const appVersion = import.meta.env.VITE_APP_VERSION || '1.0.0-dev';
  const namespace = `${appName}-${appVersion}-standalone`;

  // 初始化偏好设置
  await initPreferences({
    namespace,
    overrides: {
      ...overridesPreferences,
      app: {
        ...(overridesPreferences?.app as object),
        isMobile: false,
      },
      sidebar: {
        hidden: true,
      },
    },
  });

  // 创建 Vue 应用
  const vueApp = createApp(RootApp);

  // 安装监控
  setupMonitor(vueApp, {
    release: appVersion,
    environment: 'standalone',
  });

  // 安装指令
  vueApp.directive('loading', ElLoading.directive);
  registerLoadingDirective(vueApp, {
    loading: false,
    spinning: 'spinning',
  });
  registerAccessDirective(vueApp);
  registerSafeHtmlDirective(vueApp);

  // 安装 Tippy
  try {
    const { initTippy } = await import('@ydsz/common-ui/es/tippy');
    initTippy(vueApp);
  } catch {
    // 静默
  }

  // 安装 Motion
  try {
    const { MotionPlugin } = await import('@ydsz/plugins/motion');
    vueApp.use(MotionPlugin);
  } catch {
    // 静默
  }

  // 配置路由
  const router = createRouter({
    history: createWebHistory('/'),
    routes,
    scrollBehavior: (to, _from, savedPosition) => {
      if (savedPosition) return savedPosition;
      return to.hash ? { behavior: 'smooth', el: to.hash } : { left: 0, top: 0 };
    },
  });

  vueApp.use(router);

  // 初始化 Store
  await initStores(vueApp, { namespace });

  // 运行自定义 setup
  await initComponentAdapter();
  await initSetupYDSZForm();
  await setupI18n(vueApp);

  // 初始化动态路由
  if (initRoutes) {
    initRoutes(router);
  }

  // 注册路由守卫
  createRouterGuard(router);

  // 设置 Mock 层
  await setupMockLayer();

  // 挂载应用
  vueApp.mount('#app');

  // @standalone-only 独立开发模式日志，不进入生产构建
  console.info(`[Standalone] ${appName} started in standalone mode`);
}

// 启动
bootstrap().catch((err) => {
  console.error('[Standalone] Failed to start:', err);
});
