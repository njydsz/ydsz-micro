<!--
 * DAG 运行实例（列表 + 控制 + 详情）
 *
 * @path apps\cronjob-web\src\views\job-dag-instance\index.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
/**
 * DAG 运行实例页（P1-DAG 运行态闭环）
 * <p>消费后端契约 jobDagInstance.ts / dagInstanceControl.ts / taskTopology.ts（auto-generated）：
 * 按状态筛选实例列表、暂停/恢复/取消实例控制、详情抽屉（基本信息 + 节点执行明细 + mermaid 拓扑源码）。
 *
 * <p>拓扑渲染说明：后端已输出 mermaid 文本，当前以源码只读展示（零新增依赖）；
 * 待 monorepo 统一画布选型（X6/LogicFlow）后替换为可视化渲染。
 *
 * @author ydsz-team
 * @since 1.0.0
 */
import { Page } from '@ydsz/common-ui';

import { YdBadge, YdButton, YdTable, YdTableColumn, YdSelectBase, YdSelectContentBase, YdSelectItemBase, YdSelectTriggerBase, YdSelectValueBase, YdSheet, YdSheetContent, YdSheetHeader, YdSheetTitle, YdEmptyState, YdDescriptions, YdDescriptionsItem } from '@ydsz-core/ydsz-ui';
import { h, onMounted, ref } from 'vue';

import { useYDSZVxeGrid } from '#/adapter/vxe-table';
import { cancel, pause, resume, retryNode } from '#/api/dagInstanceControl';
import { listByStatus, listNodes, getMermaidDiagram } from '#/api/jobDagInstance';
import type { JobDagInstanceVO, JobDagNodeInstanceVO } from '#/api/models';

import { createLogger } from '@ydsz-core/shared/utils';

const logger = createLogger('cronjob-job');

defineOptions({ name: 'JobDagInstanceManagement' });

/** 实例状态 → Tag 类型映射 */
const STATUS_TAG: Record<string, 'primary' | 'success' | 'danger' | 'warning' | 'info'> = {
  PENDING: 'info',
  RUNNING: 'primary',
  PAUSED: 'warning',
  SUCCESS: 'success',
  FAILED: 'danger',
  PARTIAL_SUCCESS: 'warning',
  CANCELLED: 'info',
};

/** 运行态状态（可暂停/恢复/取消） */
function isRunning(status?: string): boolean {
  return status === 'RUNNING' || status === 'PENDING';
}

const gridOptions = {
  columns: [
    { type: 'seq', width: 50, title: '序号' },
    { field: 'dagKey', title: 'DAG标识', width: 150 },
    {
      field: 'instanceStatus',
      title: '状态',
      width: 130,
      slots: {
        default: ({ row }: { row: JobDagInstanceVO }) =>
          h(
            YdBadge,
            { variant: STATUS_TAG[row.instanceStatus ?? ''] ?? 'info' },
            () => row.instanceStatus ?? '-',
          ),
      },
    },
    { field: 'triggerType', title: '触发方式', width: 100 },
    { field: 'triggerBy', title: '触发人', width: 100 },
    {
      field: 'totalNodes',
      title: '节点进度',
      width: 140,
      slots: {
        default: ({ row }: { row: JobDagInstanceVO }) =>
          h(
            'span',
            {},
            () =>
              `${row.successNodes ?? 0}/${row.totalNodes ?? 0} 成功, ${row.failedNodes ?? 0} 失败`,
          ),
      },
    },
    { field: 'durationMs', title: '耗时(ms)', width: 100 },
    { field: 'startedAt', title: '开始时间', width: 170 },
    { field: 'finishedAt', title: '结束时间', width: 170 },
    { field: 'errorMessage', title: '错误信息', minWidth: 140 },
    { field: 'createdAt', title: '创建时间', width: 170 },
    {
      field: 'action',
      title: '操作',
      width: 220,
      fixed: 'right',
      slots: {
        default: ({ row }: { row: JobDagInstanceVO }) =>
          h('div', { class: 'flex gap-1' }, [
            h(
              YdButton,
              { size: 'sm', variant: 'link', onClick: () => handleViewDetail(row) },
              () => '详情',
            ),
            isRunning(row.instanceStatus)
              ? h(
                  YdButton,
                  { size: 'sm', variant: 'link', onClick: () => handlePause(row) },
                  () => '暂停',
                )
              : row.instanceStatus === 'PAUSED'
                ? h(
                    YdButton,
                    {
                      size: 'sm',
                      variant: 'link',
                      onClick: () => handleResume(row),
                    },
                    () => '恢复',
                  )
                : null,
            isRunning(row.instanceStatus) || row.instanceStatus === 'PAUSED'
              ? h(
                  YdButton,
                  { size: 'sm', variant: 'link', onClick: () => handleCancel(row) },
                  () => '取消',
                )
              : null,
          ]),
      },
    },
  ],
  height: 'auto',
  toolbarConfig: { custom: true, refresh: { code: 'query' }, search: true, zoom: true },
};

const [Grid, gridApi] = useYDSZVxeGrid({ gridOptions });

/** 状态筛选值（空=全部） */
const statusFilter = ref<string>('');

/** 查询实例列表（按状态筛选，无分页由后端返回全量） */
async function queryInstances() {
  const status = statusFilter.value || 'ALL';
  const res = await listByStatus({ status });
  const list = res ?? [];
  // 手工写入 vxe-grid 数据（无分页接口，走全量渲染）
  gridApi.grid.loadData(list);
}

onMounted(() => queryInstances());

// ==================== 实例控制 ====================

async function handlePause(row: JobDagInstanceVO) {
  if (!row.id) return;
  try {
    await pause({ instanceId: row.id });
    showToast.success('已暂停');
    gridApi.query();
  } catch {
    logger.warn('暂停DAG实例失败', row.id);
    // 错误提示由请求拦截器统一处理
  }
}

async function handleResume(row: JobDagInstanceVO) {
  if (!row.id) return;
  try {
    await resume({ instanceId: row.id });
    showToast.success('已恢复');
    gridApi.query();
  } catch {
    logger.warn('恢复DAG实例失败', row.id);
    // 错误提示由请求拦截器统一处理
  }
}

async function handleCancel(row: JobDagInstanceVO) {
  if (!row.id) return;
  // 步骤1：确认弹窗（用户取消直接返回）
  try {
    await YdConfirm(`确定取消 DAG 实例「${row.dagKey}」吗？`, { title: '取消确认', type: 'warning', });
  } catch {
    logger.warn('用户取消DAG实例', row.id);
    return; // 用户主动取消操作
  }
  // 步骤2：执行取消 API（失败提示由 errorMessageResponseInterceptor 统一处理）
  try {
    await cancel({ instanceId: row.id });
    showToast.success('已取消');
    gridApi.query();
  } catch {
    logger.warn('取消DAG实例失败', row.id);
    // 错误已由请求拦截器展示，无需重复处理
  }
}

// ==================== 详情抽屉 ====================

const detailVisible = ref(false);
const detailLog = ref<JobDagInstanceVO | null>(null);
const nodes = ref<JobDagNodeInstanceVO[]>([]);
const mermaidText = ref('');

async function handleViewDetail(row: JobDagInstanceVO) {
  detailVisible.value = true;
  detailLog.value = row;
  nodes.value = [];
  mermaidText.value = '';
  if (!row.id) return;
  try {
    const [nodeList, mermaid] = await Promise.all([
      listNodes({ instanceId: row.id }),
      getMermaidDiagram({ instanceId: row.id }),
    ]);
    nodes.value = nodeList ?? [];
    mermaidText.value = typeof mermaid === 'string' ? mermaid : '';
  } catch {
    logger.warn('加载DAG实例详情失败', row.id);
    // 错误提示由请求拦截器统一处理
  }
}

async function handleRetryNode(node: JobDagNodeInstanceVO) {
  if (!detailLog.value?.id || !node.id) return;
  try {
    await retryNode({ instanceId: detailLog.value.id, nodeInstanceId: node.id });
    showToast.success('节点重试已触发');
  } catch {
    logger.warn('重试DAG节点失败', node.id);
    // 错误提示由请求拦截器统一处理
  }
}
</script>

<template>
  <Page auto-content-height>
    <Grid table-title="DAG 运行实例">
      <template #toolbar-tools>
        <YdSelectBase v-model="statusFilter" @update:model-value="queryInstances">
          <YdSelectTriggerBase class="w-[140px]">
            <YdSelectValueBase placeholder="状态筛选" />
          </YdSelectTriggerBase>
          <YdSelectContentBase>
            <YdSelectItemBase value="PENDING">待执行</YdSelectItemBase>
            <YdSelectItemBase value="RUNNING">执行中</YdSelectItemBase>
            <YdSelectItemBase value="PAUSED">已暂停</YdSelectItemBase>
            <YdSelectItemBase value="SUCCESS">成功</YdSelectItemBase>
            <YdSelectItemBase value="FAILED">失败</YdSelectItemBase>
            <YdSelectItemBase value="PARTIAL_SUCCESS">部分成功</YdSelectItemBase>
            <YdSelectItemBase value="CANCELLED">已取消</YdSelectItemBase>
          </YdSelectContentBase>
        </YdSelectBase>
      </template>
    </Grid>

    <YdSheet v-model:open="detailVisible">
      <YdSheetContent side="right" class="w-[760px]">
        <YdSheetHeader>
          <YdSheetTitle>DAG 实例详情</YdSheetTitle>
        </YdSheetHeader>
      <template v-if="detailLog">
        <YdDescriptions :column="2" border size="small" class="mb-3">
          <YdDescriptionsItem label="DAG标识">{{ detailLog.dagKey ?? '-' }}</YdDescriptionsItem>
          <YdDescriptionsItem label="状态">
            <YdBadge :variant="STATUS_TAG[detailLog.instanceStatus ?? ''] ?? 'info'">{{
              detailLog.instanceStatus ?? '-'
            }}</YdBadge>
          </YdDescriptionsItem>
          <YdDescriptionsItem label="触发方式">{{
            detailLog.triggerType ?? '-'
          }}</YdDescriptionsItem>
          <YdDescriptionsItem label="触发人">{{ detailLog.triggerBy ?? '-' }}</YdDescriptionsItem>
          <YdDescriptionsItem label="开始时间">{{ detailLog.startedAt ?? '-' }}</YdDescriptionsItem>
          <YdDescriptionsItem label="结束时间">{{
            detailLog.finishedAt ?? '-'
          }}</YdDescriptionsItem>
          <YdDescriptionsItem label="耗时(ms)">{{
            detailLog.durationMs ?? '-'
          }}</YdDescriptionsItem>
          <YdDescriptionsItem label="TraceId">{{
            detailLog.triggerTraceId ?? '-'
          }}</YdDescriptionsItem>
          <YdDescriptionsItem v-if="detailLog.errorMessage" label="错误信息" :span="2">
            <pre class="whitespace-pre-wrap break-all text-xs text-red-500">{{
              detailLog.errorMessage
            }}</pre>
          </YdDescriptionsItem>
        </YdDescriptions>

        <div class="mb-1 text-sm font-medium">节点执行明细</div>
        <YdTable v-if="nodes.length" :data="nodes" border size="small" class="mb-3">
          <YdTableColumn prop="nodeId" label="节点ID" min-width="110" show-overflow-tooltip />
          <YdTableColumn prop="jobKey" label="任务标识" min-width="120" show-overflow-tooltip />
          <YdTableColumn label="状态" width="110">
            <template #default="{ row }">
              <YdBadge :variant="STATUS_TAG[row.nodeStatus ?? ''] ?? 'info'" size="sm">{{
                row.nodeStatus ?? '-'
              }}</YdBadge>
            </template>
          </YdTableColumn>
          <YdTableColumn prop="durationMs" label="耗时(ms)" width="90" />
          <YdTableColumn label="操作" width="100">
            <template #default="{ row }">
              <YdButton
                v-if="row.nodeStatus === 'FAILED'"
                size="sm"
                variant="link"
                @click="handleRetryNode(row)"
                >重试</YdButton
              >
            </template>
          </YdTableColumn>
        </YdTable>
        <YdEmptyState v-else description="暂无节点明细" :image-size="60" class="mb-3" />

        <div class="mb-1 text-sm font-medium">工作流拓扑（mermaid 源码）</div>
        <pre
          v-if="mermaidText"
          class="max-h-64 overflow-auto whitespace-pre-wrap break-all rounded border border-gray-200 bg-gray-50 p-2 font-mono text-xs leading-5"
          >{{ mermaidText }}</pre>
        <YdEmptyState v-else description="暂无拓扑数据" :image-size="60" />
      </template>
      </YdSheetContent>
    </YdSheet>
  </Page>
</template>
