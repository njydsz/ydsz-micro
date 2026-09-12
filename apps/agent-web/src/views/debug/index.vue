<!--
 * Agent 链路调试面板
 *
 * <p>展示 Agent 执行 Trace 列表，支持查看调用链详情和执行重放。
 *
 * @path apps/agent-web/src/views/debug/index.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
/**
 * Agent 链路调试面板
 * <p>消费后端契约 DebugController（apps/agent-web/src/api/debug.ts）：
 * listTraces / getTrace / replayTrace。
 *
 * @author ydsz-team
 * @since 1.0.0
 */
import type { VxeTableGridOptions } from '@ydsz/plugins/vxe-table';

import { Page } from '@ydsz/common-ui';

import { createLogger } from '@ydsz-core/shared/utils';
import {
  ElButton,
  ElCard,
  ElDialog,
  ElEmpty,
  ElInput,
  ElMessageBox,
  ElOption,
  ElSelect,
  ElStatistic,
  ElTag,
  ElTimeline,
  ElTimelineItem,
} from 'element-plus';
import { computed, h, onMounted, ref } from 'vue';

import { getTrace, listTraces, replayTrace } from '#/api/debug';
import type { AgentTraceDetailDTO, AgentTraceListDTO } from '#/api/models';
import { useYDSZVxeGrid } from '#/adapter/vxe-table';

defineOptions({ name: 'DebugManagement' });

const logger = createLogger('agent-debug');

// =====================================================================
// 搜索区
// =====================================================================

const searchTraceId = ref('');
const searchStatus = ref<string>('');
const searchModelRef = ref<string>('');

// =====================================================================
// 数据状态
// =====================================================================

const loading = ref(false);
const traceList = ref<AgentTraceListDTO[]>([]);
const selectedTraces = ref<AgentTraceListDTO[]>([]);

// =====================================================================
// 详情弹窗
// =====================================================================

const detailVisible = ref(false);
const detailLoading = ref(false);
const detailData = ref<AgentTraceDetailDTO | null>(null);

// =====================================================================
// 顶部指标
// =====================================================================

const totalTraces = computed(() => traceList.value.length);
const successCount = computed(() => traceList.value.filter((item) => item.status === 'SUCCESS').length);
const failedCount = computed(() => traceList.value.filter((item) => item.status === 'FAILED').length);
const successRate = computed(() => {
  if (totalTraces.value === 0) return '0.0';
  return ((successCount.value / totalTraces.value) * 100).toFixed(1);
});
const avgDuration = computed(() => {
  if (totalTraces.value === 0) return '0';
  const total = traceList.value.reduce((sum, item) => sum + (item.duration ?? 0), 0);
  return (total / totalTraces.value).toFixed(0);
});

// =====================================================================
// 工具函数
// =====================================================================

function statusTagType(status: string): 'success' | 'danger' | 'warning' | 'info' {
  switch ((status ?? '').toUpperCase()) {
    case 'SUCCESS':
    case 'COMPLETED':
      return 'success';
    case 'FAILED':
    case 'ERROR':
      return 'danger';
    case 'RUNNING':
    case 'PENDING':
      return 'warning';
    default:
      return 'info';
  }
}

function formatDuration(ms: number | undefined): string {
  if (!ms && ms !== 0) return '-';
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

// =====================================================================
// 数据加载
// =====================================================================

async function loadTraces(): Promise<void> {
  loading.value = true;
  try {
    const params: { limit?: number; status?: string; model?: string } = { limit: 50 };
    if (searchStatus.value) params.status = searchStatus.value;
    if (searchModelRef.value) params.model = searchModelRef.value;
    traceList.value = await listTraces(params);
  } catch (error) {
    logger.warn('加载 Trace 列表失败: {}', error);
  } finally {
    loading.value = false;
  }
}

// =====================================================================
// 操作处理
// =====================================================================

async function handleSearchById(): Promise<void> {
  if (!searchTraceId.value.trim()) return;
  try {
    detailLoading.value = true;
    detailData.value = await getTrace({ executionId: searchTraceId.value.trim() });
    detailVisible.value = true;
  } catch (error) {
    logger.warn('查询 Trace 详情失败: {}', error);
  } finally {
    detailLoading.value = false;
  }
}

async function handleViewDetail(row: AgentTraceListDTO): Promise<void> {
  const id = row.executionId ?? row.traceId ?? '';
  if (!id) return;
  detailLoading.value = true;
  try {
    detailData.value = await getTrace({ executionId: id });
    detailVisible.value = true;
  } catch (error) {
    logger.warn('查询 Trace 详情失败: {}', error);
  } finally {
    detailLoading.value = false;
  }
}

async function handleReplay(row: AgentTraceListDTO): Promise<void> {
  const id = row.executionId ?? row.traceId ?? '';
  ElMessageBox.confirm(`确认重放 Trace「${id}」？`, '重放确认', { type: 'warning' })
    .then(async () => {
      try {
        const newTraceId = await replayTrace({ executionId: id });
        ElMessage.success(`重放成功，新 Trace ID: ${newTraceId}`);
        await loadTraces();
      } catch (error) {
        logger.warn('重放 Trace 失败: {}', error);
      }
    })
    .catch(() => {
      /* 用户关闭确认框 */
    });
}

async function handleBatchReplay(): Promise<void> {
  if (selectedTraces.value.length === 0) {
    ElMessage.warning('请至少选择一个 Trace');
    return;
  }
  ElMessageBox.confirm(`确认批量重放选中的 ${selectedTraces.value.length} 条 Trace？`, '批量重放', { type: 'warning' })
    .then(async () => {
      for (const item of selectedTraces.value) {
        const id = item.executionId ?? item.traceId ?? '';
        if (id) {
          await replayTrace({ executionId: id });
        }
      }
      ElMessage.success('批量重放完成');
      await loadTraces();
    })
    .catch(() => {
      /* 用户关闭确认框 */
    });
}

function handleSelectionChange(rows: AgentTraceListDTO[]): void {
  selectedTraces.value = rows;
}

// =====================================================================
// 表格配置
// =====================================================================

const gridOptions: VxeTableGridOptions<AgentTraceListDTO> = {
  columns: [
    { type: 'checkbox', width: 40 },
    { field: 'traceId', title: 'Trace ID', width: 140 },
    { field: 'agentCode', title: 'Agent', width: 120 },
    { field: 'model', title: '模型', width: 100 },
    {
      field: 'status',
      title: '状态',
      width: 90,
      slots: {
        default: ({ row }) => h(ElTag, { type: statusTagType(row.status ?? '') }, () => row.status ?? '-'),
      },
    },
    {
      field: 'duration',
      title: '耗时',
      width: 90,
      slots: {
        default: ({ row }) => h('span', {}, formatDuration(row.duration)),
      },
    },
    { field: 'tokenCount', title: 'Token', width: 80 },
    { field: 'startTime', title: '开始时间', width: 160 },
    {
      field: 'action',
      title: '操作',
      width: 150,
      fixed: 'right',
      slots: {
        default: ({ row }) => h('div', { class: 'flex gap-1' }, [
          h(ElButton, { size: 'small', link: true, type: 'primary', onClick: () => handleViewDetail(row) }, () => '详情'),
          h(ElButton, { size: 'small', link: true, type: 'warning', onClick: () => handleReplay(row) }, () => '重放'),
        ]),
      },
    },
  ],
  height: 'auto',
  pagerConfig: { pageSize: 20, pageSizes: [10, 20, 50, 100] },
  proxyConfig: {
    ajax: {

      query: async () => ({ items: traceList.value, total: traceList.value.length }),
    },
  },
  checkboxConfig: { reserve: true, strict: false },
  toolbarConfig: { refresh: { code: 'query' }, zoom: true },
};

const [Grid] = useYDSZVxeGrid({ gridOptions });

onMounted(() => {
  void loadTraces();
});
</script>

<template>
  <Page auto-content-height>
    <div v-loading="loading" class="space-y-4 p-4">
      <!-- 指标卡片 -->
      <div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
        <ElCard shadow="never">
          <ElStatistic title="Trace 总数" :value="totalTraces" />
        </ElCard>
        <ElCard shadow="never">
          <ElStatistic title="成功数" :value="successCount" value-style="color: #67c23a" />
        </ElCard>
        <ElCard shadow="never">
          <ElStatistic title="失败数" :value="failedCount" value-style="color: #f56c6c" />
        </ElCard>
        <ElCard shadow="never">
          <ElStatistic title="成功率" :value="Number(successRate)" suffix="%" :precision="1" />
        </ElCard>
        <ElCard shadow="never">
          <ElStatistic title="平均耗时" :value="Number(avgDuration)" suffix="ms" />
        </ElCard>
      </div>

      <!-- 搜索区 -->
      <div class="flex flex-wrap items-center gap-3">
        <ElInput
          v-model="searchTraceId"
          placeholder="按 Trace ID 搜索..."
          class="w-64"
          clearable
          @keyup.enter="handleSearchById"
        />
        <ElSelect v-model="searchStatus" placeholder="状态筛选" clearable class="w-32">
          <ElOption label="成功" value="SUCCESS" />
          <ElOption label="失败" value="FAILED" />
          <ElOption label="运行中" value="RUNNING" />
        </ElSelect>
        <ElInput v-model="searchModelRef" placeholder="模型筛选..." class="w-40" clearable />
        <ElButton type="primary" @click="loadTraces">查询</ElButton>
        <ElButton type="warning" :disabled="selectedTraces.length === 0" @click="handleBatchReplay">
          批量重放({{ selectedTraces.length }})
        </ElButton>
      </div>

      <!-- Trace 表格 -->
      <Grid @checkbox-change="handleSelectionChange" />
    </div>

    <!-- 详情弹窗 -->
    <ElDialog v-model="detailVisible" title="Trace 详情" width="800px" top="5vh">
      <div v-loading="detailLoading">
        <div v-if="detailData" class="space-y-4">
          <!-- 基本信息 -->
          <div class="grid grid-cols-2 gap-3 rounded border bg-gray-50 p-3 text-sm">
            <div><span class="text-gray-500">Trace ID:</span> {{ detailData.traceId }}</div>
            <div><span class="text-gray-500">Agent:</span> {{ detailData.agentCode }}</div>
            <div><span class="text-gray-500">模型:</span> {{ detailData.model }}</div>
            <div>
              <span class="text-gray-500">状态:</span>
              <ElTag :type="statusTagType(detailData.status ?? '')">{{ detailData.status }}</ElTag>
            </div>
            <div><span class="text-gray-500">耗时:</span> {{ formatDuration(detailData.duration) }}</div>
            <div><span class="text-gray-500">Token:</span> {{ detailData.tokenCount }}</div>
          </div>

          <!-- 输入输出 -->
          <div v-if="detailData.input">
            <h4 class="mb-2 text-sm font-medium">输入</h4>
            <div class="max-h-32 overflow-auto rounded border bg-gray-50 p-3 text-sm">{{ detailData.input }}</div>
          </div>
          <div v-if="detailData.output">
            <h4 class="mb-2 text-sm font-medium">输出</h4>
            <div class="max-h-32 overflow-auto rounded border bg-gray-50 p-3 text-sm">{{ detailData.output }}</div>
          </div>

          <!-- 执行链路 -->
          <div v-if="detailData.steps && detailData.steps.length > 0">
            <h4 class="mb-2 text-sm font-medium">执行链路</h4>
            <ElTimeline>
              <ElTimelineItem
                v-for="(step, idx) in detailData.steps"
                :key="step.stepName ?? `step-${idx}`"
                :timestamp="step.duration ? `${step.duration}ms` : undefined"
                placement="top"
              >
                <div class="text-sm">
                  <span class="font-medium">{{ step.stepName ?? `Step ${idx + 1}` }}</span>
                  <span v-if="step.toolName" class="ml-2 text-gray-500">工具: {{ step.toolName }}</span>
                </div>
              </ElTimelineItem>
            </ElTimeline>
          </div>
        </div>
        <ElEmpty v-else description="暂无数据" />
      </div>
    </ElDialog>
  </Page>
</template>
