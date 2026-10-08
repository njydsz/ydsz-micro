<!--
 * 特性开关管理页面 — 特性开关的分页列表、搜索、新增、编辑、状态切换、删除
 *
 * @path apps\system-web\src\views\feature-flag\index.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
/**
 * 特性开关（列表页）
 * <p>消费后端契约 FeatureFlagController（src/api/featureFlag.ts）的特性开关列表页：
 * 分页查询 page、编辑/删除（remove）、更新（update 用于状态切换）。
 *
 * @author ydsz-team
 * @since 1.0.0
 */
import type { VxeTableGridOptions } from '@ydsz/plugins/vxe-table';

import { Page, useYdModal } from '@ydsz/common-ui';

import { YdBadge, YdButton } from '@ydsz-core/ydsz-ui';
import { ydSwitch } from '@ydsz-core/ydsz-ui/ui/switch';
import { createLogger } from '@ydsz-core/shared/utils';
import { h, onUnmounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';

import { useAccess } from '@ydsz/access';

import { useYDSZVxeGrid } from '#/adapter/vxe-table';
import { page, remove, update } from '#/api/featureFlag';
import type { FeatureFlagPageQuery, FeatureFlagVO, PageQuery } from '#/api/models';

import FeatureFlagForm from './feature-flag-form.vue';

defineOptions({ name: 'FeatureFlagManagement' });

/** 按钮级权限判断 */
const { hasAccessByCodesAll } = useAccess();

const logger = createLogger('feature-flag');

const { t } = useI18n();

/** 请求控制器，用于取消未完成的请求 */
const abortController = new AbortController();

/** 当前正在切换状态的行 ID（防止重复操作） */
const togglingId = ref<string>('');

/** 行类型：真实契约 FeatureFlagVO（字段以 models.ts 为准） */
type FeatureFlagRow = FeatureFlagVO;

/** 分页查询参数：契约 FeatureFlagPageQuery + 通用分页字段（models.ts PageQuery） */
type FeatureFlagPageQueryParams = FeatureFlagPageQuery & PageQuery;

/** 状态是否启用（后端 status 为字符串，兼容 '1' / 'ENABLED' 两种取值） */
function isEnabled(status?: string): boolean {
  return status === '1' || status === 'ENABLED';
}

/** 开关类型显示文本 */
function flagTypeLabel(type?: string): string {
  switch (type) {
    case 'BOOLEAN': return t('featureFlag.typeBoolean');
    case 'STRING': return t('featureFlag.typeString');
    case 'JSON': return t('featureFlag.typeJson');
    default: return type ?? '-';
  }
}

const gridOptions: VxeTableGridOptions<FeatureFlagRow> = {
  columns: [
    { type: 'seq', width: 50, title: t('common.seq') },
    { field: 'flagKey', title: t('featureFlag.flagKey'), width: 160 },
    { field: 'flagName', title: t('featureFlag.flagName'), width: 150 },
    {
      field: 'flagType',
      title: t('featureFlag.flagType'),
      width: 90,
      slots: {
        default: ({ row }: { row: FeatureFlagRow }) => h('span', {}, flagTypeLabel(row.flagType)),
      },
    },
    {
      field: 'defaultValue',
      title: t('featureFlag.defaultValue'),
      width: 140,
      showOverflow: 'tooltip',
    },
    {
      field: 'currentValue',
      title: t('featureFlag.currentValue'),
      width: 140,
      showOverflow: 'tooltip',
    },
    {
      field: 'status',
      title: t('common.status'),
      width: 100,
      slots: {
        default: ({ row }: { row: FeatureFlagRow }) => {
          const flag = row as FeatureFlagRow;
          return h(
            'div',
            { class: 'flex items-center gap-2' },
            [
              h(ydSwitch, {
                open: isEnabled(flag.status),
                disabled: togglingId.value === flag.id,
                onConfirm: () => handleToggleStatus(flag),
              }),
              h(
                YdBadge,
                { variant: isEnabled(flag.status) ? undefined : 'secondary' },
                () => (isEnabled(flag.status) ? t('common.enabled') : t('common.disabled')),
              ),
            ],
          );
        },
      },
    },
    {
      field: 'description',
      title: t('featureFlag.description'),
      width: 180,
      showOverflow: 'tooltip',
    },
    {
      field: 'createdAt',
      title: t('common.createTime'),
      width: 160,
      formatter: ({ cellValue }: { cellValue: string }) => cellValue || '-',
    },
    {
      field: 'action',
      title: t('common.actions'),
      width: 150,
      fixed: 'right',
      slots: {
        default: ({ row }: { row: FeatureFlagRow }) => {
          const flag = row as FeatureFlagRow;
          const buttons: unknown[] = [];
          // 编辑按钮 — 需要 sys:feature:edit 权限
          if (hasAccessByCodesAll(['sys:feature:edit'])) {
            buttons.push(h(YdButton, { size: 'sm', onClick: () => handleEdit(flag) }, () => t('common.edit')));
          }
          // 删除按钮 — 需要 sys:feature:delete 权限
          if (hasAccessByCodesAll(['sys:feature:delete'])) {
            buttons.push(h(YdButton, { size: 'sm', variant: 'destructive', onClick: () => handleDelete(flag) }, () => t('common.delete')));
          }
          return h('div', { class: 'flex gap-1' }, buttons);
        },
      },
    },
  ],
  height: 'auto',
  pagerConfig: { pageSize: 20, pageSizes: [10, 20, 50, 100] },
  proxyConfig: {
    ajax: {
      query: async ({ page: pageInfo }: { page: { currentPage: number; pageSize: number } }, formValues: Record<string, string>) => {
        const query: FeatureFlagPageQueryParams = {
          pageNum: pageInfo.currentPage,
          pageSize: pageInfo.pageSize,
          ...formValues,
        };
        const res = await page({ query });
        return { items: res.data ?? [], total: res.total ?? 0 };
      },
    },
  },
  toolbarConfig: { custom: true, refresh: { code: 'query' }, search: true, zoom: true },
  formConfig: {
    enabled: true,
    items: [
      { field: 'flagKey', title: t('featureFlag.flagKey'), itemRender: { name: 'YdInput', props: { placeholder: t('featureFlag.flagKeyPlaceholder') } } },
      { field: 'flagName', title: t('featureFlag.flagName'), itemRender: { name: 'YdInput', props: { placeholder: t('featureFlag.flagNamePlaceholder') } } },
      { field: 'flagType', title: t('featureFlag.flagType'), itemRender: { name: 'YdInput', props: { placeholder: t('featureFlag.flagType') } } },
    ],
  },
};

const [Grid, gridApi] = useYDSZVxeGrid({ gridOptions });

const [FeatureFlagFormModal, featureFlagFormApi] = useYdModal({ connectedComponent: FeatureFlagForm });

/**
 * 新增特性开关。
 *
 * <p>打开特性开关表单弹窗。
 */
function handleAdd() {
  featureFlagFormApi.open();
}

/**
 * 编辑特性开关。
 *
 * <p>将当前行数据绑定到表单并打开特性开关编辑弹窗。
 *
 * @param row - 待编辑的特性开关行
 */
function handleEdit(row: FeatureFlagRow) {
  featureFlagFormApi.setData({ record: row });
  featureFlagFormApi.open();
}

/**
 * 切换特性开关的启用/禁用状态。
 *
 * <p>直接在表格中通过 Switch 组件触发，确认后调用 update API 更新状态。
 *
 * @param row - 待切换状态的特性开关行
 */
async function handleToggleStatus(row: FeatureFlagRow) {
  if (!row.id) return;
  togglingId.value = row.id;
  try {
    const updated: FeatureFlagVO = {
      id: row.id,
      flagKey: row.flagKey,
      flagName: row.flagName,
      flagType: row.flagType,
      defaultValue: row.defaultValue,
      currentValue: row.currentValue,
      description: row.description,
      status: isEnabled(row.status) ? '0' : '1',
    };
    await update(updated);
    showToast.success(t('operationSuccess'));
    gridApi.query();
  } catch (error) {
    logger.warn('切换特性开关状态失败', error);
  } finally {
    togglingId.value = '';
  }
}

/**
 * 删除特性开关。
 *
 * <p>弹出二次确认对话框，确认后调用后端删除接口，成功后刷新列表。
 *
 * @param row - 待删除的特性开关行
 */
async function handleDelete(row: FeatureFlagRow) {
  // 步骤1：确认弹窗（用户取消直接返回）
  try {
    await YdConfirm(t('featureFlag.deleteConfirm', [row.flagName ?? row.flagKey ?? '']), t('common.deleteConfirmTitle'), { type: 'warning' });
  } catch {
    return; // 用户主动取消删除操作
  }
  // 步骤2：执行删除 API（失败提示由 errorMessageResponseInterceptor 统一处理）
  try {
    if (row.id) await remove({ id: row.id });
    showToast.success(t('operationSuccess'));
    gridApi.query();
  } catch (error) {
    logger.warn('删除特性开关失败，详见拦截器提示', error);
    // 用户提示由 errorMessageResponseInterceptor 统一处理
  }
}

/** 页面卸载时取消未完成的请求 */
onUnmounted(() => {
  abortController.abort();
});
</script>

<template>
  <Page auto-content-height>
    <Grid :table-title="t('featureFlag.title')">
      <template #toolbar-tools>
        <YdButton v-permission="'sys:feature:add'" @click="handleAdd">{{ t('common.create') }}</YdButton>
      </template>
    </Grid>
    <FeatureFlagFormModal @success="gridApi.query()" />
  </Page>
</template>
