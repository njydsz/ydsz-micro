/**
 * 操作审计路由 —— 定义审计日志列表页路由，归类到"运营"类目
 *
 * <p>路径 /audit 归类于"运营"（Operations）类目下。
 *
 * @path main\src\router\routes\modules\audit.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import type { RouteRecordRaw } from 'vue-router';

import { $t } from '#/locales';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'lucide:shield-check',
      order: 80,
      title: $t('page.operations'),
    },
    name: 'Operations',
    path: '/operations',
    children: [
      {
        name: 'AuditLogs',
        path: 'audit',
        component: () => import('#/views/audit/index.vue'),
        meta: {
          icon: 'lucide:scroll-text',
          keepAlive: true,
          title: $t('page.audit.title'),
        },
      },
    ],
  },
];

/** 操作审计路由配置 */
export default routes;
