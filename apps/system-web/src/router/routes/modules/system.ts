/**
 * 系统管理路由模块 — 定义系统配置、字典管理、变量管理、应用注册、租户管理、审计日志、配置版本等子路由
 *
 * @path apps\system-web\src\router\routes\modules\system.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'lucide:settings',
      order: 1,
      title: '系统管理',
    },
    name: 'System',
    path: '/system',
    children: [
      {
        name: 'ConfigManagement',
        path: 'config',
        component: () => import('#/views/config/index.vue'),
        meta: { icon: 'lucide:sliders-horizontal', title: '系统配置' },
      },
      {
        name: 'DictTypeManagement',
        path: 'dict-type',
        component: () => import('#/views/dict-type/index.vue'),
        meta: { icon: 'lucide:book-open', title: '字典类型' },
      },
      {
        name: 'DictItemManagement',
        path: 'dict-item',
        component: () => import('#/views/dict-item/index.vue'),
        meta: { icon: 'lucide:list', title: '字典项' },
      },
      {
        name: 'VariableManagement',
        path: 'variable',
        component: () => import('#/views/variable/index.vue'),
        meta: { icon: 'lucide:variable', title: '系统变量' },
      },
      {
        name: 'AppManagement',
        path: 'app',
        component: () => import('#/views/app/index.vue'),
        meta: { icon: 'lucide:app-window', title: '应用注册' },
      },
    ],
  },
  {
    meta: {
      icon: 'lucide:building',
      order: 2,
      title: '租户管理',
    },
    name: 'Tenant',
    path: '/tenant',
    children: [
      {
        name: 'TenantManagement',
        path: 'list',
        component: () => import('#/views/tenant/index.vue'),
        meta: { icon: 'lucide:building', title: '租户列表' },
      },
    ],
  },
  {
    meta: {
      icon: 'lucide:file-text',
      order: 3,
      title: '审计日志',
    },
    name: 'Audit',
    path: '/audit',
    children: [
      {
        name: 'AuditLogManagement',
        path: 'log',
        component: () => import('#/views/audit/index.vue'),
        meta: { icon: 'lucide:file-text', title: '审计日志' },
      },
    ],
  },
  {
    meta: {
      icon: 'lucide:history',
      order: 4,
      title: '配置版本',
    },
    name: 'ConfigVersion',
    path: '/config-version',
    children: [
      {
        name: 'ConfigVersionManagement',
        path: 'list',
        component: () => import('#/views/config-version/index.vue'),
        meta: { icon: 'lucide:history', title: '配置版本管理' },
      },
    ],
  },
];

export default routes;
