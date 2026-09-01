/**
 * 子应用路由自动生成 —— 从注册表 MICRO_APPS 批量生成 catch-all 路由，新增应用零路由改动
 *
 * v3.3: 透传 skeletonType 到 catch-all 路由 meta，供 SubAppContainer 读取。
 *
 * @path main\src\router\routes\modules\subapps.ts
 * @author ydsz-team
 * @since 1.0.0
 */

import type { RouteRecordRaw } from 'vue-router';

// v4.4.1 A3: 注册表迁至 @ydsz/constants（运行时单源），不再依赖构建配置包
import { MICRO_APPS } from '@ydsz/constants';

const SubAppContainer = () => import('#/views/_core/subapp/index.vue');

/**
 * 子应用路由：从注册表 MICRO_APPS 自动生成。
 *
 * 每条路由包含一个 catch-all 子路由（`:path(.*)*`），
 * 用于渲染微前端容器组件，被子应用内部路由接管。
 *
 * skeletonType 透传：注册表 → catch-all 子路由 meta.skeletonType，
 * SubAppContainer 据此渲染对应骨架屏（fallback 到 'default'）。
 */
const routes: RouteRecordRaw[] = MICRO_APPS.map((app) => ({
  meta: {
    icon: app.icon,
    order: app.order,
    title: app.title,
  },
  name: `${app.name.replace('-web', '')}App`,
  path: app.activeRule,
  redirect: app.redirect,
  children: [
    {
      name: `${app.name.replace(/-/g, '')}Catch`,
      path: ':path(.*)*',
      component: SubAppContainer,
      meta: {
        activePath: app.activeRule,
        title: app.title,
        hideInMenu: true,
        hideInTab: true,
        skeletonType: app.skeletonType,
      },
    },
  ],
}));

/** Subapps 子应用路由配置（子应用内部路由表） */
export default routes;
