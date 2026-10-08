<!--
 * Prompt 模板管理列表页面
 *
 * <p>提供 Prompt 模板的管理能力，包括新增/编辑/删除/测试/版本管理。
 * <p>列表数据当前由本地状态管理（后端 CRUD 端点建设中）；
 *    测试与评估能力已对接后端 PromptController。
 *
 * @path apps/agent-web/src/views/prompt/index.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
/**
 * Prompt 模板管理（列表页）
 * <p>管理 Agent 使用的 Prompt 模板，支持变量替换、版本管理、测试评估。
 * <p>注：列表 CRUD 当前走本地状态（后端仅开放 evaluate / compare 能力）。
 *
 * @author ydsz-team
 * @since 1.0.0
*/
import type { VxeTableGridOptions } from '@ydsz/plugins/vxe-table';
import { Page, useYdModal } from '@ydsz/common-ui';
import { YdBadge, YdButton, YdEmptyState } from '@ydsz-core/ydsz-ui';
import { h, ref } from 'vue';
import { createLogger } from '@ydsz/utils';
import { useYDSZVxeGrid } from '#/adapter/vxe-table';

const logger = createLogger('agent-prompt');

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

/** 提示词模板表单数据形状（与 prompt-form.vue 内的 PromptFormData 保持一致） */
interface PromptFormData {
  id?: string;
  templateCode?: string;
  templateName?: string;
  category?: string;
  content?: string;
  variables?: string[];
  enabled?: boolean;
  description?: string;
}

/** 本地 Prompt 列表数据（后端 CRUD 端点接入后可替换为 API 拉取） */
const promptList = ref<PromptTemplateVO[]>([]);

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
          h(YdBadge, { variant: row.enabled ? 'default' : 'outline' }, () =>
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
              YdButton,
              { size: 'sm', variant: 'link', onClick: () => handleEdit(row) },
              () => '编辑',
            ),
            h(
              YdButton,
              { size: 'sm', variant: 'link', onClick: () => handleTest(row) },
              () => '测试',
            ),
            h(
              YdButton,
              { size: 'sm', variant: 'link', onClick: () => handleToggle(row) },
              () => (row.enabled ? '停用' : '启用'),
            ),
            h(
              YdButton,
              { size: 'sm', variant: 'link', onClick: () => handleDelete(row) },
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
        itemRender: { name: 'YdInput', props: { placeholder: '请输入模板名称' } },
      },
      {
        field: 'templateCode',
        title: '模板编码',
        itemRender: { name: 'YdInput', props: { placeholder: '请输入模板编码' } },
      },
    ],
  },
};

const [Grid, gridApi] = useYDSZVxeGrid({ gridOptions });
const [PromptFormModal, promptFormApi] = useYdModal({ connectedComponent: PromptForm });

/** 测试弹窗引用 */
const promptTestRef = ref<InstanceType<typeof PromptTest> | null>(null);

/**
 * 格式化当前时间为 yyyy-MM-dd HH:mm:ss
 */
function formatNow(): string {
  const d = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

/** 新增模板 */
function handleAdd(): void {
  promptFormApi.setData({ record: undefined });
  promptFormApi.open();
}

/** 编辑模板 */
function handleEdit(row: PromptTemplateVO): void {
  promptFormApi.setData({ record: row });
  promptFormApi.open();
}

/**
 * 表单提交成功回调：将表单数据写入本地列表（有 id 则更新，无 id 则新增）
 * <p>后端 CRUD 端点就绪后可替换为 gridApi.query() 重新拉取。
 */
function handleFormSuccess(data?: PromptFormData): void {
  if (!data) return;
  if (data.id) {
    // 编辑：就地更新
    const index = promptList.value.findIndex((t) => t.id === data.id);
    if (index !== -1) {
      promptList.value[index] = {
        ...promptList.value[index],
        templateCode: data.templateCode ?? promptList.value[index].templateCode,
        templateName: data.templateName ?? promptList.value[index].templateName,
        category: data.category ?? promptList.value[index].category,
        content: data.content ?? promptList.value[index].content,
        variables: data.variables ?? promptList.value[index].variables,
        enabled: data.enabled ?? promptList.value[index].enabled,
        description: data.description ?? promptList.value[index].description,
        updatedAt: formatNow(),
      };
    }
  } else {
    // 新增：追加到列表
    promptList.value.push({
      id: `local_${Date.now()}`,
      templateCode: data.templateCode ?? '',
      templateName: data.templateName ?? '',
      category: data.category ?? '',
      content: data.content ?? '',
      variables: data.variables ?? [],
      version: 1,
      enabled: data.enabled ?? true,
      description: data.description ?? '',
      createdAt: formatNow(),
      updatedAt: formatNow(),
    });
  }
  showToast.success(data.id ? '更新成功' : '创建成功');
  gridApi.query();
}

/** 测试模板 */
function handleTest(row: PromptTemplateVO): void {
  promptTestRef.value?.open(row);
}

/** 启用/停用模板 */
function handleToggle(row: PromptTemplateVO): void {
  row.enabled = !row.enabled;
  showToast.success(`已${row.enabled ? '启用' : '停用'}模板「${row.templateName}」`);
  gridApi.query();
}

/** 删除模板 */
async function handleDelete(row: PromptTemplateVO): Promise<void> {
  try {
    await YdConfirm(
      `确定删除模板「${row.templateName}」吗？`,
      '删除确认',
      { type: 'warning' },
    );
    promptList.value = promptList.value.filter((t) => t.id !== row.id);
    showToast.success('删除成功');
    gridApi.query();
  } catch {
    logger.debug('用户取消删除 Prompt 模板操作');
  }
}
</script>

<template>
  <Page auto-content-height>
    <Grid table-title="Prompt 模板管理">
      <template #toolbar-tools>
        <YdButton @click="handleAdd">新增模板</YdButton>
      </template>
      <template #empty>
        <YdEmptyState title="暂无 Prompt 模板" description="点击「新增模板」创建你的第一个 Prompt 模板">
          <YdButton @click="handleAdd">新增模板</YdButton>
        </YdEmptyState>
      </template>
    </Grid>
    <PromptFormModal @success="handleFormSuccess" />
    <PromptTest ref="promptTestRef" />
  </Page>
</template>
