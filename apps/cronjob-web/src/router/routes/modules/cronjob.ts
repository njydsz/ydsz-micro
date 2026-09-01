/**
 * cronjob 路由模块
 *
 * @path apps\cronjob-web\src\router\routes\modules\cronjob.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    meta: { icon: 'lucide:clock', order: 1, title: '任务管理' },
    name: 'JobMgmt',
    path: '/job',
    children: [
      {
        name: 'JobManagement',
        path: 'list',
        component: () => import('#/views/job/index.vue'),
        meta: { icon: 'lucide:timer', title: '任务列表' },
      },
      {
        name: 'JobGroupManagement',
        path: 'group',
        component: () => import('#/views/job-group/index.vue'),
        meta: { icon: 'lucide:folder', title: '任务分组' },
      },
    ],
  },
  {
    meta: { icon: 'lucide:git-merge', order: 2, title: 'DAG管理' },
    name: 'DagMgmt',
    path: '/dag',
    children: [
      {
        name: 'JobDagManagement',
        path: 'list',
        component: () => import('#/views/job-dag/index.vue'),
        meta: { icon: 'lucide:workflow', title: 'DAG列表' },
      },
      {
        name: 'JobDagInstanceManagement',
        path: 'instance',
        component: () => import('#/views/job-dag-instance/index.vue'),
        meta: { icon: 'lucide:activity', title: '运行实例' },
      },
    ],
  },
  {
    meta: { icon: 'lucide:scroll-text', order: 3, title: '日志监控' },
    name: 'LogMgmt',
    path: '/log',
    children: [
      {
        name: 'CronjobDashboard',
        path: 'dashboard',
        component: () => import('#/views/dashboard/index.vue'),
        meta: { icon: 'lucide:layout-dashboard', title: '运行看板' },
      },
      {
        name: 'JobLogManagement',
        path: 'list',
        component: () => import('#/views/job-log/index.vue'),
        meta: { icon: 'lucide:file-text', title: '执行日志' },
      },
    ],
  },
  {
    meta: { icon: 'lucide:bell-ring', order: 4, title: '告警管理' },
    name: 'AlertMgmt',
    path: '/alert',
    children: [
      {
        name: 'AlertManagement',
        path: 'list',
        component: () => import('#/views/alert/index.vue'),
        meta: { icon: 'lucide:siren', title: '告警规则' },
      },
    ],
  },
  {
    meta: { icon: 'lucide:calendar', order: 6, title: '调度日历' },
    name: 'ScheduleCalendarMgmt',
    path: '/schedule-calendar',
    children: [
      {
        name: 'ScheduleCalendar',
        path: 'index',
        component: () => import('#/views/schedule-calendar/index.vue'),
        meta: { icon: 'lucide:calendar-days', title: '调度日历' },
      },
    ],
  },
  {
    meta: { icon: 'lucide:plug', order: 7, title: '连接器' },
    name: 'ConnectorMgmt',
    path: '/connector',
    children: [
      {
        name: 'ConnectorManagement',
        path: 'list',
        component: () => import('#/views/connector/index.vue'),
        meta: { icon: 'lucide:cable', title: '连接器管理' },
      },
    ],
  },
];

/** Cronjob 定时任务路由配置（子应用内部路由表） */
export default routes;
