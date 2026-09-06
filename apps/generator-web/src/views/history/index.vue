<!--
 * 生成历史（列表页）
 *
 * <p>展示代码生成任务历史，支持回滚、删除、查看文件明细。
 *
 * @path apps/generator-web/src/views/history/index.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup">
/**
 * 生成历史列表页。
 *
 * <p>展示最近 N 条任务记录，支持回滚、删除、查看文件明细。
 *
 * @author ydsz-team
 * @since 1.0.0
 */
import { onMounted, ref, watch } from 'vue';

import type { VxeTableGridOptions } from '@ydsz/plugins/vxe-table';

import { Page } from '@ydsz/common-ui';

import { ElButton, ElInputNumber, ElMessage, ElMessageBox, ElTag, ElTooltip } from 'element-plus';
import { useI18n } from 'vue-i18n';

import {
  deleteHistory,
  listRecentHistory,
  rollbackHistory,
} from '#/api/history';
import type { GenHistory } from '#/api/models';

import { useYDSZVxeGrid } from '#/adapter/vxe-table';
import HistoryFileDialog from './history-file-dialog.vue';

const { t } = useI18n();

defineOptions({ name: 'HistoryManagement' });

const limit = ref(20);
const fileDialogVisible = ref(false);
const selectedHistoryId = ref<number | undefined>(undefined);

function getStatusTagType(status: string): 'success' | 'warning' | 'danger' | 'info' {
  switch (status) {
    case 'SUCCESS':
      return 'success';
    case 'PARTIAL':
      return 'warning';
    case 'FAILED':
      return 'danger';
    default:
      return 'info';
  }
}

function getStatusText(status: string): string {
  switch (status) {
    case 'SUCCESS':
      return '成功';
    case 'PARTIAL':
      return '部分成功';
    case 'FAILED':
      return '失败';
    case 'RUNNING':
      return '执行中';
    default:
      return status;
  }
}

const gridOptions: VxeTableGridOptions<GenHistory> = {
  columns: [
    { type: 'seq', width: 50, title: t('common.seq') },
    { field: 'id', title: '任务ID', width: 80 },
    { field: 'moduleName', title: '模块', width: 120 },
    { field: 'tableCount', title: '表数量', width: 80 },
    { field: 'fileCount', title: '文件数', width: 80 },
    {
      field: 'status',
      title: '状态',
      width: 100,
      slots: {
        default: ({ row }) => {
          const item = row as GenHistory;
          return h(ElTag, { type: getStatusTagType(item.status ?? '') }, () =>
            getStatusText(item.status ?? ''),
          );
        },
      },
    },
    { field: 'triggeredBy', title: '触发人', width: 100 },
    {
      field: 'startedAt',
      title: '开始时间',
      width: 170,
      formatter: ({ cellValue }) => (cellValue ? String(cellValue).replace('T', ' ') : '-'),
    },
    {
      field: 'finishedAt',
      title: '完成时间',
      width: 170,
      formatter: ({ cellValue }) => (cellValue ? String(cellValue).replace('T', ' ') : '-'),
    },
    {
      field: 'errorMessage',
      title: '错误信息',
      width: 200,
      slots: {
        default: ({ row }) => {
          const item = row as GenHistory;
          if (!item.errorMessage) return h('span', { class: 'text-gray-400' }, '-');
          return h(ElTooltip, { content: item.errorMessage, placement: 'top' }, {
            default: () =>
              h(
                'span',
                { class: 'text-red-500 truncate block max-w-[180px] cursor-help' },
                item.errorMessage.substring(0, 30) + (item.errorMessage.length > 30 ? '...' : ''),
              ),
          });
        },
      },
    },
    {
      field: 'action',
      title: t('common.actions'),
      width: 250,
      fixed: 'right',
      slots: {
        default: ({ row }) => {
          const item = row as GenHistory;
          return h('div', { class: 'flex gap-1' }, [
            h(
              ElButton,
              { size: 'small', link: true, type: 'primary', onClick: () => handleViewFiles(item) },
              () => '文件明细',
            ),
            h(
              ElButton,
              {
                size: 'small',
                link: true,
                type: 'warning',
                disabled: item.status === 'RUNNING',
                onClick: () => handleRollback(item),
              },
              () => '回滚',
            ),
            h(
              ElButton,
              { size: 'small', link: true, type: 'danger', onClick: () => handleDelete(item) },
              () => t('common.delete'),
            ),
          ]);
        },
      },
    },
  ],
  height: 'auto',
  pagerConfig: { pageSize: 20, pageSizes: [10, 20, 50] },
  toolbarConfig: { refresh: { code: 'query' }, zoom: true },
  proxyConfig: {
    ajax: {
      query: async () => {
        const items = await listRecentHistory({ limit: limit.value });
        return { items: items ?? [], total: items?.length ?? 0 };
      },
    },
  },
};

const [Grid, gridApi] = useYDSZVxeGrid({ gridOptions });

function handleViewFiles(row: GenHistory) {
  if (!row.id) return;
  selectedHistoryId.value = row.id;
  fileDialogVisible.value = true;
}

async function handleRollback(row: GenHistory) {
  if (!row.id) return;
  try {
    await ElMessageBox.confirm(
      `确定回滚任务 #${row.id} 吗？这将恢复或删除该任务生成的所有文件。`,
      '回滚确认',
      { type: 'warning' },
    );
  } catch {
    return;
  }
  try {
    await rollbackHistory({ id: row.id });
    ElMessage.success('回滚成功');
    await gridApi.query();
  } catch {
    // 错误提示由请求拦截器统一处理
  }
}

async function handleDelete(row: GenHistory) {
  if (!row.id) return;
  try {
    await ElMessageBox.confirm(`确定删除任务记录 #${row.id} 吗？`, '删除确认', {
      type: 'warning',
    });
  } catch {
    return;
  }
  try {
    await deleteHistory({ id: row.id });
    ElMessage.success('删除成功');
    await gridApi.query();
  } catch {
    // 错误提示由请求拦截器统一处理
  }
}

watch(
  () => limit.value,
  () => {
    void gridApi.query();
  },
);

onMounted(() => {});
</script>

<template>
  <Page auto-content-height>
    <div class="mb-4 flex items-center gap-4">
      <span class="text-sm text-gray-600">显示最近</span>
      <ElInputNumber v-model="limit" :min="5" :max="100" :step="5" />
      <span class="text-sm text-gray-600">条记录</span>
    </div>
    <Grid table-title="生成历史" />
    <HistoryFileDialog
      v-if="fileDialogVisible"
      v-model:visible="fileDialogVisible"
      :history-id="selectedHistoryId"
    />
  </Page>
</template>
