<!--
 * 工作台页面 — 展示用户问候、项目列表、快捷导航、待办事项、最新动态
 *
 * @path main\src\views\dashboard\workspace\index.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
import type {
  WorkbenchProjectItem,
  WorkbenchQuickNavItem,
  WorkbenchTodoItem,
  WorkbenchTrendItem,
} from '@ydsz/common-ui';

import { computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';

import {
  AnalysisChartCard,
  WorkbenchHeader,
  WorkbenchProject,
  WorkbenchQuickNav,
  WorkbenchTodo,
  WorkbenchTrends,
} from '@ydsz/common-ui';
import { preferences } from '@ydsz/preferences';
import { useUserStore } from '@ydsz/stores';
import { createLogger } from '@ydsz-core/shared/utils';
import { openWindow } from '@ydsz/utils';

/** 模块级日志器 */
const logger = createLogger('Dashboard');

import { useWorkspaceData } from '#/hooks/use-dashboard-data';

import AnalyticsVisitsSource from '../analytics/analytics-visits-source.vue';

const { t } = useI18n();

const userStore = useUserStore();

/**
 * 本地示例数据（后端工作台接口就绪前兜底展示）。
 *
 * <p>用 computed 而不是模块级常量：文案需要跟随语种切换重算，
 * 模块求值时取词条只会把首次渲染的语种焊死。
 */
const demoProjects = computed<WorkbenchProjectItem[]>(() => [
  {
    color: '',
    content: t('workspace.projectQuote1'),
    date: '2021-04-01',
    group: t('workspace.projectGroupOpenSource'),
    icon: 'carbon:logo-github',
    title: 'Github',
    url: 'https://github.com',
  },
  {
    color: '#3fb27f',
    content: t('workspace.projectQuote2'),
    date: '2021-04-01',
    group: t('workspace.projectGroupAlgo'),
    icon: 'ion:logo-vue',
    title: 'Vue',
    url: 'https://vuejs.org',
  },
  {
    color: '#e18525',
    content: t('workspace.projectQuote3'),
    date: '2021-04-01',
    group: t('workspace.projectGroupIdle'),
    icon: 'ion:logo-html5',
    title: 'Html5',
    url: 'https://developer.mozilla.org/zh-CN/docs/Web/HTML',
  },
  {
    color: '#bf0c2c',
    content: t('workspace.projectQuote4'),
    date: '2021-04-01',
    group: 'UI',
    icon: 'ion:logo-angular',
    title: 'Angular',
    url: 'https://angular.io',
  },
  {
    color: '#00d8ff',
    content: t('workspace.projectQuote5'),
    date: '2021-04-01',
    group: t('workspace.projectGroupTech'),
    icon: 'bx:bxl-react',
    title: 'React',
    url: 'https://reactjs.org',
  },
  {
    color: '#EBD94E',
    content: t('workspace.projectQuote6'),
    date: '2021-04-01',
    group: t('workspace.projectGroupArch'),
    icon: 'ion:logo-javascript',
    title: 'Js',
    url: 'https://developer.mozilla.org/zh-CN/docs/Web/JavaScript',
  },
]);

// 同样，这里的 url 也可以使用以 http 开头的外部链接
const demoQuickNavs = computed<WorkbenchQuickNavItem[]>(() => [
  { color: '#1fdaca', icon: 'ion:home-outline', title: t('workspace.navHome'), url: '/' },
  { color: '#bf0c2c', icon: 'ion:grid-outline', title: t('workspace.navDashboard'), url: '/dashboard' },
  { color: '#e18525', icon: 'ion:layers-outline', title: t('workspace.navComponents'), url: '/demos/features/icons' },
  // 示例 URL，实际接入时按项目路由调整
  { color: '#3fb27f', icon: 'ion:settings-outline', title: t('workspace.navSystem'), url: '/demos/features/login-expired' },
  { color: '#4daf1bc9', icon: 'ion:key-outline', title: t('workspace.navPermission'), url: '/demos/access/page-control' },
  { color: '#00d8ff', icon: 'ion:bar-chart-outline', title: t('workspace.navCharts'), url: '/analytics' },
]);

const demoTodos = computed<WorkbenchTodoItem[]>(() => [
  {
    completed: false,
    content: t('workspace.todoContent1'),
    date: '2024-07-30 11:00:00',
    title: t('workspace.todoTitle1'),
  },
  {
    completed: true,
    content: t('workspace.todoContent2'),
    date: '2024-07-30 11:00:00',
    title: t('workspace.todoTitle2'),
  },
  {
    completed: false,
    content: t('workspace.todoContent3'),
    date: '2024-07-30 11:00:00',
    title: t('workspace.todoTitle3'),
  },
  {
    completed: false,
    content: t('workspace.todoContent4'),
    date: '2024-07-30 11:00:00',
    title: t('workspace.todoTitle4'),
  },
  {
    completed: false,
    content: t('workspace.todoContent5'),
    date: '2024-07-30 11:00:00',
    title: t('workspace.todoTitle5'),
  },
]);

const demoTrends = computed<WorkbenchTrendItem[]>(() => [
  { avatar: 'svg:avatar-1', content: t('workspace.trendContent1'), date: t('workspace.trendDateJustNow'), title: t('workspace.personWilliam') },
  { avatar: 'svg:avatar-2', content: t('workspace.trendContent2'), date: t('workspace.trendDateHour'), title: t('workspace.personEvan') },
  { avatar: 'svg:avatar-3', content: t('workspace.trendContent3'), date: t('workspace.trendDateDay1'), title: t('workspace.personChris') },
  { avatar: 'svg:avatar-4', content: t('workspace.trendContent4'), date: t('workspace.trendDateDay2'), title: 'YDSZ' },
  { avatar: 'svg:avatar-1', content: t('workspace.trendContent5'), date: t('workspace.trendDateDay3'), title: t('workspace.personPeter') },
  { avatar: 'svg:avatar-2', content: t('workspace.trendContent6'), date: t('workspace.trendDateWeek'), title: t('workspace.personJack') },
  { avatar: 'svg:avatar-3', content: t('workspace.trendContent7'), date: t('workspace.trendDateWeek'), title: t('workspace.personWilliam') },
  { avatar: 'svg:avatar-4', content: t('workspace.trendContent8'), date: '2021-04-01 20:00', title: t('workspace.personWilliam') },
  { avatar: 'svg:avatar-4', content: t('workspace.trendContent9'), date: '2021-03-01 20:00', title: 'YDSZ' },
]);

/** 工作台数据（后端字段与 UI 组件类型对齐，greeting 可选） */
interface WorkbenchData {
  projects: WorkbenchProjectItem[];
  quickNavs: WorkbenchQuickNavItem[];
  todos: WorkbenchTodoItem[];
  trends: WorkbenchTrendItem[];
  greeting?: string;
}

const { data: workbenchData, load: loadWorkbench } =
  useWorkspaceData<WorkbenchData>({
    projects: [],
    quickNavs: [],
    todos: [],
    trends: [],
  });

/** 接口有数据用接口数据，否则回退到本地示例数据（示例数据随语种重算） */
const projectItems = computed(() =>
  workbenchData.value.projects.length > 0 ? workbenchData.value.projects : demoProjects.value,
);
const quickNavItems = computed(() =>
  workbenchData.value.quickNavs.length > 0 ? workbenchData.value.quickNavs : demoQuickNavs.value,
);
const todoItems = computed(() =>
  workbenchData.value.todos.length > 0 ? workbenchData.value.todos : demoTodos.value,
);
const trendItems = computed(() =>
  workbenchData.value.trends.length > 0 ? workbenchData.value.trends : demoTrends.value,
);

/** 时段化问候语（后端可覆盖，缺省按本地时间动态生成） */
const greeting = computed(() => {
  if (workbenchData.value.greeting) return workbenchData.value.greeting;
  const hour = new Date().getHours();
  if (hour < 6) return t('workspace.greetingNight');
  if (hour < 12) return t('workspace.greetingMorning');
  if (hour < 14) return t('workspace.greetingNoon');
  if (hour < 18) return t('workspace.greetingAfternoon');
  return t('workspace.greetingEvening');
});

const router = useRouter();

// 这是一个示例方法，实际项目中需要根据实际情况进行调整
// This is a sample method, adjust according to the actual project requirements
function navTo(nav: WorkbenchProjectItem | WorkbenchQuickNavItem) {
  if (nav.url?.startsWith('http')) {
    openWindow(nav.url);
    return;
  }
  if (nav.url?.startsWith('/')) {
    router.push(nav.url).catch((error) => {
      logger.error("Navigation failed:", error);
    });
  } else {
    logger.warn(`Unknown URL for navigation item: ${nav.title} -> ${nav.url}`);
  }
}

onMounted(() => {
  // API 优先：后端就绪时自动替换为真实工作台数据
  void loadWorkbench();
});
</script>

<template>
  <div class="p-5">
    <WorkbenchHeader
      :avatar="userStore.userInfo?.avatar || preferences.app.defaultAvatar"
    >
      <template #title>
        {{ greeting }}, {{ userStore.userInfo?.realName }}, {{ t('workspace.greetingSuffix') }}
      </template>
      <template #description> {{ t('workspace.weather') }} </template>
    </WorkbenchHeader>

    <div class="mt-5 flex flex-col lg:flex-row">
      <div class="mr-4 w-full lg:w-3/5">
        <WorkbenchProject :items="projectItems" :title="t('workspace.sectionProjects')" @click="navTo" />
        <WorkbenchTrends :items="trendItems" class="mt-5" :title="t('workspace.sectionTrends')" />
      </div>
      <div class="w-full lg:w-2/5">
        <WorkbenchQuickNav
          :items="quickNavItems"
          class="mt-5 lg:mt-0"
          :title="t('workspace.sectionQuickNav')"
          @click="navTo"
        />
        <WorkbenchTodo :items="todoItems" class="mt-5" :title="t('workspace.sectionTodo')" />
        <AnalysisChartCard class="mt-5" :title="t('workspace.sectionVisitSource')">
          <AnalyticsVisitsSource />
        </AnalysisChartCard>
      </div>
    </div>
  </div>
</template>
