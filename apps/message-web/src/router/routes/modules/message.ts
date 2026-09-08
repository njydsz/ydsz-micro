/**
 * message 路由模块
 *
 * @path apps\message-web\src\router\routes\modules\message.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    meta: { icon: 'lucide:mail', order: 1, title: '消息中心' },
    name: 'MessageCenter',
    path: '/message',
    children: [
      {
        name: 'MessageManagement',
        path: 'list',
        component: () => import('#/views/message/index.vue'),
        meta: { icon: 'lucide:send', title: '消息列表' },
      },
      {
        name: 'BatchManagement',
        path: 'batch',
        component: () => import('#/views/batch/index.vue'),
        meta: { icon: 'lucide:layers', title: '批量发送' },
      },
      {
        name: 'DeadLetterManagement',
        path: 'dead-letter',
        component: () => import('#/views/dead-letter/index.vue'),
        meta: { icon: 'lucide:alert-octagon', title: '死信队列' },
      },
    ],
  },
  {
    meta: { icon: 'lucide:file-edit', order: 2, title: '模板管理' },
    name: 'TemplateMgmt',
    path: '/template',
    children: [
      {
        name: 'TemplateManagement',
        path: 'list',
        component: () => import('#/views/template/index.vue'),
        meta: { icon: 'lucide:file-text', title: '消息模板' },
      },
    ],
  },
  {
    meta: { icon: 'lucide:bell', order: 3, title: '通知管理' },
    name: 'NotificationMgmt',
    path: '/notification',
    children: [
      {
        name: 'NotificationManagement',
        path: 'list',
        component: () => import('#/views/notification/index.vue'),
        meta: { icon: 'lucide:bell', title: '站内通知' },
      },
    ],
  },
  {
    meta: { icon: 'lucide:route', order: 4, title: '路由配置' },
    name: 'RouteConfig',
    path: '/route',
    children: [
      {
        name: 'RouteRuleManagement',
        path: 'rules',
        component: () => import('#/views/route-rule/index.vue'),
        meta: { icon: 'lucide:git-branch', title: '路由规则' },
      },
    ],
  },
  {
    meta: { icon: 'lucide:chart-line', order: 4.5, title: '数据统计' },
    name: 'MessageAnalytics',
    path: '/analytics',
    children: [
      {
        name: 'MessageStatsManagement',
        path: 'stats',
        component: () => import('#/views/stats/index.vue'),
        meta: { icon: 'lucide:bar-chart-3', title: '统计看板' },
      },
      {
        name: 'MessageTraceManagement',
        path: 'trace',
        component: () => import('#/views/trace/index.vue'),
        meta: { icon: 'lucide:route', title: '消息轨迹' },
      },
    ],
  },
  {
    meta: { icon: 'lucide:settings', order: 5, title: '偏好设置' },
    name: 'PreferenceMgmt',
    path: '/preference',
    children: [
      {
        name: 'PreferenceManagement',
        path: 'list',
        component: () => import('#/views/preference/index.vue'),
        meta: { icon: 'lucide:sliders', title: '消息偏好' },
      },
    ],
  },
  {
    meta: { icon: 'lucide:bookmark', order: 6, title: '订阅管理' },
    name: 'SubscriptionMgmt',
    path: '/subscription',
    children: [
      {
        name: 'SubscriptionManagement',
        path: 'list',
        component: () => import('#/views/subscription/index.vue'),
        meta: { icon: 'lucide:bookmark', title: '订阅列表' },
      },
    ],
  },
  {
    meta: { icon: 'lucide:settings-2', order: 8, title: '高级管理' },
    name: 'AdvancedMsgMgmt',
    path: '/advanced',
    children: [
      {
        name: 'UserChannelBindingManagement',
        path: 'channel-binding',
        component: () => import('#/views/user-channel-binding/index.vue'),
        meta: { icon: 'lucide:link', title: '渠道绑定' },
      },
      {
        name: 'FeedbackManagement',
        path: 'feedback',
        component: () => import('#/views/feedback/index.vue'),
        meta: { icon: 'lucide:thumbs-up', title: '反馈管理' },
      },
      {
        name: 'CanaryManagement',
        path: 'canary',
        component: () => import('#/views/canary/index.vue'),
        meta: { icon: 'lucide:flask-conical', title: '灰度实验' },
      },
    ],
  },
  {
    meta: { icon: 'lucide:settings', order: 9, title: '运维管理' },
    name: 'OpsManagement',
    path: '/ops',
    children: [
      {
        name: 'RetryPreviewManagement',
        path: 'retry-preview',
        component: () => import('#/views/retry-preview/index.vue'),
        meta: { icon: 'lucide:rotate-ccw', title: '重试预览' },
      },
      {
        name: 'OpsCacheManagement',
        path: 'cache',
        component: () => import('#/views/ops/index.vue'),
        meta: { icon: 'lucide:database', title: '缓存管理' },
      },
      {
        name: 'RecallManagement',
        path: 'recall',
        component: () => import('#/views/recall/index.vue'),
        meta: { icon: 'lucide:corner-up-left', title: '消息召回' },
      },
      {
        name: 'ReadReceiptManagement',
        path: 'read-receipt',
        component: () => import('#/views/read-receipt/index.vue'),
        meta: { icon: 'lucide:check-check', title: '已读回执' },
      },
    ],
  },
  {
    meta: { icon: 'lucide:zap', order: 10, title: '响应式推送' },
    name: 'ReactiveMgmt',
    path: '/reactive',
    children: [
      {
        name: 'ReactiveNotificationManagement',
        path: 'monitor',
        component: () => import('#/views/reactive/index.vue'),
        meta: { icon: 'lucide:activity', title: '响应式监控' },
      },
    ],
  },
];

/** Message 消息中心路由配置（子应用内部路由表） */
export default routes;
