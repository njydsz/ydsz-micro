/**
 * 规则引擎业务路由配置
 * <p>定义规则管理、CEP、DSL、断点调试、审计日志等业务页面的路由表。
 *
 * @path apps\literule-web\src\router\routes\modules\literule.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    meta: { icon: 'lucide:git-branch', order: 1, title: '规则管理' },
    name: 'RuleMgmt',
    path: '/rule',
    children: [
      {
        name: 'RuleManagement',
        path: 'list',
        component: () => import('#/views/rule/index.vue'),
        meta: { icon: 'lucide:git-branch', title: '规则列表' },
      },
      {
        name: 'RuleDashboard',
        path: 'dashboard',
        component: () => import('#/views/dashboard/index.vue'),
        meta: { icon: 'lucide:activity', title: '规则看板' },
      },
      {
        name: 'DslManagement',
        path: 'dsl',
        component: () => import('#/views/dsl/index.vue'),
        meta: { icon: 'lucide:code', title: 'DSL管理' },
      },
      {
        name: 'VariableManagement',
        path: 'variable',
        component: () => import('#/views/variable/index.vue'),
        meta: { icon: 'lucide:variable', title: '规则变量' },
      },
      {
        name: 'DecisionTableManagement',
        path: 'decision-table',
        component: () => import('#/views/decision-table/index.vue'),
        meta: { icon: 'lucide:table', title: '决策表' },
      },
    ],
  },
  {
    meta: { icon: 'lucide:zap', order: 2, title: '高级功能' },
    name: 'Advanced',
    path: '/advanced',
    children: [
      {
        name: 'CepManagement',
        path: 'cep',
        component: () => import('#/views/cep/index.vue'),
        meta: { icon: 'lucide:zap', title: 'CEP复杂事件' },
      },
      {
        name: 'BreakpointManagement',
        path: 'breakpoint',
        component: () => import('#/views/breakpoint/index.vue'),
        meta: { icon: 'lucide:bug', title: '断点调试' },
      },
    ],
  },
  {
    meta: { icon: 'lucide:history', order: 3, title: '审计监控' },
    name: 'AuditMgmt',
    path: '/audit',
    children: [
      {
        name: 'AuditLogManagement',
        path: 'log',
        component: () => import('#/views/audit-log/index.vue'),
        meta: { icon: 'lucide:file-text', title: '审计日志' },
      },
    ],
  },
];

/** Literule 规则引擎路由配置（子应用内部路由表） */
export default routes;
