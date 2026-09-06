<!--
 * 租户管理（列表页）
 *
 * @path apps\system-web\src\views\tenant\index.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
/**
 * 租户管理（列表页）
 * <p>消费后端契约 TenantController（apps/system-web/src/api/tenant.ts）：
 * page() 分页查询租户，save() 新增租户，update() 编辑租户，
 * remove() 删除租户，getById() 查询租户详情。
 *
 * @author ydsz-team
 * @since 1.0.0
 */
import type { VxeGridProps } from '@ydsz/plugins/vxe-table';
import { Page, useYDSZModal } from '@ydsz/common-ui';
import { createLogger } from '@YDSZ-core/shared/utils';
import { ElButton, ElMessage, ElMessageBox, ElTag } from 'element-plus';
import { h } from 'vue';
import { useI18n } from 'vue-i18n';
import { useYDSZVxeGrid } from '#/adapter/vxe-table';
import { page, remove } from '#/api/tenant';
import type { TenantVO } from '#/api/models';
import TenantForm from './tenant-form.vue';

defineOptions({ name: 'TenantManagement' });

const logger = createLogger('system-tenant');

const { t } = useI18n();

const gridOptions: VxeGridProps<TenantVO> = {
  columns: [
    { type: 'seq', width: 50, title: t('common.seq') },
    { field: 'tenantCode', title: t('tenantCode'), width: 140 },
    { field: 'tenantName', title: t('tenantName'), minWidth: 160 },
    { field: 'contactName', title: t('contactName'), width: 100 },
    { field: 'contactPhone', title: t('contactPhone'), width: 130 },
    { field: 'contactEmail', title: t('contactEmail'), minWidth: 150 },
    {
      field: 'status',
      title: t('status'),
      width: 90,
      slots: {
        default: ({ row }) =>
          h(ElTag, { type: row.status === 'ACTIVE' ? 'success' : 'danger' }, () => (row.status === 'ACTIVE' ? t('enabled') : t('disabled'))),
      },
    },
    { field: 'expireAt', title: t('expireAt'), width: 170 },
    { field: 'datasourceKey', title: t('datasourceKey'), width: 120 },
    {
      field: 'action', title: t('action'), width: 160, fixed: 'right',
      slots: {
        default: ({ row }) =>
          h('div', { class: 'flex gap-1' }, [
            h(ElButton, { size: 'small', link: true, type: 'primary', onClick: () => handleEdit(row) }, () => t('edit')),
            h(ElButton, { size: 'small', link: true, type: 'danger', onClick: () => handleDelete(row) }, () => t('delete')),
          ]),
      },
    },
  ],
  height: 'auto',
  pagerConfig: { pageSize: 20, pageSizes: [10, 20, 50, 100] },
  proxyConfig: {
    ajax: {
      query: async ({ page: pageObj, formData }) => {
        const res = await page({ query: { ...formData, pageNum: pageObj.currentPage, pageSize: pageObj.pageSize } });
        return { items: res.data ?? [], total: res.total ?? 0 };
      },
    },
  },
  toolbarConfig: { custom: true, refresh: { code: 'query' }, zoom: true },
  formConfig: {
    enabled: true,
    items: [
      { field: 'tenantName', title: t('tenantName'), itemRender: { name: 'Input', props: { placeholder: t('tenantNamePlaceholder') } } },
      { field: 'tenantCode', title: t('tenantCode'), itemRender: { name: 'Input', props: { placeholder: t('tenantCodePlaceholder') } } },
    ],
  },
};
const [Grid, gridApi] = useYDSZVxeGrid({ gridOptions });
const [TenantFormModal, tenantFormApi] = useYDSZModal({ connectedComponent: TenantForm });

function handleAdd() {
  tenantFormApi.setData({ mode: 'create' });
  tenantFormApi.open();
}

function handleEdit(row: TenantVO) {
  tenantFormApi.setData({ mode: 'edit', record: row });
  tenantFormApi.open();
}

async function handleDelete(row: TenantVO) {
  if (!row.id) return;
  // 步骤1：确认弹窗（用户取消直接返回）
  try {
    await ElMessageBox.confirm(`确定删除租户「${row.tenantName}」吗？删除后不可恢复。`, t('tenantDeleteTitle'), { type: 'warning' });
  } catch (error) {
    logger.warn('用户取消删除租户', error);
    return; // 用户主动取消删除操作
  }
  // 步骤2：执行删除 API（失败提示由 errorMessageResponseInterceptor 统一处理）
  try {
    await remove({ id: row.id });
    ElMessage.success(t('operationSuccess'));
    gridApi.query();
  } catch (error) {
    logger.warn('删除租户失败，详见拦截器提示', error);
    // 用户提示由 errorMessageResponseInterceptor 统一处理
  }
}
</script>

<template>
  <Page auto-content-height>
    <Grid :table-title="t('tenant')">
      <template #toolbar-tools>
        <ElButton type="primary" @click="handleAdd">{{ t('create') }}</ElButton>
      </template>
    </Grid>
    <TenantFormModal @success="gridApi.query()" />
  </Page>
</template>
