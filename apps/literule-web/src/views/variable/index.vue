<!--
 * 规则变量管理列表页面
 *
 * @path apps\literule-web\src\views\variable\index.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
/**
 * 规则变量（列表页）
 * <p>规则变量列表页，数据来自后端契约 API（apps/literule-web/src/api/ruleVariableAdmin.ts）。
 * <p>支持新增/编辑、删除与手动刷新变量定义。
 *
 * @author ydsz-team
 * @since 1.0.0
 */
import type { VariableDefinitionVO } from '#/api/models';
import type { VxeGridProps } from '@ydsz/plugins/vxe-table';
import { Page, useYDSZModal } from '@ydsz/common-ui';
import { ElButton, ElMessage, ElMessageBox, ElTag } from 'element-plus';
import { h } from 'vue';
import { useYDSZVxeGrid } from '#/adapter/vxe-table';
import { deleteApi, list, refresh } from '#/api/ruleVariableAdmin';
import { formatJsonResult } from '#/utils/format';
import VariableForm from './variable-form.vue';
defineOptions({ name: 'VariableManagement' });
const gridOptions: VxeGridProps<VariableDefinitionVO> = {
  columns: [
    { type: 'seq', width: 50, title: '序号' },
    { field: 'name', title: '变量名称', width: 180 },
    {
      field: 'type',
      title: '类型',
      width: 110,
      slots: { default: ({ row }) => h(ElTag, { type: 'primary' }, () => row.type ?? '-') },
    },
    { field: 'category', title: '分类', width: 110 },
    {
      field: 'sampleValue',
      title: '示例值',
      minWidth: 160,
      slots: {
        default: ({ row }) =>
          h('span', { class: 'truncate text-xs text-gray-500' }, formatJsonResult(row.sampleValue)),
      },
    },
    { field: 'description', title: '描述', minWidth: 160 },
    {
      field: 'action',
      title: '操作',
      width: 150,
      fixed: 'right',
      slots: {
        default: ({ row }) =>
          h('div', { class: 'flex gap-1' }, [
            h(
              ElButton,
              { size: 'small', link: true, type: 'primary', onClick: () => handleEdit(row) },
              () => '编辑',
            ),
            h(
              ElButton,
              { size: 'small', link: true, type: 'danger', onClick: () => handleDelete(row) },
              () => '删除',
            ),
          ]),
      },
    },
  ],
  height: 'auto',
  proxyConfig: {
    ajax: {
      query: async () => {
        const items = await list({});
        return { items, total: items.length };
      },
    },
  },
  toolbarConfig: { custom: true, refresh: { code: 'query' }, zoom: true },
};
const [Grid, gridApi] = useYDSZVxeGrid({ gridOptions });
const [VariableFormModal, variableFormApi] = useYDSZModal({ connectedComponent: VariableForm });
function handleAdd() {
  variableFormApi.open();
}
function handleEdit(row: VariableDefinitionVO) {
  variableFormApi.setData({ record: row });
  variableFormApi.open();
}
async function handleDelete(row: VariableDefinitionVO) {
  if (!row.name) return;
  // 步骤1：确认弹窗（用户取消直接返回）
  try {
    await ElMessageBox.confirm(`确定删除变量「${row.name}」吗？`, '删除确认', { type: 'warning' });
  } catch {
    return; // 用户主动取消删除操作
  }
  // 步骤2：执行删除 API（失败提示由 errorMessageResponseInterceptor 统一处理）
  try {
    await deleteApi({ varName: row.name });
    ElMessage.success('删除成功');
    gridApi.query();
  } catch {
    /* 错误已由请求拦截器展示，无需重复处理 */
  }
}
/** 手动刷新变量定义 */
async function handleRefresh() {
  // 步骤1：确认弹窗（用户取消直接返回）
  try {
    await ElMessageBox.confirm('确定重新加载后端变量定义吗？', '刷新确认', { type: 'warning' });
  } catch {
    return; // 用户主动取消刷新操作
  }
  // 步骤2：执行刷新 API（失败提示由 errorMessageResponseInterceptor 统一处理）
  try {
    await refresh();
    ElMessage.success('刷新成功');
    gridApi.query();
  } catch {
    /* 错误已由请求拦截器展示，无需重复处理 */
  }
}
</script>
<template>
  <Page auto-content-height>
    <Grid table-title="规则变量">
      <template #toolbar-tools>
        <ElButton type="primary" @click="handleAdd">新增</ElButton>
        <ElButton @click="handleRefresh">刷新</ElButton>
      </template>
    </Grid>
    <VariableFormModal @success="gridApi.query()" />
  </Page>
</template>
