<!--
 * 最近访问（列表页）
 *
 * @path apps\nextwiki-web\src\views\recent\index.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
/**
 * 最近访问（列表页）
 * <p>消费后端契约 UserRecentController（apps/nextwiki-web/src/api/userRecent.ts）：
 * listRecent() 展示最近访问文件列表 + getRecentCount() 展示总数，
 * 行操作：移除记录 removeRecent，顶部「清空全部」按钮（clearAll）。
 *
 * @author ydsz-team
 * @since 1.0.0
 */
import type { VxeGridProps } from '@ydsz/plugins/vxe-table';
import { Page } from '@ydsz/common-ui';
import { ElButton, ElMessage, ElMessageBox, ElTag } from 'element-plus';
import { h, ref } from 'vue';
import { createLogger } from '@ydsz-core/shared/utils';
import { useI18n } from 'vue-i18n';
import { useYDSZVxeGrid } from '#/adapter/vxe-table';
const logger = createLogger('nextwiki-recent');
const { t } = useI18n();
import { clearAll, getRecentCount, listRecent, removeRecent } from '#/api/userRecent';
import type { UserRecentVO } from '#/api/models';

defineOptions({ name: 'RecentManagement' });

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

/** 最近访问总数（顶部展示） */
const recentCount = ref(0);

const gridOptions: VxeGridProps<UserRecentVO> = {
  columns: [
    { type: 'seq', width: 50, title: t('seq') },
    { field: 'name', title: t('name'), minWidth: 180 },
    {
      field: 'nodeType',
      title: t('nodeType'),
      width: 100,
      slots: {
        default: ({ row }) =>
          h(ElTag, { type: row.nodeType === 'DIRECTORY' ? 'info' : 'primary' }, () =>
            row.nodeType === 'DIRECTORY' ? t('nodeTypeDirectory') : t('nodeTypeFile'),
          ),
      },
    },
    { field: 'suffix', title: t('recentSuffix'), width: 90 },
    {
      field: 'size',
      title: t('fileSizeColumn'),
      width: 110,
      formatter: ({ row }) => formatFileSize(row.size),
    },
    { field: 'path', title: t('path'), minWidth: 200 },
    {
      field: 'accessType',
      title: t('accessType'),
      width: 120,
      slots: {
        default: ({ row }) => h('span', {}, row.accessType ?? '--'),
      },
    },
    { field: 'accessedAt', title: t('recentAccessedAt'), width: 170 },
    {
      field: 'action',
      title: t('action'),
      width: 100,
      fixed: 'right',
      slots: {
        default: ({ row }) =>
          h('div', { class: 'flex gap-1' }, [
            h(ElButton, {
              size: 'small',
              link: true,
              type: 'danger',
              onClick: () => handleRemove(row),
            }, () => t('recentRemove')),
          ]),
      },
    },
  ],
  height: 'auto',
  proxyConfig: {
    ajax: {
      query: async () => {
        const [items, count] = await Promise.all([
          listRecent({ limit: 50 }),
          getRecentCount(),
        ]);
        recentCount.value = count;
        return { items, total: items.length };
      },
    },
  },
  toolbarConfig: { custom: true, refresh: { code: 'query' }, zoom: true },
};
const [Grid, gridApi] = useYDSZVxeGrid({ gridOptions });

async function handleRemove(row: UserRecentVO) {
  if (!row.nodeId) return;
  try {
    await ElMessageBox.confirm(t('recentRemoveConfirm'), t('recentRemove'), { type: 'warning' });
    await removeRecent({ nodeId: row.nodeId });
    ElMessage.success(t('recentRemoveSuccess'));
    gridApi.query();
  } catch (error) {
    logger.warn('移除记录失败: {}', error);
    /* 用户提示由请求拦截器统一处理 */
  }
}

async function handleClearAll() {
  try {
    await ElMessageBox.confirm(t('recentClearAllConfirm'), t('recentClearAll'), { type: 'error' });
    await clearAll();
    ElMessage.success(t('recentClearAllSuccess'));
    gridApi.query();
  } catch (error) {
    logger.warn('清空最近访问失败: {}', error);
    /* 用户提示由请求拦截器统一处理 */
  }
}
</script>

<template>
  <Page auto-content-height>
    <div class="mb-3 flex items-center justify-between rounded bg-white px-4 py-2 shadow-sm">
      <span class="text-sm text-gray-600">
        {{ t('recentTotalLabel') }}
        <span class="ml-1 font-semibold text-blue-600">{{ recentCount }}</span>
      </span>
      <ElButton type="danger" size="small" @click="handleClearAll">{{ t('recentClearAll') }}</ElButton>
    </div>
    <Grid table-title="最近访问" />
  </Page>
</template>
