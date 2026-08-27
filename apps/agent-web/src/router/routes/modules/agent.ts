/**
 * agent 路由模块
 *
 * @path apps\agent-web\src\router\routes\modules\agent.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import type { RouteRecordRaw } from 'vue-router';

/**
 * Agent 子应用的静态路由表。
 *
 * 包含 Agent 管理、RAG 知识库、DAG 编排、审批管理四大模块及其列表页，
 * 菜单展示顺序由 meta.order 控制。
 */
const routes: RouteRecordRaw[] = [
  {
    meta: { icon: 'lucide:bot', order: 1, title: 'Agent管理' },
    name: 'AgentMgmt',
    path: '/agent',
    children: [
      {
        name: 'AgentManagement',
        path: 'list',
        component: () => import('#/views/agent/index.vue'),
        meta: { icon: 'lucide:bot', title: 'Agent列表' },
      },
      {
        name: 'DefinitionManagement',
        path: 'definition',
        component: () => import('#/views/definition/index.vue'),
        meta: { icon: 'lucide:settings-2', title: 'Agent定义' },
      },
      {
        name: 'AgentChatConsole',
        path: 'chat',
        component: () => import('#/views/agentChat/index.vue'),
        meta: { icon: 'lucide:message-square', title: '对话调试台' },
      },
    ],
  },
  {
    meta: { icon: 'lucide:brain', order: 2, title: 'RAG知识库' },
    name: 'RagMgmt',
    path: '/rag',
    children: [
      {
        name: 'RagManagement',
        path: 'list',
        component: () => import('#/views/rag/index.vue'),
        meta: { icon: 'lucide:book-open', title: '知识库管理' },
      },
    ],
  },
  {
    meta: { icon: 'lucide:workflow', order: 3, title: 'DAG编排' },
    name: 'DagMgmt',
    path: '/dag',
    children: [
      {
        name: 'DagManagement',
        path: 'list',
        component: () => import('#/views/dag/index.vue'),
        meta: { icon: 'lucide:workflow', title: 'DAG列表' },
      },
    ],
  },
  {
    meta: { icon: 'lucide:wrench', order: 5, title: '工具管理' },
    name: 'ToolMgmt',
    path: '/tool',
    children: [
      {
        name: 'ToolManagement',
        path: 'list',
        component: () => import('#/views/tool/index.vue'),
        meta: { icon: 'lucide:wrench', title: '工具列表' },
      },
    ],
  },
  {
    meta: { icon: 'lucide:message-square-code', order: 7, title: 'Prompt模板' },
    name: 'PromptMgmt',
    path: '/prompt',
    children: [
      {
        name: 'PromptManagement',
        path: 'list',
        component: () => import('#/views/prompt/index.vue'),
        meta: { icon: 'lucide:message-square-code', title: 'Prompt 列表' },
      },
    ],
  },
  {
    meta: { icon: 'lucide:check-circle', order: 4, title: '审批管理' },
    name: 'ApprovalMgmt',
    path: '/approval',
    children: [
      {
        name: 'ApprovalManagement',
        path: 'list',
        component: () => import('#/views/approval/index.vue'),
        meta: { icon: 'lucide:clipboard-check', title: '人工审批' },
      },
    ],
  },
  {
    meta: { icon: 'lucide:activity', order: 6, title: '可观测性' },
    name: 'ObservabilityMgmt',
    path: '/observability',
    children: [
      {
        name: 'ObservabilityManagement',
        path: 'overview',
        component: () => import('#/views/observability/index.vue'),
        meta: { icon: 'lucide:activity', title: 'Trace 监控' },
      },
    ],
  },
];

export default routes;
