import { createSubApp } from '@ydsz/shared-auth';

import '@ydsz/styles';
import '@ydsz/styles/ele';

import { initComponentAdapter } from './adapter/component';
import { initGeneratorFormAdapter } from './adapter/form';
import RootApp from './app.vue';
import { setupI18n } from './locales';
import { overridesPreferences } from './preferences';
import { createRouterGuard, initRoutes } from './router/guard';
import { routes } from './router/routes';

/**
 * 代码生成器子应用入口。
 *
 * 导出 micro-kernel 需要的标准生命周期：{ bootstrap, mount, unmount, update }。
 * micro-kernel 通过动态 import 加载此入口并调用 lifecycle 方法。
 *
 * @path apps/generator-web/src/main.ts
 * @since 1.0.0
 */
export const { bootstrap, mount, unmount, update } = createSubApp({
  appName: 'generator-web',
  basename: '/YDSZ-gen',
  routes,
  rootComponent: RootApp,
  preferencesOverrides: overridesPreferences,
  initRoutes,
  guard: createRouterGuard,
  async onSetup(app) {
    await initComponentAdapter();
    /** 初始化 YDSZ 表单适配器（绑定组件类型映射与校验规则）。 */
    await initGeneratorFormAdapter();
    await setupI18n(app);
  },
});
