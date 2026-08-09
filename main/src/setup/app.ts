/**
 * Vue 应用装配模块
 *
 * 负责 createApp、全局指令注册（loading/access/safe-html/watermark/tippy）、
 * i18n、Pinia、路由守卫、动效插件、页面标题同步。
 *
 * 从 bootstrap.ts 拆出（原 v3.0 逻辑），保持行为不变。
 *
 * @path main/src/setup/app.ts
 * @author ydsz-team
 * @since 4.1.0
 */
import { createApp, watchEffect } from "vue";

import { registerAccessDirective } from "@ydsz/access";
import { registerLoadingDirective } from "@ydsz/common-ui/es/loading";
import { registerSafeHtmlDirective } from "@ydsz/common-ui/es/safe-html";
import { registerWatermarkDirective } from "@ydsz/common-ui/es/watermark";
import { preferences } from "@ydsz/preferences";
import { initStores } from "@ydsz/stores";
import "@ydsz/styles";
import "@ydsz/styles/ele";

import { useTitle } from "@vueuse/core";
import { ElLoading } from "element-plus";

import { initComponentAdapter } from "#/adapter/component";
import { initSetupYDSZForm } from "#/adapter/form";
import App from "#/app.vue";
import { $t, setupI18n } from "#/locales";
import { initRouterGuard, router } from "#/router";

/**
 * 创建并装配 Vue 应用（指令/i18n/Pinia/路由/动效/标题）。
 * 返回已装配但未 mount 的 app 实例，由 bootstrap 负责挂载。
 */
export async function setupApp(namespace: string) {
  // 组件/表单适配器（在 createApp 前完成，保证业务组件可用）
  await initComponentAdapter();
  await initSetupYDSZForm();

  const app = createApp(App);

  // v-loading 指令：使用 Element Plus 官方指令（YDSZ 自定义指令关闭）
  app.directive("loading", ElLoading.directive);
  registerLoadingDirective(app, {
    loading: false, // YDSZ提供的v-loading指令和Element Plus提供的v-loading指令二选一即可，此处false表示不注册YDSZ提供的v-loading指令
    spinning: "spinning",
  });

  await setupI18n(app);
  await initStores(app, { namespace });

  // 在 Pinia 初始化之后才创建路由守卫
  initRouterGuard();

  registerAccessDirective(app);

  // v-safe-html — XSS 防护指令
  registerSafeHtmlDirective(app);

  // v-watermark — 敏感页面水印指令
  registerWatermarkDirective(app);

  const { initTippy } = await import("@ydsz/common-ui/es/tippy");
  initTippy(app);

  app.use(router);

  const { MotionPlugin } = await import("@ydsz/plugins/motion");
  app.use(MotionPlugin);

  // 页面标题动态同步（依赖路由 meta.title 与偏好设置）
  watchEffect(() => {
    if (preferences.app.dynamicTitle) {
      const routeTitle = router.currentRoute.value.meta?.title;
      const pageTitle =
        (routeTitle ? `${$t(routeTitle as string)} - ` : "") +
        preferences.app.name;
      useTitle(pageTitle);
    }
  });

  return app;
}
