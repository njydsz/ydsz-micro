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

import {
  ElButton,
  ElDescriptions,
  ElDescriptionsItem,
  ElDrawer,
  ElEmpty,
  ElMessage,
  ElMessageBox,
  ElOption,
  ElSelect,
  ElTable,
  ElTableColumn,
  ElTag,
} from 'element-plus';
import { h, onMounted, ref } from 'vue';

import { useYDSZVxeGrid } from '#/adapter/vxe-table';
import { cancel, pause, resume, retryNode } from '#/api/dagInstanceControl';
import { listByStatus, listNodes, getMermaidDiagram } from '#/api/jobDagInstance';
import type { JobDagInstanceVO, JobDagNodeInstanceVO } from '#/api/models';

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
            ElTag,
            { type: STATUS_TAG[row.instanceStatus ?? ''] ?? 'info' },
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
              ElButton,
              { size: 'small', link: true, type: 'primary', onClick: () => handleViewDetail(row) },
              () => '详情',
            ),
            isRunning(row.instanceStatus)
              ? h(
                  ElButton,
                  { size: 'small', link: true, type: 'warning', onClick: () => handlePause(row) },
                  () => '暂停',
                )
              : row.instanceStatus === 'PAUSED'
                ? h(
                    ElButton,
                    {
                      size: 'small',
                      link: true,
                      type: 'success',
                      onClick: () => handleResume(row),
                    },
                    () => '恢复',
                  )
                : null,
            isRunning(row.instanceStatus) || row.instanceStatus === 'PAUSED'
              ? h(
                  ElButton,
                  { size: 'small', link: true, type: 'danger', onClick: () => handleCancel(row) },
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
    ElMessage.success('已暂停');
    gridApi.query();
  } catch {
    // 错误提示由请求拦截器统一处理
  }
}

async function handleResume(row: JobDagInstanceVO) {
  if (!row.id) return;
  try {
    await resume({ instanceId: row.id });
    ElMessage.success('已恢复');
    gridApi.query();
  } catch {
    // 错误提示由请求拦截器统一处理
  }
}

async function handleCancel(row: JobDagInstanceVO) {
  if (!row.id) return;
  // 步骤1：确认弹窗（用户取消直接返回）
  try {
    await ElMessageBox.confirm(`确定取消 DAG 实例「${row.dagKey}」吗？`, '取消确认', {
      type: 'warning',
    });
  } catch {
    return; // 用户主动取消操作
  }
  // 步骤2：执行取消 API（失败提示由 errorMessageResponseInterceptor 统一处理）
  try {
    await cancel({ instanceId: row.id });
    ElMessage.success('已取消');
    gridApi.query();
  } catch {
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
    // 错误提示由请求拦截器统一处理
  }
}

async function handleRetryNode(node: JobDagNodeInstanceVO) {
  if (!detailLog.value?.id || !node.id) return;
  try {
    await retryNode({ instanceId: detailLog.value.id, nodeInstanceId: node.id });
    ElMessage.success('节点重试已触发');
  } catch {
    // 错误提示由请求拦截器统一处理
  }
}
</script>

<template>
  <Page auto-content-height>
    <Grid table-title="DAG 运行实例">
      <template #toolbar-tools>
        <ElSelect
          v-model="statusFilter"
          placeholder="状态筛选"
          clearable
          style="width: 140px"
          @change="queryInstances"
        >
          <ElOption label="待执行" value="PENDING" />
          <ElOption label="执行中" value="RUNNING" />
          <ElOption label="已暂停" value="PAUSED" />
          <ElOption label="成功" value="SUCCESS" />
          <ElOption label="失败" value="FAILED" />
          <ElOption label="部分成功" value="PARTIAL_SUCCESS" />
          <ElOption label="已取消" value="CANCELLED" />
        </ElSelect>
      </template>
    </Grid>

    <ElDrawer v-model="detailVisible" title="DAG 实例详情" size="760px">
      <template v-if="detailLog">
        <ElDescriptions :column="2" border size="small" class="mb-3">
          <ElDescriptionsItem label="DAG标识">{{ detailLog.dagKey ?? '-' }}</ElDescriptionsItem>
          <ElDescriptionsItem label="状态">
            <ElTag :type="STATUS_TAG[detailLog.instanceStatus ?? ''] ?? 'info'">{{
              detailLog.instanceStatus ?? '-'
            }}</ElTag>
          </ElDescriptionsItem>
          <ElDescriptionsItem label="触发方式">{{
            detailLog.triggerType ?? '-'
          }}</ElDescriptionsItem>
          <ElDescriptionsItem label="触发人">{{ detailLog.triggerBy ?? '-' }}</ElDescriptionsItem>
          <ElDescriptionsItem label="开始时间">{{ detailLog.startedAt ?? '-' }}</ElDescriptionsItem>
          <ElDescriptionsItem label="结束时间">{{
            detailLog.finishedAt ?? '-'
          }}</ElDescriptionsItem>
          <ElDescriptionsItem label="耗时(ms)">{{
            detailLog.durationMs ?? '-'
          }}</ElDescriptionsItem>
          <ElDescriptionsItem label="TraceId">{{
            detailLog.triggerTraceId ?? '-'
          }}</ElDescriptionsItem>
          <ElDescriptionsItem v-if="detailLog.errorMessage" label="错误信息" :span="2">
            <pre class="whitespace-pre-wrap break-all text-xs text-red-500">{{
              detailLog.errorMessage
            }}</pre>
          </ElDescriptionsItem>
        </ElDescriptions>

        <div class="mb-1 text-sm font-medium">节点执行明细</div>
        <ElTable v-if="nodes.length" :data="nodes" border size="small" class="mb-3">
          <ElTableColumn prop="nodeId" label="节点ID" min-width="110" show-overflow-tooltip />
          <ElTableColumn prop="jobKey" label="任务标识" min-width="120" show-overflow-tooltip />
          <ElTableColumn label="状态" width="110">
            <template #default="{ row }">
              <ElTag :type="STATUS_TAG[row.nodeStatus ?? ''] ?? 'info'" size="small">{{
                row.nodeStatus ?? '-'
              }}</ElTag>
            </template>
          </ElTableColumn>
          <ElTableColumn prop="durationMs" label="耗时(ms)" width="90" />
          <ElTableColumn label="操作" width="100">
            <template #default="{ row }">
              <ElButton
                v-if="row.nodeStatus === 'FAILED'"
                size="small"
                link
                type="primary"
                @click="handleRetryNode(row)"
                >重试</ElButton
              >
            </template>
          </ElTableColumn>
        </ElTable>
        <ElEmpty v-else description="暂无节点明细" :image-size="60" class="mb-3" />

        <div class="mb-1 text-sm font-medium">工作流拓扑（mermaid 源码）</div>
        <pre
          v-if="mermaidText"
          class="max-h-64 overflow-auto whitespace-pre-wrap break-all rounded border border-gray-200 bg-gray-50 p-2 font-mono text-xs leading-5"
          >{{ mermaidText }}</pre>
        <ElEmpty v-else description="暂无拓扑数据" :image-size="60" />
      </template>
    </ElDrawer>
  </Page>
</template>
