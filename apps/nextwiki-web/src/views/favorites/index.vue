<!--
 * 收藏夹（列表页）
 *
 * @path apps\nextwiki-web\src\views\favorites\index.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
/**
 * 收藏夹（列表页）
 * <p>消费后端契约 UserFavoriteController（apps/nextwiki-web/src/api/userFavorite.ts）：
 * listFavorites() 展示用户收藏列表 + getFavoriteCount() 展示总数，
 * 行操作：移除收藏 removeFavorite、调整排序 updateSortOrder。
 *
 * @author ydsz-team
 * @since 1.0.0
 */
import type { VxeGridProps } from '@ydsz/plugins/vxe-table';
import { Page } from '@ydsz/common-ui';
import { ElButton, ElInputNumber, ElMessage, ElMessageBox, ElTag } from 'element-plus';
import { h, ref } from 'vue';
import { createLogger } from '@ydsz-core/shared/utils';
import { useI18n } from 'vue-i18n';
import { useYDSZVxeGrid } from '#/adapter/vxe-table';
const logger = createLogger('nextwiki-favorites');
const { t } = useI18n();
import { getFavoriteCount, listFavorites, removeFavorite, updateSortOrder }
  from '#/api/userFavorite';
import type { UserFavoriteVO } from '#/api/models';

defineOptions({ name: 'FavoriteManagement' });

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

/** 收藏总数（顶部统计展示） */
const favoriteCount = ref(0);

const gridOptions: VxeGridProps<UserFavoriteVO> = {
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
    { field: 'suffix', title: t('favoritesSuffix'), width: 90 },
    {
      field: 'size',
      title: t('fileSizeColumn'),
      width: 110,
      formatter: ({ row }) => formatFileSize(row.size),
    },
    { field: 'path', title: t('path'), minWidth: 200 },
    { field: 'favoritedAt', title: t('favoritesFavoritedAt'), width: 170 },
    {
      field: 'sortOrder',
      title: t('favoritesSortOrder'),
      width: 140,
      slots: {
        default: ({ row }) =>
          h(ElInputNumber, {
            modelValue: row.sortOrder ?? 0,
            min: 0,
            max: 9999,
            step: 1,
            size: 'small',
            style: 'width:100px',
            'onUpdate:modelValue': (val: number | string) => {
              row.sortOrder = Number(val);
            },
            onChange: () => handleSortChange(row),
          }),
      },
    },
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
            }, () => t('favoritesRemove')),
          ]),
      },
    },
  ],
  height: 'auto',
  proxyConfig: {
    ajax: {
      query: async () => {
        const [items, count] = await Promise.all([
          listFavorites({ limit: 50 }),
          getFavoriteCount(),
        ]);
        favoriteCount.value = count;
        return { items, total: items.length };
      },
    },
  },
  toolbarConfig: { custom: true, refresh: { code: 'query' }, zoom: true },
};
const [Grid, gridApi] = useYDSZVxeGrid({ gridOptions });

async function handleRemove(row: UserFavoriteVO) {
  if (!row.nodeId) return;
  try {
    await ElMessageBox.confirm(t('favoritesRemoveConfirm'), t('favoritesRemove'), { type: 'warning' });
    await removeFavorite({ nodeId: row.nodeId });
    ElMessage.success(t('favoritesRemoveSuccess'));
    gridApi.query();
  } catch (error) {
    logger.warn('移除收藏失败: {}', error);
    /* 用户提示由请求拦截器统一处理 */
  }
}

async function handleSortChange(row: UserFavoriteVO) {
  if (!row.nodeId || row.sortOrder === undefined || row.sortOrder === null) return;
  try {
    await updateSortOrder({ nodeId: row.nodeId }, { sortOrder: row.sortOrder });
    ElMessage.success(t('favoritesSortSuccess'));
    gridApi.query();
  } catch (error) {
    logger.warn('调整排序失败: {}', error);
    /* 用户提示由请求拦截器统一处理 */
  }
}
</script>

<template>
  <Page auto-content-height>
    <div class="mb-3 flex items-center justify-between rounded bg-white px-4 py-2 shadow-sm">
      <span class="text-sm text-gray-600">
        {{ t('favoritesTotalLabel') }}
        <span class="ml-1 font-semibold text-blue-600">{{ favoriteCount }}</span>
      </span>
    </div>
    <Grid table-title="收藏夹" />
  </Page>
</template>
