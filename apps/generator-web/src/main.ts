/**
 * 代码生成器子应用入口（应用启动与生命周期装配）。
 *
 * <p>按 micro-kernel 微前端约定，导出 { bootstrap, mount, unmount, update } 四个钩子。
 * <p>通过 createSubApp 工厂装配路由、偏好、组件适配器、国际化等能力。
 *
 * @path apps/generator-web/src/main.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import { createSubApp } from '@ydsz/shared-auth';

import '@ydsz/styles';


import { initComponentAdapter } from './adapter/component';
import { initGeneratorFormAdapter } from './adapter/form';
import RootApp from './app.vue';
import { setupI18n } from './locales';
import { overridesPreferences } from './preferences';
import { createRouterGuard, initRoutes } from './router/guard';
import { routes } from './router/routes';

/**
 * micro-kernel 需要的标准生命周期导出（由框架动态 import 后调用）。
 */
export const { bootstrap, mount, unmount, update } = createSubApp({
    appName: 'generator-web',
    basename: '/ydsz-gen',
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
