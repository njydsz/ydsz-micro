<!--
 * 工具管理列表页面
 *
 * <p>提供 Agent 工具的管理能力，包括新增/编辑/删除/启用停用/测试工具。
 *
 * @path apps/agent-web/src/views/tool/index.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
/**
 * 工具管理（列表页）
 * <p>管理 Agent 可调用的工具，支持 HTTP、函数、数据库等类型工具。
 *
 * @author ydsz-team
 * @since 1.0.0
*/
import type { VxeTableGridOptions } from '@ydsz/plugins/vxe-table';
import { Page, useYDSZModal } from '@ydsz/common-ui';
import { ElButton, ElMessage, ElMessageBox, ElTag } from 'element-plus';
import { h, ref } from 'vue';
import { useYDSZVxeGrid } from '#/adapter/vxe-table';

import ToolForm from './tool-form.vue';

defineOptions({ name: 'ToolManagement' });

/** 工具类型标签颜色 */
function getToolTypeTagType(type?: string): 'success' | 'warning' | 'info' | 'danger' | 'primary' {
  switch ((type ?? '').toUpperCase()) {
    case 'HTTP':
      return 'primary';
    case 'FUNCTION':
      return 'success';
    case 'DATABASE':
      return 'warning';
    case 'CODE':
      return 'info';
    default:
      return 'danger';
  }
}

/** 工具类型标签文本 */
function getToolTypeLabel(type?: string): string {
  const labels: Record<string, string> = {
    HTTP: 'HTTP',
    FUNCTION: '函数',
    DATABASE: '数据库',
    CODE: '代码',
  };
  return labels[(type ?? '').toUpperCase()] ?? type ?? '-';
}

interface ToolVO {
  id: string;
  toolCode: string;
  toolName: string;
  toolType: string;
  description: string;
  endpoint: string;
  method: string;
  enabled: boolean;
  timeout: number;
  createdAt: string;
  updatedAt: string;
}

/** 模拟工具数据 */
const toolList = ref<ToolVO[]>([
  {
    id: '1',
    toolCode: 'weather_query',
    toolName: '天气查询',
    toolType: 'HTTP',
    description: '查询指定城市的天气信息',
    endpoint: 'https://api.weather.com/v1/current',
    method: 'GET',
    enabled: true,
    timeout: 5000,
    createdAt: '2024-01-15 10:00:00',
    updatedAt: '2024-01-15 10:00:00',
  },
  {
    id: '2',
    toolCode: 'send_email',
    toolName: '发送邮件',
    toolType: 'HTTP',
    description: '发送邮件到指定地址',
    endpoint: 'https://api.email.com/v1/send',
    method: 'POST',
    enabled: true,
    timeout: 10000,
    createdAt: '2024-01-15 11:00:00',
    updatedAt: '2024-01-15 11:00:00',
  },
  {
    id: '3',
    toolCode: 'query_database',
    toolName: '数据库查询',
    toolType: 'DATABASE',
    description: '执行 SQL 查询',
    endpoint: 'jdbc:mysql://localhost:3306/agents',
    method: 'SELECT',
    enabled: false,
    timeout: 30000,
    createdAt: '2024-01-16 09:00:00',
    updatedAt: '2024-01-16 09:00:00',
  },
]);

const gridOptions: VxeTableGridOptions<ToolVO> = {
  columns: [
    { type: 'seq', width: 50, title: '序号' },
    { field: 'toolCode', title: '工具编码', width: 150 },
    { field: 'toolName', title: '工具名称', width: 150 },
    {
      field: 'toolType',
      title: '类型',
      width: 100,
      slots: {
        default: ({ row }) =>
          h(ElTag, { type: getToolTypeTagType(row.toolType) }, () => getToolTypeLabel(row.toolType)),
      },
    },
    { field: 'description', title: '描述', minWidth: 180 },
    { field: 'endpoint', title: '端点', minWidth: 200 },
    { field: 'method', title: '方法', width: 80 },
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
    { field: 'timeout', title: '超时(ms)', width: 100 },
    { field: 'createdAt', title: '创建时间', width: 160 },
    {
      field: 'action',
      title: '操作',
      width: 250,
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
              { size: 'small', link: true, type: 'success', onClick: () => handleTest(row) },
              () => '测试',
            ),
            h(
              ElButton,
              {
                size: 'small',
                link: true,
                type: row.enabled ? 'warning' : 'success',
                onClick: () => handleToggle(row),
              },
              () => (row.enabled ? '停用' : '启用'),
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
        return { items: toolList.value, total: toolList.value.length };
      },
    },
  },
  toolbarConfig: { custom: true, refresh: { code: 'query' }, search: true, zoom: true },
  formConfig: {
    enabled: true,
    items: [
      {
        field: 'toolName',
        title: '工具名称',
        itemRender: { name: 'Input', props: { placeholder: '请输入工具名称' } },
      },
      {
        field: 'toolCode',
        title: '工具编码',
        itemRender: { name: 'Input', props: { placeholder: '请输入工具编码' } },
      },
    ],
  },
};

const [Grid, gridApi] = useYDSZVxeGrid({ gridOptions });
const [ToolFormModal, toolFormApi] = useYDSZModal({ connectedComponent: ToolForm });

/** 新增工具 */
function handleAdd(): void {
  toolFormApi.open();
}

/** 编辑工具 */
function handleEdit(row: ToolVO): void {
  toolFormApi.setData({ record: row });
  toolFormApi.open();
}

/** 测试工具 */
function handleTest(row: ToolVO): void {
  ElMessage.info(`测试工具：${row.toolName}`);
}

/** 启用/停用工具 */
function handleToggle(row: ToolVO): void {
  row.enabled = !row.enabled;
  ElMessage.success(`已${row.enabled ? '启用' : '停用'}工具「${row.toolName}」`);
  gridApi.query();
}

/** 删除工具 */
async function handleDelete(row: ToolVO): Promise<void> {
  try {
    await ElMessageBox.confirm(
      `确定删除工具「${row.toolName}」吗？`,
      '删除确认',
      { type: 'warning' },
    );
    toolList.value = toolList.value.filter((t) => t.id !== row.id);
    ElMessage.success('删除成功');
    gridApi.query();
  } catch {
    // 用户取消
  }
}
</script>

<template>
  <Page auto-content-height>
    <Grid table-title="工具管理">
      <template #toolbar-tools>
        <ElButton type="primary" @click="handleAdd">新增工具</ElButton>
      </template>
    </Grid>
    <ToolFormModal @success="gridApi.query()" />
  </Page>
</template>
