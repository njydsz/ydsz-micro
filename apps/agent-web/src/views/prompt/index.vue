<!--
 * Prompt 模板管理列表页面
 *
 * <p>提供 Prompt 模板的管理能力，包括新增/编辑/删除/测试/版本管理。
 *
 * @path apps/agent-web/src/views/prompt/index.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
/**
 * Prompt 模板管理（列表页）
 * <p>管理 Agent 使用的 Prompt 模板，支持变量替换、版本管理、测试评估。
 *
 * @author ydsz-team
 * @since 1.0.0
*/
import type { VxeTableGridOptions } from '@ydsz/plugins/vxe-table';
import { Page, useYDSZModal } from '@ydsz/common-ui';
import { ElButton, ElDialog, ElDrawer, ElMessage, ElMessageBox, ElTag } from 'element-plus';
import { h, ref } from 'vue';
import { useYDSZVxeGrid } from '#/adapter/vxe-table';

import PromptForm from './prompt-form.vue';
import PromptTest from './prompt-test.vue';

defineOptions({ name: 'PromptManagement' });

/** Prompt 模板类型 */
interface PromptTemplateVO {
  id: string;
  templateCode: string;
  templateName: string;
  category: string;
  content: string;
  variables: string[];
  version: number;
  enabled: boolean;
  description: string;
  createdAt: string;
  updatedAt: string;
}

/** 模拟数据 */
const promptList = ref<PromptTemplateVO[]>([
  {
    id: '1',
    templateCode: 'customer_service_v1',
    templateName: '客服回复模板',
    category: '客服',
    content: '你是一个专业的客服人员。用户问题：{{question}}。请用友好的语气回答。',
    variables: ['question'],
    version: 1,
    enabled: true,
    description: '用于客服场景的标准回复模板',
    createdAt: '2024-01-15 10:00:00',
    updatedAt: '2024-01-15 10:00:00',
  },
  {
    id: '2',
    templateCode: 'sales_assistant_v1',
    templateName: '销售助手模板',
    category: '销售',
    content: '你是一个销售顾问。产品：{{product}}。客户需求：{{need}}。请给出推荐。',
    variables: ['product', 'need'],
    version: 2,
    enabled: true,
    description: '用于销售场景的产品推荐模板',
    createdAt: '2024-01-14 09:00:00',
    updatedAt: '2024-01-15 14:00:00',
  },
  {
    id: '3',
    templateCode: 'code_review_v1',
    templateName: '代码审查模板',
    category: '开发',
    content: '请审查以下代码：\n```{{language}}\n{{code}}\n```\n关注：安全性、性能、可读性。',
    variables: ['language', 'code'],
    version: 1,
    enabled: false,
    description: '用于代码审查的 Prompt 模板',
    createdAt: '2024-01-13 08:00:00',
    updatedAt: '2024-01-13 08:00:00',
  },
]);

const gridOptions: VxeTableGridOptions<PromptTemplateVO> = {
  columns: [
    { type: 'seq', width: 50, title: '序号' },
    { field: 'templateCode', title: '模板编码', width: 160 },
    { field: 'templateName', title: '模板名称', width: 160 },
    { field: 'category', title: '分类', width: 100 },
    { field: 'version', title: '版本', width: 80 },
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
    { field: 'description', title: '描述', minWidth: 180 },
    { field: 'updatedAt', title: '更新时间', width: 160 },
    {
      field: 'action',
      title: '操作',
      width: 300,
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
              { size: 'small', link: true, type: 'warning', onClick: () => handleToggle(row) },
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
        return { items: promptList.value, total: promptList.value.length };
      },
    },
  },
  toolbarConfig: { custom: true, refresh: { code: 'query' }, search: true, zoom: true },
  formConfig: {
    enabled: true,
    items: [
      {
        field: 'templateName',
        title: '模板名称',
        itemRender: { name: 'Input', props: { placeholder: '请输入模板名称' } },
      },
      {
        field: 'templateCode',
        title: '模板编码',
        itemRender: { name: 'Input', props: { placeholder: '请输入模板编码' } },
      },
    ],
  },
};

const [Grid, gridApi] = useYDSZVxeGrid({ gridOptions });
const [PromptFormModal, promptFormApi] = useYDSZModal({ connectedComponent: PromptForm });

/** 测试弹窗引用 */
const promptTestRef = ref<InstanceType<typeof PromptTest> | null>(null);

/** 新增模板 */
function handleAdd(): void {
  promptFormApi.open();
}

/** 编辑模板 */
function handleEdit(row: PromptTemplateVO): void {
  promptFormApi.setData({ record: row });
  promptFormApi.open();
}

/** 测试模板 */
function handleTest(row: PromptTemplateVO): void {
  promptTestRef.value?.open(row);
}

/** 启用/停用 */
function handleToggle(row: PromptTemplateVO): void {
  row.enabled = !row.enabled;
  ElMessage.success(`已${row.enabled ? '启用' : '停用'}模板「${row.templateName}」`);
  gridApi.query();
}

/** 删除模板 */
async function handleDelete(row: PromptTemplateVO): Promise<void> {
  try {
    await ElMessageBox.confirm(
      `确定删除模板「${row.templateName}」吗？`,
      '删除确认',
      { type: 'warning' },
    );
    promptList.value = promptList.value.filter((t) => t.id !== row.id);
    ElMessage.success('删除成功');
    gridApi.query();
  } catch {
    // 用户取消
  }
}
</script>

<template>
  <Page auto-content-height>
    <Grid table-title="Prompt 模板管理">
      <template #toolbar-tools>
        <ElButton type="primary" @click="handleAdd">新增模板</ElButton>
      </template>
    </Grid>
    <PromptFormModal @success="gridApi.query()" />
    <PromptTest ref="promptTestRef" />
  </Page>
</template>
