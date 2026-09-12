<!--
 * Runtime 会话监控页面
 *
 * <p>展示活跃会话列表、最近会话概览，支持查看会话详情和强制回收会话。
 *
 * @path apps/agent-web/src/views/runtime/index.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
/**
 * Runtime 会话监控页面
 * <p>消费后端 RuntimeController（apps/agent-web/src/api/runtime.ts）：
 * getActiveSessions() / getRecentSessions() 获取列表，getOverview() 获取概览，
 * getSession() 查看详情，forceRecycle() 强制回收。
 *
 * @author ydsz-team
 * @since 1.0.0
*/
import type { VxeTableGridOptions } from '@ydsz/plugins/vxe-table';
import { Page } from '@ydsz/common-ui';
import { ElButton, ElCard, ElDialog, ElEmpty, ElMessageBox, ElTabPane, ElTabs, ElTag } from 'element-plus';
import { h, ref } from 'vue';
import { createLogger } from '@ydsz/utils';
import { useYDSZVxeGrid } from '#/adapter/vxe-table';
import { forceRecycle, getActiveSessions, getOverview, getRecentSessions, getSession } from '#/api/runtime';
import type { RuntimeSession } from '#/api/models';

const logger = createLogger('agent-runtime');

defineOptions({ name: 'RuntimeManagement' });

/** 当前激活的标签页 */
const activeTab = ref('active');

/** 概览数据 */
const overviewData = ref<Record<string, Record<string, unknown>>>({});

/** 加载状态 */
const loading = ref(false);

/** 会话详情弹窗可见性 */
const sessionDetailVisible = ref(false);

/** 当前选中的会话详情 */
const selectedSession = ref<RuntimeSession | null>(null);

/** 活跃会话数据 */
const activeSessions = ref<RuntimeSession[]>([]);

/** 最近会话数据 */
const recentSessions = ref<RuntimeSession[]>([]);

/** 状态标签类型 */
function getStatusTagType(status: string): 'success' | 'danger' | 'warning' | 'info' {
  switch ((status ?? '').toUpperCase()) {
    case 'SUCCESS':
    case 'COMPLETED':
    case 'FINISHED':
      return 'success';
    case 'FAILED':
    case 'ERROR':
    case 'CANCELLED':
      return 'danger';
    case 'RUNNING':
    case 'PENDING':
    case 'ACTIVE':
      return 'warning';
    default:
      return 'info';
  }
}

/** 活跃会话列定义 */
const activeColumns: VxeTableGridOptions<RuntimeSession>['columns'] = [
  { type: 'seq', width: 50, title: '序号' },
  { field: 'executionId', title: '执行 ID', width: 200, showOverflow: true },
  { field: 'agentCode', title: 'Agent 编码', width: 140 },
  { field: 'conversationId', title: '对话 ID', width: 200, showOverflow: true },
  {
    field: 'status',
    title: '状态',
    width: 100,
    slots: {
      default: ({ row }) =>
        h(ElTag, { type: getStatusTagType(row.status ?? '') }, () => row.status ?? '-'),
    },
  },
  { field: 'startTime', title: '开始时间', width: 170 },
  { field: 'lastActiveTime', title: '最后活跃', width: 170 },
  { field: 'elapsedMillis', title: '已运行(ms)', width: 120 },
  { field: 'totalTokens', title: 'Token 消耗', width: 110 },
  { field: 'currentStep', title: '当前步骤', width: 140, showOverflow: true },
  {
    field: 'action',
    title: '操作',
    width: 160,
    fixed: 'right',
    slots: {
      default: ({ row }) =>
        h('div', { class: 'flex gap-1' }, [
          h(ElButton, { size: 'small', link: true, type: 'primary', onClick: () => handleViewDetail(row) }, () => '详情'),
          h(ElButton, { size: 'small', link: true, type: 'danger', onClick: () => handleForceRecycle(row) }, () => '回收'),
        ]),
    },
  },
];

/** 活跃会话表格配置 */
const activeGridOptions: VxeTableGridOptions<RuntimeSession> = {
  columns: activeColumns,
  height: 'auto',
  proxyConfig: {
    ajax: {
      query: async () => {
        const items = await getActiveSessions({});
        activeSessions.value = items ?? [];
        return { items: items ?? [], total: items?.length ?? 0 };
      },
    },
  },
  toolbarConfig: { custom: true, refresh: { code: 'query' }, search: true, zoom: true },
  formConfig: { enabled: true, items: [
    { field: 'agentCode', title: 'Agent编码', itemRender: { name: 'Input', props: { placeholder: 'Agent编码' } } },
    { field: 'executionId', title: '执行ID', itemRender: { name: 'Input', props: { placeholder: '执行ID' } } },
  ] },
};

/** 最近会话列定义 */
const recentColumns: VxeTableGridOptions<RuntimeSession>['columns'] = [
  { type: 'seq', width: 50, title: '序号' },
  { field: 'executionId', title: '执行 ID', width: 200, showOverflow: true },
  { field: 'agentCode', title: 'Agent 编码', width: 140 },
  { field: 'conversationId', title: '对话 ID', width: 200, showOverflow: true },
  {
    field: 'status',
    title: '状态',
    width: 100,
    slots: {
      default: ({ row }) =>
        h(ElTag, { type: getStatusTagType(row.status ?? '') }, () => row.status ?? '-'),
    },
  },
  { field: 'startTime', title: '开始时间', width: 170 },
  { field: 'lastActiveTime', title: '最后活跃', width: 170 },
  { field: 'totalTokens', title: 'Token 消耗', width: 110 },
  {
    field: 'action',
    title: '操作',
    width: 100,
    fixed: 'right',
    slots: {
      default: ({ row }) =>
        h('div', { class: 'flex gap-1' }, [
          h(ElButton, { size: 'small', link: true, type: 'primary', onClick: () => handleViewDetail(row) }, () => '详情'),
        ]),
    },
  },
];

/** 最近会话表格配置 */
const recentGridOptions: VxeTableGridOptions<RuntimeSession> = {
  columns: recentColumns,
  height: 'auto',
  proxyConfig: {
    ajax: {
      query: async () => {
        const items = await getRecentSessions({ limit: 20 });
        recentSessions.value = items ?? [];
        return { items: items ?? [], total: items?.length ?? 0 };
      },
    },
  },
  toolbarConfig: { custom: true, refresh: { code: 'query' }, search: true, zoom: true },
};

const [ActiveGrid, activeGridApi] = useYDSZVxeGrid({ gridOptions: activeGridOptions });
const [RecentGrid, recentGridApi] = useYDSZVxeGrid({ gridOptions: recentGridOptions });

/** 加载概览数据 */
async function loadOverview(): Promise<void> {
  loading.value = true;
  try {
    overviewData.value = await getOverview();
  } catch (error) {
    logger.warn('加载运行时概览数据失败: {}', error);
  } finally {
    loading.value = false;
  }
}

/** 查看会话详情 */
async function handleViewDetail(row: RuntimeSession): Promise<void> {
  try {
    selectedSession.value = await getSession({ executionId: row.executionId ?? '' });
    sessionDetailVisible.value = true;
  } catch (error) {
    logger.warn('获取会话详情失败: {}', error);
  }
}

/** 强制回收会话 */
async function handleForceRecycle(row: RuntimeSession): Promise<void> {
  try {
    await ElMessageBox.confirm(
      `确定强制回收会话「${row.executionId ?? ''}」吗?该操作不可撤销。`,
      '回收确认',
      { type: 'warning' },
    );
  } catch {
    return;
  }
  try {
    await forceRecycle({ executionId: row.executionId ?? '' });
    activeGridApi.query();
    loadOverview();
  } catch (error) {
    logger.warn('强制回收会话失败: {}', error);
  }
}

/** 标签切换时刷新对应表格 */
function handleTabChange(tabName: string): void {
  if (tabName === 'active') {
    activeGridApi.query();
  } else {
    recentGridApi.query();
  }
}

loadOverview();
</script>

<template>
  <Page auto-content-height>
    <div class="space-y-4 p-4">
      <!-- 概览卡片 -->
      <div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <ElCard shadow="hover">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-500">活跃会话数</p>
              <p class="mt-1 text-2xl font-bold">
                {{ ((overviewData.activeCount as Record<string, unknown>)?.value as number) ?? activeSessions.length }}
              </p>
            </div>
            <div class="rounded-full bg-blue-50 p-3">
              <span class="text-2xl text-blue-500">📊</span>
            </div>
          </div>
        </ElCard>

        <ElCard shadow="hover">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-500">最大并发</p>
              <p class="mt-1 text-2xl font-bold text-green-600">
                {{ ((overviewData.maxConcurrency as Record<string, unknown>)?.value as number) ?? 0 }}
              </p>
            </div>
            <div class="rounded-full bg-green-50 p-3">
              <span class="text-2xl text-green-500">⚡</span>
            </div>
          </div>
        </ElCard>

        <ElCard shadow="hover">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-500">平均 TTL</p>
              <p class="mt-1 text-2xl font-bold text-purple-600">
                {{ ((overviewData.avgTtl as Record<string, unknown>)?.value as number) ?? 0 }}s
              </p>
            </div>
            <div class="rounded-full bg-purple-50 p-3">
              <span class="text-2xl text-purple-500">⏱️</span>
            </div>
          </div>
        </ElCard>

        <ElCard shadow="hover">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-500">总创建数</p>
              <p class="mt-1 text-2xl font-bold text-orange-600">
                {{ ((overviewData.totalCreated as Record<string, unknown>)?.value as number) ?? 0 }}
              </p>
            </div>
            <div class="rounded-full bg-orange-50 p-3">
              <span class="text-2xl text-orange-500">🔢</span>
            </div>
          </div>
        </ElCard>
      </div>

      <!-- 标签页:活跃会话 / 最近会话 -->
      <ElCard>
        <ElTabs v-model="activeTab" @tab-change="handleTabChange">
          <ElTabPane label="活跃会话" name="active">
            <ActiveGrid table-title="活跃会话列表">
              <template #toolbar-tools>
                <ElButton type="primary" @click="activeGridApi.query()">刷新</ElButton>
              </template>
            </ActiveGrid>
            <ElEmpty v-if="!loading && activeSessions.length === 0" description="暂无活跃会话" />
          </ElTabPane>

          <ElTabPane label="最近会话" name="recent">
            <RecentGrid table-title="最近会话列表">
              <template #toolbar-tools>
                <ElButton type="primary" @click="recentGridApi.query()">刷新</ElButton>
              </template>
            </RecentGrid>
            <ElEmpty v-if="!loading && recentSessions.length === 0" description="暂无最近会话" />
          </ElTabPane>
        </ElTabs>
      </ElCard>
    </div>

    <!-- 会话详情弹窗 -->
    <ElDialog
      v-model="sessionDetailVisible"
      title="会话详情"
      width="700px"
      @close="selectedSession = null"
    >
      <div v-if="selectedSession" class="space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <span class="text-sm text-gray-500">执行 ID:</span>
            <span class="text-sm font-medium">{{ selectedSession.executionId }}</span>
          </div>
          <div>
            <span class="text-sm text-gray-500">Agent 编码:</span>
            <span class="text-sm font-medium">{{ selectedSession.agentCode }}</span>
          </div>
          <div>
            <span class="text-sm text-gray-500">对话 ID:</span>
            <span class="text-sm font-medium">{{ selectedSession.conversationId }}</span>
          </div>
          <div>
            <span class="text-sm text-gray-500">状态:</span>
            <ElTag :type="getStatusTagType(selectedSession.status ?? '')">
              {{ selectedSession.status }}
            </ElTag>
          </div>
          <div>
            <span class="text-sm text-gray-500">Agent 类型:</span>
            <span class="text-sm font-medium">{{ selectedSession.agentType ?? '-' }}</span>
          </div>
          <div>
            <span class="text-sm text-gray-500">模型:</span>
            <span class="text-sm font-medium">{{ selectedSession.model ?? '-' }}</span>
          </div>
          <div>
            <span class="text-sm text-gray-500">开始时间:</span>
            <span class="text-sm font-medium">{{ selectedSession.startTime }}</span>
          </div>
          <div>
            <span class="text-sm text-gray-500">最后活跃:</span>
            <span class="text-sm font-medium">{{ selectedSession.lastActiveTime }}</span>
          </div>
          <div>
            <span class="text-sm text-gray-500">Tenant ID:</span>
            <span class="text-sm font-medium">{{ selectedSession.tenantId ?? '-' }}</span>
          </div>
          <div>
            <span class="text-sm text-gray-500">User ID:</span>
            <span class="text-sm font-medium">{{ selectedSession.userId ?? '-' }}</span>
          </div>
          <div>
            <span class="text-sm text-gray-500">Token 消耗:</span>
            <span class="text-sm font-medium">{{ selectedSession.totalTokens?.toLocaleString() ?? 0 }}</span>
          </div>
          <div>
            <span class="text-sm text-gray-500">费用:</span>
            <span class="text-sm font-medium text-orange-600">{{ selectedSession.costUsd ? `$${selectedSession.costUsd}` : '-' }}</span>
          </div>
          <div>
            <span class="text-sm text-gray-500">当前步骤:</span>
            <span class="text-sm font-medium">{{ selectedSession.currentStep ?? '-' }}</span>
          </div>
          <div>
            <span class="text-sm text-gray-500">迭代进度:</span>
            <span class="text-sm font-medium">
              {{ selectedSession.currentIteration ?? 0 }} / {{ selectedSession.maxIterations ?? 0 }}
            </span>
          </div>
          <div>
            <span class="text-sm text-gray-500">来源:</span>
            <span class="text-sm font-medium">{{ selectedSession.source ?? '-' }}</span>
          </div>
        </div>

        <div v-if="selectedSession.errorMessage">
          <span class="text-sm text-gray-500">错误信息:</span>
          <div class="mt-1 rounded border bg-red-50 p-3 text-sm text-red-700">
            {{ selectedSession.errorMessage }}
          </div>
        </div>
      </div>
      <template #footer>
        <ElButton @click="sessionDetailVisible = false">关闭</ElButton>
      </template>
    </ElDialog>
  </Page>
</template>
