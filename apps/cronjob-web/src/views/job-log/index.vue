<!--
 * 任务执行日志（列表页 / 只读）
 *
 * @path apps\cronjob-web\src\views\job-log\index.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
/**
 * 任务执行日志（列表页 / 只读）
 * <p>消费后端契约 JobController.pageLog（src/api/job.ts，auto-generated），
 * 纯只读「执行日志」页：分页查询 + 按任务标识/状态筛选。
 *
 * <p>P1-日志体验：行「详情」打开抽屉 —— 基本信息（YdDescriptions）+ 实时日志
 * （SSE GET /api/cronjob/log/stream/{logId}，EventSource 拉取历史+实时内容，自动滚底）。
 *
 * @author ydsz-team
 * @since 1.0.0
 */
import type { VxeTableGridOptions } from '@ydsz/plugins/vxe-table';

import { Page } from '@ydsz/common-ui';

import {
  YdBadge,
  YdButton,
  YdSheet,
  YdSheetContent,
  YdSheetHeader,
  YdSheetTitle,
  YdEmptyState,
  YdDescriptions,
  YdDescriptionsItem,
} from '@ydsz-core/ydsz-ui';
import { h, onBeforeUnmount, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';

import { useYDSZVxeGrid } from '#/adapter/vxe-table';
import { pageLog } from '#/api/job';
import type { JobLogVO } from '#/api/models';

defineOptions({ name: 'JobLogManagement' });

const { t } = useI18n();

const route = useRoute();

/** 预填的 jobKey（从任务列表"日志"按钮跳转带入） */
const presetJobKey = ref(typeof route.query.jobKey === 'string' ? route.query.jobKey : '');

// ==================== 日志详情抽屉（P1） ====================

/** 当前查看的日志（抽屉数据源） */
const detailLog = ref<JobLogVO | null>(null);
/** 抽屉可见性 */
const detailVisible = ref(false);
/** SSE 累积日志文本 */
const logText = ref('');
/** SSE 连接状态 */
const sseConnected = ref(false);
/** SSE 实例（关闭抽屉/卸载时释放） */
let sseSource: EventSource | null = null;
/** 日志内容容器（自动滚底） */
const logBodyRef = ref<HTMLElement | null>(null);

/** 打开详情抽屉并建立 SSE 订阅 */
function handleViewDetail(log: JobLogVO) {
  detailLog.value = log;
  detailVisible.value = true;
  logText.value = '';
  sseConnected.value = false;
  sseSource?.close();
  if (!log.id) return;
  // 鉴权走 HttpOnly Cookie（同源），EventSource 无需自定义头
  const baseUrl = import.meta.env.VITE_GLOB_API_URL ?? '/api';
  sseSource = new EventSource(`${baseUrl}/api/cronjob/log/stream/${log.id}`);
  sseSource.onopen = () => {
    sseConnected.value = true;
  };
  sseSource.onmessage = (event: MessageEvent) => {
    logText.value += `${event.data}\n`;
    scrollLogToBottom();
  };
  sseSource.onerror = () => {
    sseConnected.value = false;
    // 任务执行结束后服务端关闭连接，EventSource 会触发 onerror —— 属正常结束，不重复提示
    sseSource?.close();
  };
}

/** 关闭抽屉并释放 SSE 连接 */
function handleCloseDetail() {
  detailVisible.value = false;
  sseSource?.close();
  sseSource = null;
}

/** 日志内容容器自动滚底 */
function scrollLogToBottom() {
  requestAnimationFrame(() => {
    if (logBodyRef.value) {
      logBodyRef.value.scrollTop = logBodyRef.value.scrollHeight;
    }
  });
}

onBeforeUnmount(() => {
  sseSource?.close();
});

onMounted(() => {
  // 带 jobKey 跳入时自动触发一次查询
  if (presetJobKey.value) {
    gridApi.query({ jobKey: presetJobKey.value });
  }
});

// ==================== 列表 ====================

const gridOptions: VxeTableGridOptions<JobLogVO> = {
  columns: [
    { type: 'seq', width: 50, title: t('common.seq') },
    { field: 'jobKey', title: t('page.jobTask.jobKey'), width: 140 },
    {
      field: 'status',
      title: t('common.status'),
      width: 100,
      slots: {
        default: ({ row }) => {
          const log = row as JobLogVO;
          const isSuccess = log.status === 'SUCCESS' || log.status === '0';
          return h(
            YdBadge,
            { variant: isSuccess ? 'default' : 'destructive' },
            () => log.status ?? '-',
          );
        },
      },
    },
    { field: 'startTime', title: t('page.dagInstance.startTime'), width: 170 },
    { field: 'endTime', title: t('page.dagInstance.endTime'), width: 170 },
    { field: 'durationMs', title: t('page.dagInstance.durationMs'), width: 100 },
    { field: 'triggerType', title: t('page.dagInstance.triggerType'), width: 110 },
    { field: 'errorMessage', title: t('page.jobTask.errorMessage'), minWidth: 160 },
    { field: 'createdAt', title: t('page.jobTask.createdAt'), width: 170 },
    {
      field: 'action',
      title: t('common.actions'),
      width: 90,
      fixed: 'right',
      slots: {
        default: ({ row }) => {
          const log = row as JobLogVO;
          return h(
            YdButton,
            { size: 'sm', variant: 'link', onClick: () => handleViewDetail(log) },
            () => t('page.jobTask.detail'),
          );
        },
      },
    },
  ],
  height: 'auto',
  pagerConfig: { pageSize: 20, pageSizes: [10, 20, 50, 100] },
  proxyConfig: {
    ajax: {
      query: async ({ page: pageInfo }, formValues) => {
        const res = await pageLog({
          pageNum: pageInfo.currentPage,
          size: pageInfo.pageSize,
          ...formValues,
        });
        return { items: res.data ?? [], total: res.total ?? 0 };
      },
    },
  },
  toolbarConfig: { custom: true, refresh: { code: 'query' }, search: true, zoom: true },
  formConfig: {
    enabled: true,
    items: [
      {
        field: 'jobKey',
        title: t('page.jobTask.jobKey'),
        itemRender: {
          name: 'YdInput',
          props: { placeholder: t('page.jobTask.jobKey'), modelValue: presetJobKey },
        },
      },
      {
        field: 'status',
        title: t('common.status'),
        itemRender: { name: 'YdInput', props: { placeholder: t('common.status') } },
      },
    ],
  },
};

const [Grid, gridApi] = useYDSZVxeGrid({ gridOptions });
</script>

<template>
  <Page auto-content-height>
    <Grid :table-title="t('page.executionLog')" />

    <YdSheet v-model:open="detailVisible">
      <YdSheetContent side="right" class="w-[720px]">
        <YdSheetHeader>
          <YdSheetTitle>{{ t('page.executionLogDetail') }}</YdSheetTitle>
        </YdSheetHeader>
        <template v-if="detailLog">
          <YdDescriptions :column="2" border size="small" class="mb-3">
            <YdDescriptionsItem :label="t('page.jobTask.jobKey')">{{ detailLog.jobKey ?? '-' }}</YdDescriptionsItem>
            <YdDescriptionsItem :label="t('common.status')">
              <YdBadge :variant="detailLog.status === 'SUCCESS' ? 'default' : 'destructive'">{{
                detailLog.status ?? '-'
              }}</YdBadge>
            </YdDescriptionsItem>
            <YdDescriptionsItem :label="t('page.dagInstance.startTime')">{{
              detailLog.startTime ?? '-'
            }}</YdDescriptionsItem>
            <YdDescriptionsItem :label="t('page.dagInstance.endTime')">{{ detailLog.endTime ?? '-' }}</YdDescriptionsItem>
            <YdDescriptionsItem :label="t('page.dagInstance.durationMs')">{{
              detailLog.durationMs ?? '-'
            }}</YdDescriptionsItem>
            <YdDescriptionsItem :label="t('page.dagInstance.triggerType')">{{
              detailLog.triggerType ?? '-'
            }}</YdDescriptionsItem>
            <YdDescriptionsItem :label="t('page.jobTask.execNode')">{{
              detailLog.execNodeId ?? '-'
            }}</YdDescriptionsItem>
            <YdDescriptionsItem :label="t('page.dagInstance.traceId')">{{
              detailLog.traceId ?? '-'
            }}</YdDescriptionsItem>
            <YdDescriptionsItem :label="t('page.jobLog.shard')" :span="2">{{
              detailLog.shardTotal
                ? `${(detailLog.shardIndex ?? 0) + 1}/${detailLog.shardTotal}`
                : t('page.jobLog.notSharded')
            }}</YdDescriptionsItem>
            <YdDescriptionsItem v-if="detailLog.paramsJson" :label="t('page.jobTask.taskParams')" :span="2">
              <pre class="whitespace-pre-wrap break-all text-xs">{{ detailLog.paramsJson }}</pre>
            </YdDescriptionsItem>
            <YdDescriptionsItem v-if="detailLog.resultJson" :label="t('page.jobTask.execResult')" :span="2">
              <pre class="whitespace-pre-wrap break-all text-xs">{{ detailLog.resultJson }}</pre>
            </YdDescriptionsItem>
            <YdDescriptionsItem v-if="detailLog.errorMessage" :label="t('page.jobTask.errorMessage')" :span="2">
              <pre class="whitespace-pre-wrap break-all text-xs text-red-500">{{
                detailLog.errorMessage
              }}</pre>
            </YdDescriptionsItem>
          </YdDescriptions>

          <div class="mb-1 flex items-center gap-2 text-xs text-gray-500">
            <span>{{ t('page.jobLog.realtimeLog') }}</span>
            <YdBadge v-if="sseConnected" variant="default" size="sm">{{
              t('business.job.sse.connected')
            }}</YdBadge>
            <YdBadge v-else variant="secondary" size="sm">{{ t('page.jobLog.ended') }}</YdBadge>
          </div>
          <div
            ref="logBodyRef"
            class="h-80 overflow-auto rounded border border-gray-200 bg-gray-50 p-2 font-mono text-xs leading-5"
          >
            <pre v-if="logText" class="whitespace-pre-wrap break-all">{{ logText }}</pre>
            <YdEmptyState v-else :description="t('page.jobLogStream.noLogContent')" :image-size="60" />
          </div>
        </template>
      </YdSheetContent>
    </YdSheet>
  </Page>
</template>
