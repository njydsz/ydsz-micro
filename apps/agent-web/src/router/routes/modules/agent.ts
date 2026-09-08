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
 * 包含 Agent 管理、RAG、DAG、审批、工具、调试、运行时、协作、触发器等模块，
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
        component: () => import('#/views/agent-chat/index.vue'),
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
    meta: { icon: 'lucide:message-square-code', order: 6, title: 'Prompt模板' },
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
    meta: { icon: 'lucide:activity', order: 7, title: '可观测性' },
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
  {
    meta: { icon: 'lucide:bug', order: 8, title: '链路调试' },
    name: 'DebugMgmt',
    path: '/debug',
    children: [
      {
        name: 'DebugManagement',
        path: 'traces',
        component: () => import('#/views/debug/index.vue'),
        meta: { icon: 'lucide:bug', title: '链路调试' },
      },
    ],
  },
  {
    meta: { icon: 'lucide:monitor', order: 9, title: '运行时管理' },
    name: 'RuntimeMgmt',
    path: '/runtime',
    children: [
      {
        name: 'RuntimeManagement',
        path: 'sessions',
        component: () => import('#/views/runtime/index.vue'),
        meta: { icon: 'lucide:monitor', title: '会话监控' },
      },
    ],
  },
  {
    meta: { icon: 'lucide:users', order: 10, title: '多Agent协作' },
    name: 'TeamRunMgmt',
    path: '/team-run',
    children: [
      {
        name: 'TeamRunManagement',
        path: 'list',
        component: () => import('#/views/team-run/index.vue'),
        meta: { icon: 'lucide:users', title: 'TeamRun 列表' },
      },
    ],
  },
  {
    meta: { icon: 'lucide:clock', order: 11, title: '触发器管理' },
    name: 'TriggerMgmt',
    path: '/trigger',
    children: [
      {
        name: 'TriggerManagement',
        path: 'list',
        component: () => import('#/views/trigger/index.vue'),
        meta: { icon: 'lucide:clock', title: '触发器列表' },
      },
    ],
  },
  {
    meta: { icon: 'lucide:file-bar-chart', order: 12, title: '洞察报告' },
    name: 'InsightReportMgmt',
    path: '/insight',
    children: [
      {
        name: 'InsightReportManagement',
        path: 'list',
        component: () => import('#/views/insight/index.vue'),
        meta: { icon: 'lucide:file-bar-chart', title: '报告列表' },
      },
    ],
  },
];

/** Agent 路由配置（子应用内部路由表） */
export default routes;
