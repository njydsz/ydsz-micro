<!--
 * 回收站（列表页）
 *
 * @path apps\nextwiki-web\src\views\trash\index.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
/**
 * 回收站（列表页）
 * <p>消费后端契约 TrashController（apps/nextwiki-web/src/api/trash.ts）：
 * list() 展示已删除文件列表，支持批量选择 + 批量还原 batchRestore、
 * 单行还原 restore、单行永久删除 purge、清空回收站 emptyTrash。
 * <p>超期未还原的数据将由后端定时任务自动清理（purgeTime 到期后删除）。
 *
 * @author ydsz-team
 * @since 1.0.0
 */
import type { VxeGridProps } from '@ydsz/plugins/vxe-table';
import { Page } from '@ydsz/common-ui';
import { ElButton, ElMessage, ElMessageBox, ElTag } from 'element-plus';
import { h, ref } from 'vue';
import { createLogger } from '@YDSZ-core/shared/utils';
import { useI18n } from 'vue-i18n';
import { useYDSZVxeGrid } from '#/adapter/vxe-table';
const logger = createLogger('nextwiki-trash');
const { t } = useI18n();
import { batchRestore, emptyTrash, list, purge, restore } from '#/api/trash';
import type { TrashItemVO } from '#/api/models';

defineOptions({ name: 'TrashManagement' });

function formatFileSize(bytes?: number): string {
  if (!bytes || bytes <= 0) return '-';
  const units = ['B', 'KB', 'MB', 'GB'];
  let value = bytes;
  let unitIdx = 0;
  while (value >= 1024 && unitIdx < units.length - 1) {
    value /= 1024;
    unitIdx++;
  }
  return `${value.toFixed(unitIdx === 0 ? 0 : 1)} ${units[unitIdx]}`;
}

const gridOptions: VxeGridProps<TrashItemVO> = {
  columns: [
    { type: 'checkbox', width: 50 },
    { type: 'seq', width: 50, title: t('seq') },
    { field: 'originalName', title: t('trashOriginalName'), minWidth: 180 },
    { field: 'originalPath', title: t('trashOriginalPath'), minWidth: 200 },
    {
      field: 'nodeType',
      title: t('trashNodeType'),
      width: 100,
      slots: {
        default: ({ row }) =>
          h(ElTag, { type: row.nodeType === 'DIRECTORY' ? 'info' : 'primary' }, () =>
            row.nodeType === 'DIRECTORY' ? t('nodeTypeDirectory') : t('nodeTypeFile'),
          ),
      },
    },
    {
      field: 'size',
      title: t('trashSize'),
      width: 110,
      formatter: ({ row }) => formatFileSize(row.size),
    },
    { field: 'deletedTime', title: t('trashDeletedTime'), width: 170 },
    { field: 'purgeTime', title: t('trashPurgeTime'), width: 170 },
    {
      field: 'status',
      title: t('status'),
      width: 100,
      slots: {
        default: ({ row }) => {
          const statusMap: Record<string, { label: string; type: 'success' | 'warning' | 'danger' }> = {
            PENDING: { label: t('trashStatusPending'), type: 'warning' },
            PURGED: { label: t('trashStatusPurged'), type: 'danger' },
            RESTORED: { label: t('trashStatusRestored'), type: 'success' },
          };
          const info = statusMap[row.status ?? ''] ?? { label: row.status ?? '--', type: 'warning' as const };
          return h(ElTag, { type: info.type }, () => info.label);
        },
      },
    },
    {
      field: 'action',
      title: t('action'),
      width: 180,
      fixed: 'right',
      slots: {
        default: ({ row }) =>
          h('div', { class: 'flex gap-1' }, [
            h(ElButton, {
              size: 'small',
              link: true,
              type: 'primary',
              disabled: row.status !== 'PENDING',
              onClick: () => handleRestore(row),
            }, () => t('trashRestore')),
            h(ElButton, {
              size: 'small',
              link: true,
              type: 'danger',
              disabled: row.status !== 'PENDING',
              onClick: () => handlePurge(row),
            }, () => t('trashPurge')),
          ]),
      },
    },
  ],
  height: 'auto',
  checkboxConfig: { reserve: false, highlight: true, range: false },
  proxyConfig: {
    ajax: {
      query: async () => {
        const items = await list();
        return { items, total: items.length };
      },
    },
  },
  toolbarConfig: { custom: true, refresh: { code: 'query' }, zoom: true },
};
const [Grid, gridApi] = useYDSZVxeGrid({ gridOptions });

async function handleRestore(row: TrashItemVO) {
  if (!row.id) return;
  try {
    await ElMessageBox.confirm(t('trashRestoreConfirm'), t('trashRestore'), { type: 'warning' });
    await restore({ trashItemId: row.id });
    ElMessage.success(t('trashRestoreSuccess'));
    gridApi.query();
  } catch (error) {
    logger.warn('还原失败: {}', error);
    /* 用户提示由请求拦截器统一处理 */
  }
}

async function handlePurge(row: TrashItemVO) {
  if (!row.id) return;
  try {
    await ElMessageBox.confirm(t('trashPurgeConfirm'), t('trashPurge'), { type: 'error' });
    await purge({ trashItemId: row.id });
    ElMessage.success(t('trashPurgeSuccess'));
    gridApi.query();
  } catch (error) {
    logger.warn('永久删除失败: {}', error);
    /* 用户提示由请求拦截器统一处理 */
  }
}

async function handleBatchRestore() {
  const records = gridApi.getCheckboxRecords();
  if (records.length === 0) {
    ElMessage.warning(t('trashBatchSelectTip'));
    return;
  }
  const ids = records.filter(r => r.status === 'PENDING').map(r => r.id!).filter(Boolean);
  if (ids.length === 0) {
    ElMessage.warning(t('trashBatchNoValid'));
    return;
  }
  try {
    await ElMessageBox.confirm(t('trashBatchRestoreConfirm'), t('trashBatchRestore'), { type: 'warning' });
    await batchRestore(ids);
    ElMessage.success(t('trashBatchRestoreSuccess'));
    gridApi.query();
  } catch (error) {
    logger.warn('批量还原失败: {}', error);
    /* 用户提示由请求拦截器统一处理 */
  }
}

async function handleEmptyTrash() {
  try {
    await ElMessageBox.confirm(t('trashEmptyConfirm'), t('trashEmpty'), { type: 'error' });
    await emptyTrash();
    ElMessage.success(t('trashEmptySuccess'));
    gridApi.query();
  } catch (error) {
    logger.warn('清空回收站失败: {}', error);
    /* 用户提示由请求拦截器统一处理 */
  }
}
</script>

<template>
  <Page auto-content-height>
    <Grid table-title="回收站">
      <template #toolbar-tools>
        <ElButton type="primary" @click="handleBatchRestore">{{ t('trashBatchRestore') }}</ElButton>
        <ElButton type="danger" @click="handleEmptyTrash">{{ t('trashEmpty') }}</ElButton>
      </template>
    </Grid>
    <div class="mt-3 rounded bg-amber-50 px-4 py-2 text-sm text-amber-700">
      {{ t('trashAutoPurgeHint') }}
    </div>
  </Page>
</template>
