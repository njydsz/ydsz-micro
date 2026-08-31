<!--
 * 决策表管理列表页面
 *
 * @path apps\literule-web\src\views\decision-table\index.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
/**
 * 决策表管理（列表页）
 * <p>消费后端契约 RuleDecisionTableController（apps/literule-web/src/api/ruleDecisionTable.ts）：
 * listDecisionTables() 获取决策表列表，saveDecisionTable() 保存决策表，
 * deleteDecisionTable() 删除决策表，evaluateDecisionTable() 评估决策表，
 * exportDecisionTableExcel() 导出Excel，importDecisionTableExcel() 导入Excel，
 * downloadDecisionTableExcelTemplate() 下载Excel模板。
 *
 * @author ydsz-team
 * @since 1.0.0
*/
import type { VxeTableGridOptions } from '@ydsz/plugins/vxe-table';
import { Page, useYDSZModal } from '@ydsz/common-ui';
import { ElButton, ElMessage, ElMessageBox, ElTag } from 'element-plus';
import { h, ref } from 'vue';
import { useYDSZVxeGrid } from '#/adapter/vxe-table';
import {
  deleteDecisionTable,
  downloadDecisionTableExcelTemplate,
  exportDecisionTableExcel,
  listDecisionTables,
} from '#/api/ruleDecisionTable';
import type { DecisionTableVO } from '#/api/models';

import DecisionTableDesigner from './components/DecisionTableDesigner.vue';

defineOptions({ name: 'DecisionTableManagement' });

/** 决策表设计器引用 */
const designerRef = ref<InstanceType<typeof DecisionTableDesigner> | null>(null);
const currentEditTable = ref<DecisionTableVO | null>(null);

const gridOptions: VxeTableGridOptions<DecisionTableVO> = {
  columns: [
    { type: 'seq', width: 50, title: '序号' },
    { field: 'tableCode', tableCode: '编码', width: 150 },
    { field: 'tableName', title: '名称', width: 180 },
    { field: 'category', title: '分类', width: 110 },
    { field: 'hitPolicy', title: '命中策略', width: 100 },
    {
      field: 'enabled',
      title: '状态',
      width: 80,
      slots: {
        default: ({ row }) =>
          h(ElTag, { type: row.enabled ? 'success' : 'info' }, () =>
            row.enabled ? '启用' : '停用',
          ),
      },
    },
    { field: 'version', title: '版本', width: 80 },
    { field: 'description', title: '描述', minWidth: 150 },
    { field: 'createdAt', title: '创建时间', width: 160 },
    {
      field: 'action',
      title: '操作',
      width: 280,
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
              { size: 'small', link: true, type: 'success', onClick: () => handleDesign(row) },
              () => '设计',
            ),
            h(
              ElButton,
              { size: 'small', link: true, type: 'warning', onClick: () => handleExport(row) },
              () => '导出',
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
  pagerConfig: { pageSize: 20, pageSizes: [10, 20, 50, 100] },
  proxyConfig: {
    ajax: {
      query: async () => {
        const items = await listDecisionTables();
        return { items, total: items.length };
      },
    },
  },
  toolbarConfig: { custom: true, refresh: { code: 'query' }, search: true, zoom: true },
  formConfig: {
    enabled: true,
    items: [
      {
        field: 'tableName',
        title: '名称',
        itemRender: { name: 'Input', props: { placeholder: '请输入决策表名称' } },
      },
      {
        field: 'tableCode',
        title: '编码',
        itemRender: { name: 'Input', props: { placeholder: '请输入决策表编码' } },
      },
    ],
  },
};

const [Grid, gridApi] = useYDSZVxeGrid({ gridOptions });

/** 新增决策表 */
function handleAdd(): void {
  currentEditTable.value = null;
  designerRef.value?.open();
}

/** 编辑决策表 */
function handleEdit(row: DecisionTableVO): void {
  currentEditTable.value = row;
  designerRef.value?.open();
}

/** 打开设计器 */
function handleDesign(row: DecisionTableVO): void {
  currentEditTable.value = row;
  designerRef.value?.open();
}

/** 导出Excel */
async function handleExport(row: DecisionTableVO): Promise<void> {
  if (!row.tableCode) return;
  try {
    await exportDecisionTableExcel(
      { tableCode: row.tableCode },
      { response: {} },
    );
    ElMessage.success('导出成功');
  } catch {
    // 错误提示由请求拦截器统一处理
  }
}

/** 删除决策表 */
async function handleDelete(row: DecisionTableVO): Promise<void> {
  if (!row.id) return;
  try {
    await ElMessageBox.confirm(
      `确定删除决策表「${row.tableName}」吗？`,
      '删除确认',
      { type: 'warning' },
    );
    await deleteDecisionTable({ id: row.id });
    ElMessage.success('删除成功');
    gridApi.query();
  } catch {
    // 用户取消或请求失败
  }
}

/** 下载Excel模板 */
async function handleDownloadTemplate(): Promise<void> {
  try {
    await downloadDecisionTableExcelTemplate({ response: {} });
    ElMessage.success('下载成功');
  } catch {
    // 错误提示由请求拦截器统一处理
  }
}
</script>

<template>
  <Page auto-content-height>
    <Grid table-title="决策表管理">
      <template #toolbar-tools>
        <ElButton type="primary" @click="handleAdd">新增</ElButton>
        <ElButton @click="handleDownloadTemplate">下载模板</ElButton>
      </template>
    </Grid>
    <DecisionTableDesigner
      ref="designerRef"
      :table-data="currentEditTable"
      @success="gridApi.query()"
    />
  </Page>
</template>
