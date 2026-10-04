/**
 * 仪表盘路由 —— 定义 analytics（分析页）与 workspace（工作台）子路由
 *
 * @path main\src\router\routes\modules\dashboard.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import type { RouteRecordRaw } from 'vue-router';

import { $t } from '#/locales';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'lucide:layout-dashboard',
      order: -1,
      title: $t('page.dashboard.title'),
    },
    name: 'Dashboard',
    path: '/dashboard',
    children: [
      {
        name: 'Analytics',
        path: 'analytics',
        component: () => import('#/views/dashboard/analytics/index.vue'),
        meta: {
          affixTab: true,
          icon: 'lucide:area-chart',
          ignoreAccess: true,
          title: $t('page.dashboard.analytics'),
        },
      },
      {
        name: 'Workspace',
        path: 'workspace',
        component: () => import('#/views/dashboard/workspace/index.vue'),
        meta: {
          icon: 'carbon:workspace',
          ignoreAccess: true,
          title: $t('page.dashboard.workspace'),
        },
      },
      {
        name: 'Notifications',
        path: 'notifications',
        component: () => import('#/views/notifications/index.vue'),
        meta: {
          icon: 'lucide:bell',
          ignoreAccess: true,
          hideInMenu: false,
          title: $t('page.dashboard.notifications'),
        },
      },
      {
        name: 'Performance',
        path: 'performance',
        component: () => import('#/views/dashboard/performance/index.vue'),
        meta: {
          icon: 'lucide:gauge',
          ignoreAccess: true,
          title: $t('page.dashboard.performance'),
        },
      },
    ],
  },
];

/** Dashboard 仪表盘路由配置（子应用内部路由表） */
export default routes;
