<!--
 * 任务执行日志（列表页 / 只读）
 *
 * @path apps\cronjob-web\src\views\jobLog\index.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
/**
 * 任务执行日志（列表页 / 只读）
 * <p>消费后端契约 JobController.pageLog（src/api/job.ts，auto-generated），
 * 纯只读「执行日志」页：分页查询 + 按任务标识/状态筛选。
 *
 * <p>P1-日志体验：行「详情」打开抽屉 —— 基本信息（ElDescriptions）+ 实时日志
 * （SSE GET /api/v1/cronjob/log/stream/{logId}，EventSource 拉取历史+实时内容，自动滚底）。
 *
 * @author ydsz-team
 * @since 1.0.0
 */
import type { VxeTableGridOptions } from '@ydsz/plugins/vxe-table';

import { Page } from '@ydsz/common-ui';

import {
  ElButton,
  ElDescriptions,
  ElDescriptionsItem,
  ElDrawer,
  ElEmpty,
  ElTag,
} from 'element-plus';
import { h, onBeforeUnmount, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';

import { useYDSZVxeGrid } from '#/adapter/vxe-table';
import { pageLog } from '#/api/job';
import type { JobLogVO } from '#/api/models';

defineOptions({ name: 'JobLogManagement' });

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
  sseSource = new EventSource(`${baseUrl}/api/v1/cronjob/log/stream/${log.id}`);
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
    { type: 'seq', width: 50, title: '序号' },
    { field: 'jobKey', title: '任务标识', width: 140 },
    {
      field: 'status',
      title: '状态',
      width: 100,
      slots: {
        default: ({ row }) => {
          const log = row as JobLogVO;
          const isSuccess = log.status === 'SUCCESS' || log.status === '0';
          return h(ElTag, { type: isSuccess ? 'success' : 'danger' }, () => log.status ?? '-');
        },
      },
    },
    { field: 'startTime', title: '开始时间', width: 170 },
    { field: 'endTime', title: '结束时间', width: 170 },
    { field: 'durationMs', title: '耗时(ms)', width: 100 },
    { field: 'triggerType', title: '触发类型', width: 110 },
    { field: 'errorMessage', title: '错误信息', minWidth: 160 },
    { field: 'createdAt', title: '创建时间', width: 170 },
    {
      field: 'action',
      title: '操作',
      width: 90,
      fixed: 'right',
      slots: {
        default: ({ row }) => {
          const log = row as JobLogVO;
          return h(
            ElButton,
            { size: 'small', link: true, type: 'primary', onClick: () => handleViewDetail(log) },
            () => '详情',
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
        title: '任务标识',
        itemRender: { name: 'Input', props: { placeholder: '任务标识', modelValue: presetJobKey } },
      },
      {
        field: 'status',
        title: '状态',
        itemRender: { name: 'Input', props: { placeholder: '状态' } },
      },
    ],
  },
};

const [Grid, gridApi] = useYDSZVxeGrid({ gridOptions });
</script>

<template>
  <Page auto-content-height>
    <Grid table-title="执行日志" />

    <ElDrawer v-model="detailVisible" title="执行日志详情" size="720px" @closed="handleCloseDetail">
      <template v-if="detailLog">
        <ElDescriptions :column="2" border size="small" class="mb-3">
          <ElDescriptionsItem label="任务标识">{{ detailLog.jobKey ?? '-' }}</ElDescriptionsItem>
          <ElDescriptionsItem label="状态">
            <ElTag :type="detailLog.status === 'SUCCESS' ? 'success' : 'danger'">{{
              detailLog.status ?? '-'
            }}</ElTag>
          </ElDescriptionsItem>
          <ElDescriptionsItem label="开始时间">{{ detailLog.startTime ?? '-' }}</ElDescriptionsItem>
          <ElDescriptionsItem label="结束时间">{{ detailLog.endTime ?? '-' }}</ElDescriptionsItem>
          <ElDescriptionsItem label="耗时(ms)">{{
            detailLog.durationMs ?? '-'
          }}</ElDescriptionsItem>
          <ElDescriptionsItem label="触发类型">{{
            detailLog.triggerType ?? '-'
          }}</ElDescriptionsItem>
          <ElDescriptionsItem label="执行节点">{{
            detailLog.execNodeId ?? '-'
          }}</ElDescriptionsItem>
          <ElDescriptionsItem label="TraceId">{{ detailLog.traceId ?? '-' }}</ElDescriptionsItem>
          <ElDescriptionsItem label="分片" :span="2">{{
            detailLog.shardTotal
              ? `${(detailLog.shardIndex ?? 0) + 1}/${detailLog.shardTotal}`
              : '非分片'
          }}</ElDescriptionsItem>
          <ElDescriptionsItem v-if="detailLog.paramsJson" label="任务参数" :span="2">
            <pre class="whitespace-pre-wrap break-all text-xs">{{ detailLog.paramsJson }}</pre>
          </ElDescriptionsItem>
          <ElDescriptionsItem v-if="detailLog.resultJson" label="执行结果" :span="2">
            <pre class="whitespace-pre-wrap break-all text-xs">{{ detailLog.resultJson }}</pre>
          </ElDescriptionsItem>
          <ElDescriptionsItem v-if="detailLog.errorMessage" label="错误信息" :span="2">
            <pre class="whitespace-pre-wrap break-all text-xs text-red-500">{{
              detailLog.errorMessage
            }}</pre>
          </ElDescriptionsItem>
        </ElDescriptions>

        <div class="mb-1 flex items-center gap-2 text-xs text-gray-500">
          <span>实时日志</span>
          <ElTag v-if="sseConnected" type="success" size="small">已连接</ElTag>
          <ElTag v-else size="small">已结束</ElTag>
        </div>
        <div
          ref="logBodyRef"
          class="h-80 overflow-auto rounded border border-gray-200 bg-gray-50 p-2 font-mono text-xs leading-5"
        >
          <pre v-if="logText" class="whitespace-pre-wrap break-all">{{ logText }}</pre>
          <ElEmpty v-else description="暂无日志内容" :image-size="60" />
        </div>
      </template>
    </ElDrawer>
  </Page>
</template>
