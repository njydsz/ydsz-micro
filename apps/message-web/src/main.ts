/**
 * 应用入口文件 — 使用 createSubApp 工厂标准化生命周期
 *
 * @path apps\message-web\src\main.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import { createSubApp } from '@ydsz/shared-auth';
import '@ydsz/styles';
import '@ydsz/styles/ele';

import { initComponentAdapter } from './adapter/component';
import { initSetupYDSZForm } from './adapter/form';
import RootApp from './app.vue';
import { setupI18n } from './locales';
import { overridesPreferences } from './preferences';
import { createRouterGuard, initRoutes } from './router/guard';
import { routes } from './router/routes';

export const { bootstrap, mount, unmount, update } = createSubApp({
  appName: 'message-web',
  basename: '/YDSZ-msg',
  routes,
  rootComponent: RootApp,
  preferencesOverrides: overridesPreferences,
  initRoutes,
  guard: createRouterGuard,
  async onSetup(app) {
    // MSW Mock Server（开发环境且启用 Mock 时启动）
    if (import.meta.env.DEV && import.meta.env.VITE_USE_MOCK === 'true') {
      const { initMessageMockServer } = await import('./mock');
      await initMessageMockServer();
    }

    await initComponentAdapter();
    await initSetupYDSZForm();
    await setupI18n(app);
  },
});
