<!--
 * 错误码管理列表页组件
 *
 * @path apps/message-web/src/views/error-code/index.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
/**
 * 错误码管理（列表页）
 * <p>消费 MessageErrorCodesController（src/api/messageErrorCodes.ts）：
 * page() 分页查询错误码配置，行操作「编辑」打开 error-code-form.vue、「删除」调 removeApi({id})、
 * 「启用/禁用」调 toggleStatus({id})。
 *
 * @author ydsz-team
 * @since 1.0.0
 */
import type { VxeTableGridOptions } from '@ydsz/plugins/vxe-table';

import { Page, useYdModal } from '@ydsz/common-ui';

import { h } from 'vue';

import { YdBadge, YdButton } from '@ydsz-core/ydsz-ui';
import { useI18n } from 'vue-i18n';

import { useYDSZVxeGrid } from '#/adapter/vxe-table';
import {
  type ErrorCodeQueryDTO,
  type MsgErrorCodeVO,
  page,
  removeApi,
  toggleStatus,
} from '#/api/messageErrorCodes';

import ErrorCodeForm from './error-code-form.vue';

defineOptions({ name: 'ErrorCodeManagement' });

const { t } = useI18n();

const gridOptions: VxeTableGridOptions<MsgErrorCodeVO> = {
  columns: [
    { type: 'seq', width: 50, title: t('common.seq') },
    { field: 'errorCode', title: t('errorCode.columns.errorCode'), width: 180 },
    { field: 'errorMessage', title: t('errorCode.columns.errorMessage'), width: 240 },
    { field: 'channelType', title: t('errorCode.columns.channelType'), width: 110 },
    { field: 'retryPolicy', title: t('errorCode.columns.retryPolicy'), width: 150 },
    { field: 'notifyPolicy', title: t('errorCode.columns.notifyPolicy'), width: 150 },
    { field: 'maxRetryCount', title: t('errorCode.columns.maxRetryCount'), width: 100 },
    {
      field: 'status',
      title: t('common.status'),
      width: 90,
      slots: {
        default: ({ row }) =>
          h(
            YdBadge,
            { variant: row.status === 'DISABLED' ? 'secondary' : 'default' },
            () => row.status ?? '-',
          ),
      },
    },
    { field: 'createdAt', title: t('common.createTime'), width: 170 },
    {
      field: 'action',
      title: t('common.actions'),
      width: 200,
      fixed: 'right',
      slots: {
        default: ({ row }) =>
          h('div', { class: 'flex gap-1' }, [
            h(
              YdButton,
              {
                size: 'sm',
                variant: 'link',
                onClick: () => handleToggleStatus(row),
              },
              () => (row.status === 'DISABLED' ? t('errorCode.actions.enable') : t('errorCode.actions.disable')),
            ),
            h(
              YdButton,
              { size: 'sm', variant: 'link', onClick: () => handleEdit(row) },
              () => t('common.edit'),
            ),
            h(
              YdButton,
              { size: 'sm', variant: 'link', onClick: () => handleDelete(row) },
              () => t('common.delete'),
            ),
          ]),
      },
    },
  ],
  height: 'auto',
  pagerConfig: { pageSize: 20, pageSizes: [10, 20, 50, 100] },
  proxyConfig: {
    ajax: {
      query: async (_page, formValues) => {
        const query: ErrorCodeQueryDTO = {
          errorCode: formValues.errorCode || undefined,
          channelType: formValues.channelType || undefined,
          status: formValues.status || undefined,
          retryPolicy: formValues.retryPolicy || undefined,
          notifyPolicy: formValues.notifyPolicy || undefined,
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
      {
        field: 'errorCode',
        title: t('errorCode.columns.errorCode'),
        itemRender: {
          name: 'YdInput',
          props: { placeholder: t('errorCode.columns.errorCode') },
        },
      },
      {
        field: 'channelType',
        title: t('errorCode.columns.channelType'),
        itemRender: {
          name: 'YdInput',
          props: { placeholder: t('errorCode.columns.channelType') },
        },
      },
      {
        field: 'status',
        title: t('common.status'),
        itemRender: {
          name: 'YdInput',
          props: { placeholder: t('common.status') },
        },
      },
    ],
  },
};

const [Grid, gridApi] = useYDSZVxeGrid({ gridOptions });

const [ErrorCodeFormModal, errorCodeFormApi] = useYdModal({ connectedComponent: ErrorCodeForm });

function handleAdd() {
  errorCodeFormApi.open();
}

function handleEdit(row: MsgErrorCodeVO) {
  errorCodeFormApi.setData({ record: row });
  errorCodeFormApi.open();
}

async function handleToggleStatus(row: MsgErrorCodeVO) {
  if (!row.id) return;
  try {
    await toggleStatus({ id: row.id });
    showToast.success(t('errorCode.toggleSuccess'));
    gridApi.query();
  } catch {
    // 错误已由请求拦截器展示，无需重复处理
  }
}

async function handleDelete(row: MsgErrorCodeVO) {
  if (!row.id) return;
  // 步骤1：确认弹窗（用户取消直接返回）
  try {
    await YdConfirm(
      t('errorCode.confirmDelete', { errorCode: row.errorCode }),
      { title: t('common.crud.deleteConfirmTitle'), type: 'warning' },
    );
  } catch {
    return; // 用户主动取消删除操作
  }
  // 步骤2：执行删除 API（失败提示由 errorMessageResponseInterceptor 统一处理）
  try {
    await removeApi({ id: row.id });
    showToast.success(t('common.crud.deleteSuccess'));
    gridApi.query();
  } catch {
    // 错误已由请求拦截器展示，无需重复处理
  }
}
</script>
<template>
  <Page auto-content-height>
    <Grid :table-title="t('errorCode.title')">
      <template #toolbar-tools>
        <YdButton @click="handleAdd">{{ t('common.create') }}</YdButton>
      </template>
    </Grid>
    <ErrorCodeFormModal @success="gridApi.query()" />
  </Page>
</template>
