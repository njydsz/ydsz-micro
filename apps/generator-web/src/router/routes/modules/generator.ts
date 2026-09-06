/**
 * 代码生成器路由模块 — 定义表元数据、代码生成、数据源、模板、历史、导入导出等子路由。
 *
 * @path apps/generator-web/src/router/routes/modules/generator.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'lucide:database',
      order: 1,
      title: '表元数据',
    },
    name: 'TableMetaMgmt',
    path: '/table-meta',
    children: [
      {
        name: 'TableMetaManagement',
        path: 'list',
        component: () => import('#/views/table-meta/index.vue'),
        meta: { icon: 'lucide:table', title: '表元数据' },
      },
    ],
  },
  {
    meta: {
      icon: 'lucide:code',
      order: 2,
      title: '代码生成',
    },
    name: 'CodeGenMgmt',
    path: '/code-gen',
    children: [
      {
        name: 'CodeGenManagement',
        path: 'index',
        component: () => import('#/views/code-gen/index.vue'),
        meta: { icon: 'lucide:code', title: '代码生成' },
      },
    ],
  },
  {
    meta: {
      icon: 'lucide:database',
      order: 3,
      title: '数据源管理',
    },
    name: 'DatasourceMgmt',
    path: '/datasource',
    children: [
      {
        name: 'DatasourceManagement',
        path: 'list',
        component: () => import('#/views/datasource/index.vue'),
        meta: { icon: 'lucide:database', title: '数据源管理' },
      },
    ],
  },
  {
    meta: {
      icon: 'lucide:file-code',
      order: 4,
      title: '模板管理',
    },
    name: 'TemplateMgmt',
    path: '/template',
    children: [
      {
        name: 'TemplateManagement',
        path: 'list',
        component: () => import('#/views/template/index.vue'),
        meta: { icon: 'lucide:file-code', title: '模板管理' },
      },
    ],
  },
  {
    meta: {
      icon: 'lucide:history',
      order: 5,
      title: '生成历史',
    },
    name: 'HistoryMgmt',
    path: '/history',
    children: [
      {
        name: 'HistoryManagement',
        path: 'list',
        component: () => import('#/views/history/index.vue'),
        meta: { icon: 'lucide:history', title: '生成历史' },
      },
    ],
  },
  {
    meta: {
      icon: 'lucide:import',
      order: 6,
      title: '导入导出',
    },
    name: 'ImportExportMgmt',
    path: '/import-export',
    children: [
      {
        name: 'ImportExportManagement',
        path: 'index',
        component: () => import('#/views/import-export/index.vue'),
        meta: { icon: 'lucide:import', title: '导入导出' },
      },
    ],
  },
];

/** Generator 代码生成器路由配置（子应用内部路由表） */
export default routes;
