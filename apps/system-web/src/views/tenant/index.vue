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
import { ElButton, ElMessage, ElMessageBox, ElTag } from 'element-plus';
import { h } from 'vue';
import { useYDSZVxeGrid } from '#/adapter/vxe-table';
import { page, remove } from '#/api/tenant';
import type { TenantVO } from '#/api/models';
import TenantForm from './tenant-form.vue';

defineOptions({ name: 'TenantManagement' });

const gridOptions: VxeGridProps<TenantVO> = {
  columns: [
    { type: 'seq', width: 50, title: '序号' },
    { field: 'tenantCode', title: '租户编码', width: 140 },
    { field: 'tenantName', title: '租户名称', minWidth: 160 },
    { field: 'contactName', title: '联系人', width: 100 },
    { field: 'contactPhone', title: '联系电话', width: 130 },
    { field: 'contactEmail', title: '联系邮箱', minWidth: 150 },
    {
      field: 'status',
      title: '状态',
      width: 90,
      slots: {
        default: ({ row }) =>
          h(ElTag, { type: row.status === 'ACTIVE' ? 'success' : 'danger' }, () => (row.status === 'ACTIVE' ? '启用' : '禁用')),
      },
    },
    { field: 'expireAt', title: '过期时间', width: 170 },
    { field: 'datasourceKey', title: '数据源', width: 120 },
    {
      field: 'action', title: '操作', width: 160, fixed: 'right',
      slots: {
        default: ({ row }) =>
          h('div', { class: 'flex gap-1' }, [
            h(ElButton, { size: 'small', link: true, type: 'primary', onClick: () => handleEdit(row) }, () => '编辑'),
            h(ElButton, { size: 'small', link: true, type: 'danger', onClick: () => handleDelete(row) }, () => '删除'),
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
      { field: 'tenantName', title: '租户名称', itemRender: { name: 'Input', props: { placeholder: '请输入租户名称' } } },
      { field: 'tenantCode', title: '租户编码', itemRender: { name: 'Input', props: { placeholder: '请输入租户编码' } } },
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
  try {
    await ElMessageBox.confirm(`确定删除租户「${row.tenantName}」吗？删除后不可恢复。`, '删除确认', { type: 'warning' });
    await remove({ id: row.id });
    ElMessage.success('删除成功');
    gridApi.query();
  } catch { /* 错误提示由请求拦截器统一处理 */ }
}
</script>

<template>
  <Page auto-content-height>
    <Grid table-title="租户管理">
      <template #toolbar-tools>
        <ElButton type="primary" @click="handleAdd">新增租户</ElButton>
      </template>
    </Grid>
    <TenantFormModal @success="gridApi.query()" />
  </Page>
</template>
