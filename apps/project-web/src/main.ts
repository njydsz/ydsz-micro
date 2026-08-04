/**
 * 应用入口文件 — 使用 createSubApp 工厂标准化生命周期
 *
 * @path apps\project-web\src\main.ts
 * @author remi-team
 * @since 1.0.0
 */
import { createSubApp } from '@remi/shared-auth';
import '@remi/styles';
import '@remi/styles/ele';

import { initComponentAdapter } from './adapter/component';
import { initSetupREMIForm } from './adapter/form';
import RootApp from './app.vue';
import { setupI18n } from './locales';
import { overridesPreferences } from './preferences';
import { createRouterGuard, initRoutes } from './router/guard';
import { routes } from './router/routes';

export const { bootstrap, mount, unmount, update } = createSubApp({
  appName: 'project-web',
  basename: '/remi-proj',
  routes,
  rootComponent: RootApp,
  preferencesOverrides,
  initRoutes,
  guard: createRouterGuard,
  async onSetup(app) {
    await initComponentAdapter();
    await initSetupREMIForm();
    await setupI18n(app);
  },
});
