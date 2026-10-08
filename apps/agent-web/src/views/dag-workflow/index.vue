<!--
 * DAG 工作流持久化管理（列表页）
 *
 * 视图模式：表格视图（VxeTable），支持按编码/名称搜索、分类筛选、CRUD 操作。
 * 操作：新增/编辑（弹窗）、查看详情（弹窗）、删除（二次确认）、导出 DSL、跳转可视化设计器。
 *
 * <p>消费 DagWorkflowController：save / getByCode / list / delete
 *
 * @path apps/agent-web/src/views/dag-workflow/index.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
/**
 * DAG 工作流持久化管理（列表页）
 * <p>消费后端 DagWorkflowController 契约：
 * 列表查询（listDagWorkflows）、保存/更新（saveDagWorkflow）、
 * 按编码查询（getDagWorkflow）、删除（deleteDagWorkflow）。
 *
 * @author ydsz-team
 * @since 1.0.0
*/
import type { VxeTableGridOptions } from '@ydsz/plugins/vxe-table';
import { YdButton, YdInput } from '@ydsz-core/ydsz-ui';
import { Page, useYdModal } from '@ydsz/common-ui';
import { h, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useYDSZVxeGrid } from '#/adapter/vxe-table';
import { deleteDagWorkflow, getDagWorkflow, listDagWorkflows } from '#/api/dag-workflow';
import type { DagWorkflow } from '#/api/models';
import DagWorkflowForm from './dag-workflow-form.vue';
import DagWorkflowDetail from './dag-workflow-detail.vue';

defineOptions({ name: 'DagWorkflowManagement' });

const router = useRouter();

/** 工作流列表数据 */
const workflowList = ref<DagWorkflow[]>([]);
const loading = ref<boolean>(false);

/** 搜索关键词 */
const searchKeyword = ref('');
/** 分类筛选 */
const categoryFilter = ref('');

const gridOptions: VxeTableGridOptions<DagWorkflow> = {
  columns: [
    { type: 'seq', width: 50, title: '序号' },
    {
      field: 'workflowCode',
      title: '工作流编码',
      width: 180,
      showOverflow: true,
    },
    {
      field: 'name',
      title: '工作流名称',
      width: 200,
      showOverflow: true,
    },
    {
      field: 'category',
      title: '分类',
      width: 120,
      showOverflow: true,
      formatter: ({ cellValue }: { cellValue: string }) => cellValue || '-',
    },
    {
      field: 'description',
      title: '描述',
      minWidth: 200,
      showOverflow: true,
      formatter: ({ cellValue }: { cellValue: string }) => cellValue || '-',
    },
    {
      field: 'status',
      title: '状态',
      width: 100,
      formatter: ({ row }: { row: DagWorkflow }) => row.name ? '已保存' : '-',
    },
    {
      field: 'createdAt',
      title: '创建时间',
      width: 160,
      formatter: ({ cellValue }: { cellValue: string }) => cellValue || '-',
    },
    {
      field: 'action',
      title: '操作',
      width: 280,
      fixed: 'right',
      slots: { default: ({ row }: { row: DagWorkflow }) => h('div', { class: 'flex items-center gap-1' }, [
        h(YdButton, { size: 'sm', variant: 'link', onClick: () => handleViewDetail(row) }, () => '详情'),
        h(YdButton, { size: 'sm', variant: 'link', onClick: () => handleEdit(row) }, () => '编辑'),
        h(YdButton, { size: 'sm', variant: 'link', onClick: () => handleExport(row) }, () => '导出'),
        h(YdButton, { size: 'sm', variant: 'link', onClick: () => handleDelete(row) }, () => '删除'),
      ]) },
    },
  ],
  height: 'auto',
  proxyConfig: {
    ajax: {
      query: async () => {
        loading.value = true;
        try {
          const items = await listDagWorkflows(categoryFilter.value || undefined);
          workflowList.value = items ?? [];
          let filtered = items ?? [];
          if (searchKeyword.value.trim()) {
            const kw = searchKeyword.value.trim().toLowerCase();
            filtered = filtered.filter(item =>
              item.workflowCode?.toLowerCase().includes(kw) ||
              item.name?.toLowerCase().includes(kw),
            );
          }
          return { items: filtered, total: filtered.length };
        } catch {
          workflowList.value = [];
          return { items: [], total: 0 };
        } finally {
          loading.value = false;
        }
      },
    },
  },
  toolbarConfig: { custom: true, refresh: { code: 'query' }, search: true, zoom: true },
};
const [Grid, gridApi] = useYDSZVxeGrid({ gridOptions });

/** 新增/编辑弹窗 */
const [DagWorkflowFormModal, dagWorkflowFormApi] = useYdModal({ connectedComponent: DagWorkflowForm });
/** 详情弹窗 */
const [DagWorkflowDetailModal, dagWorkflowDetailApi] = useYdModal({ connectedComponent: DagWorkflowDetail });

/** 刷新列表 */
async function handleRefresh(): Promise<void> {
  gridApi.query();
}

/** 打开新增弹窗 */
function handleAdd(): void {
  dagWorkflowFormApi.setData({ mode: 'create' });
  dagWorkflowFormApi.open();
}

/** 打开编辑弹窗 */
function handleEdit(row: DagWorkflow): void {
  dagWorkflowFormApi.setData({ mode: 'edit', record: row });
  dagWorkflowFormApi.open();
}

/** 打开详情弹窗 */
function handleViewDetail(row: DagWorkflow): void {
  dagWorkflowDetailApi.setData({ record: row });
  dagWorkflowDetailApi.open();
}

/** 导出工作流 DSL */
async function handleExport(row: DagWorkflow): Promise<void> {
  try {
    // 通过 getByCode 获取完整数据（含 dsl 字段）
    const full = await getDagWorkflow(row.workflowCode ?? '');
    if (!full?.dsl) {
      showToast.warning('该工作流暂无 DSL 内容');
      return;
    }
    const blob = new Blob([full.dsl], { type: 'text/yaml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${full.workflowCode ?? 'workflow'}.yaml`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast.success('导出成功');
  } catch {
    showToast.error('导出失败');
  }
}

/** 删除工作流（二次确认） */
async function handleDelete(row: DagWorkflow): Promise<void> {
  try {
    await YdConfirm(
      `确定删除工作流「${row.name ?? row.workflowCode ?? ''}」吗？删除后不可恢复。`,
      { title: '删除确认', type: 'warning' },
    );
  } catch {
    return;
  }
  try {
    await deleteDagWorkflow(row.workflowCode ?? '');
    showToast.success('删除成功');
    await handleRefresh();
  } catch {
    // 错误已由请求拦截器展示
  }
}

/** 搜索输入处理 */
function handleSearch(value: string): void {
  searchKeyword.value = value;
  gridApi.query();
}

/** 分类筛选变更 */
function handleCategoryChange(value: string): void {
  categoryFilter.value = value;
  gridApi.query();
}

/** 跳转可视化设计器 */
function handleOpenDesigner(): void {
  router.push({ path: '/dag/list' });
}
</script>

<template>
  <Page auto-content-height>
    <!-- 顶部工具栏 -->
    <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
      <div class="flex items-center gap-2">
        <YdButton @click="handleAdd">新增工作流</YdButton>
        <YdButton variant="secondary" @click="handleOpenDesigner">可视化设计器</YdButton>
      </div>
      <div class="flex items-center gap-2">
        <YdInput
          :model-value="searchKeyword"
          placeholder="搜索工作流编码/名称..."
          class="w-64"
          allow-clear
          @update:model-value="handleSearch"
        />
        <YdInput
          :model-value="categoryFilter"
          placeholder="按分类筛选..."
          class="w-40"
          allow-clear
          @update:model-value="handleCategoryChange"
        />
      </div>
    </div>

    <!-- 数据表格 -->
    <Grid table-title="DAG工作流管理" />

    <!-- 新增/编辑弹窗 -->
    <DagWorkflowFormModal @success="handleRefresh()" />

    <!-- 详情弹窗 -->
    <DagWorkflowDetailModal />
  </Page>
</template>
