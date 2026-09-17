<!--
 * 触发器管理页面
 *
 * <p>Agent 定时/事件触发器 CRUD,支持启用/禁用、编辑和删除。
 *
 * @path apps/agent-web/src/views/trigger/index.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
/**
 * 触发器管理页面
 * <p>消费后端 TriggerController（apps/agent-web/src/api/trigger.ts）：
 * listTriggers() 获取列表,getTrigger() 查看详情,
 * createTrigger() / updateTrigger() / deleteTrigger() 进行 CRUD,
 * enableTrigger() / disableTrigger() 控制启用状态。
 *
 * @author ydsz-team
 * @since 1.0.0
*/
import type { VxeTableGridOptions } from '@ydsz/plugins/vxe-table';
import { Page } from '@ydsz/common-ui';
// TODO: ElForm/ElFormItem/ElOption/ElSelect/ElSwitch 表单套件+ElEmpty SKIP,保留 element-plus
import { ElEmpty, ElForm, ElFormItem, ElOption, ElSelect, ElSwitch } from 'element-plus';
import { YdBadge, YdButtonBase, YdCard, YdCardContent, YdDialog, YdDialogContent, YdDialogFooter, YdDialogHeader, YdDialogTitle, YdInput, YdSelectBase, YdSelectContentBase, YdSelectItemBase, YdSelectTriggerBase, YdSelectValueBase } from '@ydsz-core/ydsz-ui';
import { h, ref } from 'vue';
import { createLogger } from '@ydsz/utils';
import { useYDSZVxeGrid } from '#/adapter/vxe-table';
import { createTrigger, deleteTrigger, disableTrigger, enableTrigger, getTrigger, listTriggers, updateTrigger } from '#/api/trigger';
import type { AgentTrigger } from '#/api/models';

const logger = createLogger('agent-trigger');

defineOptions({ name: 'TriggerManagement' });

/** 触发器列表数据 */
const triggers = ref<AgentTrigger[]>([]);

/** 创建/编辑弹窗可见性 */
const formModalVisible = ref(false);

/** 是否为编辑模式 */
const isEditMode = ref(false);

/** 编辑中的触发器 ID */
const editingTriggerId = ref('');

/** 搜索表单 */
const searchForm = ref({
  name: '',
  triggerType: '',
});

/** 编辑表单 */
const editForm = ref({
  triggerId: '',
  name: '',
  description: '',
  triggerType: 'cron',
  cronExpression: '',
  targetAgentCode: '',
  config: '',
  enabled: true,
});

/** 列定义 */
const gridColumns: VxeTableGridOptions<AgentTrigger>['columns'] = [
  { type: 'seq', width: 50, title: '序号' },
  { field: 'triggerId', title: '触发器 ID', width: 200, showOverflow: true },
  { field: 'name', title: '名称', width: 160, showOverflow: true },
  { field: 'triggerType', title: '类型', width: 120 },
  { field: 'cronExpression', title: 'Cron 表达式', width: 160 },
  { field: 'targetAgentCode', title: '目标 Agent', width: 140 },
  {
    field: 'enabled',
    title: '状态',
    width: 80,
    slots: {
      default: ({ row }) =>
        h(YdBadge, { variant: row.enabled ? 'default' : 'secondary' }, () =>
          row.enabled ? '启用' : '停用',
        ),
    },
  },
  { field: 'totalTriggerCount', title: '触发次数', width: 100 },
  { field: 'maxExecutionsPerHour', title: '每小时上限', width: 110 },
  { field: 'lastTriggeredAt', title: '上次触发', width: 170 },
  { field: 'createdAt', title: '创建时间', width: 170 },
  {
    field: 'action',
    title: '操作',
    width: 240,
    fixed: 'right',
    slots: {
      default: ({ row }) =>
        h('div', { class: 'flex gap-1' }, [
          h(YdButtonBase, {
            size: 'sm', variant: 'link',
            className: row.enabled ? 'text-yellow-600' : 'text-green-600',
            onClick: () => handleToggleEnabled(row),
          }, () => (row.enabled ? '禁用' : '启用')),
          h(YdButtonBase, { size: 'sm', variant: 'link', onClick: () => handleEdit(row) }, () => '编辑'),
          h(YdButtonBase, { size: 'sm', variant: 'link', className: 'text-destructive', onClick: () => handleDelete(row) }, () => '删除'),
        ]),
    },
  },
];

const gridOptions: VxeTableGridOptions<AgentTrigger> = {
  columns: gridColumns,
  height: 'auto',
  proxyConfig: {
    ajax: {
      query: async () => {
        const items = await listTriggers();
        triggers.value = items ?? [];
        return { items: items ?? [], total: items?.length ?? 0 };
      },
    },
  },
  toolbarConfig: { custom: true, refresh: { code: 'query' }, search: true, zoom: true },
  formConfig: { enabled: true, items: [
    { field: 'name', title: '名称', itemRender: { name: 'YdInput', props: { placeholder: '触发器名称' } } },
    {
      field: 'triggerType',
      title: '类型',
      itemRender: {
        name: 'YdSelectBase',
        options: [
          { label: 'Cron 定时', value: 'cron' },
          { label: 'Webhook', value: 'webhook' },
          { label: '事件驱动', value: 'event' },
          { label: 'Agent 生命周期', value: 'agent_lifecycle' },
          { label: '内容匹配', value: 'content_match' },
          { label: '工作流完成', value: 'workflow_completion' },
        ],
        props: { placeholder: '触发类型' },
      },
    },
  ] },
};

const [Grid, gridApi] = useYDSZVxeGrid({ gridOptions });

/** 刷新列表 */
function refreshList(): void {
  gridApi.query();
}

/** 打开创建弹窗 */
function handleCreate(): void {
  isEditMode.value = false;
  editingTriggerId.value = '';
  editForm.value = {
    triggerId: '',
    name: '',
    description: '',
    triggerType: 'cron',
    cronExpression: '',
    targetAgentCode: '',
    config: '',
    enabled: true,
  };
  formModalVisible.value = true;
}

/** 打开编辑弹窗 */
async function handleEdit(row: AgentTrigger): Promise<void> {
  isEditMode.value = true;
  editingTriggerId.value = row.triggerId ?? '';
  try {
    const detail = await getTrigger({ triggerId: row.triggerId ?? '' });
    editForm.value = {
      triggerId: detail.triggerId ?? '',
      name: detail.name ?? '',
      description: detail.description ?? '',
      triggerType: detail.triggerType ?? 'cron',
      cronExpression: detail.cronExpression ?? '',
      targetAgentCode: detail.targetAgentCode ?? '',
      config: detail.config ? JSON.stringify(detail.config) : '',
      enabled: detail.enabled ?? true,
    };
    formModalVisible.value = true;
  } catch (error) {
    logger.warn('获取触发器详情失败: {}', error);
  }
}

/** 提交创建/编辑表单 */
async function submitForm(): Promise<void> {
  const formData: Record<string, unknown> = {
    name: editForm.value.name,
    description: editForm.value.description,
    triggerType: editForm.value.triggerType,
    cronExpression: editForm.value.cronExpression,
    targetAgentCode: editForm.value.targetAgentCode,
    enabled: editForm.value.enabled,
  };

  if (editForm.value.config) {
    try {
      formData.config = JSON.parse(editForm.value.config);
    } catch {
      logger.warn('配置 JSON 格式无效');
      return;
    }
  }

  try {
    if (isEditMode.value) {
      await updateTrigger({ triggerId: editingTriggerId.value }, formData);
    } else {
      await createTrigger(formData);
    }
    formModalVisible.value = false;
    refreshList();
  } catch (error) {
    logger.warn('保存触发器失败: {}', error);
  }
}

/** 启用/禁用触发器 */
async function handleToggleEnabled(row: AgentTrigger): Promise<void> {
  try {
    if (row.enabled) {
      await disableTrigger({ triggerId: row.triggerId ?? '' });
    } else {
      await enableTrigger({ triggerId: row.triggerId ?? '' });
    }
    refreshList();
  } catch (error) {
    logger.warn('切换触发器状态失败: {}', error);
  }
}

/** 删除触发器 */
async function handleDelete(row: AgentTrigger): Promise<void> {
  try {
    await ydszConfirm(
      `确定删除触发器「${row.name ?? row.triggerId ?? ''}」吗?该操作不可撤销。`,
      '删除确认',
      { type: 'warning' },
    );
  } catch {
    return;
  }
  try {
    await deleteTrigger({ triggerId: row.triggerId ?? '' });
    refreshList();
  } catch (error) {
    logger.warn('删除触发器失败: {}', error);
  }
}
</script>

<template>
  <Page auto-content-height>
    <div class="space-y-4 p-4">
      <!-- 搜索区域 -->
      <YdCard>
        <YdCardContent class="pt-6">
          <div class="flex items-center gap-4">
            <YdInput
              v-model="searchForm.name"
              placeholder="按名称搜索..."
              class="max-w-xs"
            />
            <YdSelectBase v-model="searchForm.triggerType">
              <YdSelectTriggerBase class="w-40">
                <YdSelectValueBase placeholder="按类型筛选" />
              </YdSelectTriggerBase>
              <YdSelectContentBase>
                <YdSelectItemBase value="cron">Cron 定时</YdSelectItemBase>
                <YdSelectItemBase value="webhook">Webhook</YdSelectItemBase>
                <YdSelectItemBase value="event">事件驱动</YdSelectItemBase>
                <YdSelectItemBase value="agent_lifecycle">Agent 生命周期</YdSelectItemBase>
                <YdSelectItemBase value="content_match">内容匹配</YdSelectItemBase>
                <YdSelectItemBase value="workflow_completion">工作流完成</YdSelectItemBase>
              </YdSelectContentBase>
            </YdSelectBase>
            <YdButtonBase @click="refreshList">搜索</YdButtonBase>
            <YdButtonBase variant="outline" @click="searchForm.name = ''; searchForm.triggerType = ''">重置</YdButtonBase>
          </div>
        </YdCardContent>
      </YdCard>

      <!-- 列表 -->
      <YdCard>
        <YdCardContent class="pt-6">
          <Grid table-title="触发器管理">
            <template #toolbar-tools>
              <YdButtonBase @click="handleCreate">新建触发器</YdButtonBase>
            </template>
          </Grid>
          <ElEmpty v-if="triggers.length === 0" description="暂无触发器" />
        </YdCardContent>
      </YdCard>
    </div>

    <!-- 新建/编辑弹窗 -->
    <YdDialog v-model:open="formModalVisible">
      <YdDialogContent class="sm:max-w-[600px]">
        <YdDialogHeader>
          <YdDialogTitle>{{ isEditMode ? '编辑触发器' : '新建触发器' }}</YdDialogTitle>
        </YdDialogHeader>
        <ElForm :model="editForm" label-width="120px">
          <ElFormItem label="名称" required>
            <ElInput v-model="editForm.name" placeholder="请输入触发器名称" />
          </ElFormItem>
          <ElFormItem label="描述">
            <ElInput v-model="editForm.description" type="textarea" :rows="2" placeholder="请输入描述信息" />
          </ElFormItem>
          <ElFormItem label="触发类型" required>
            <ElSelect v-model="editForm.triggerType" class="w-full">
              <ElOption label="Cron 定时" value="cron" />
              <ElOption label="Webhook" value="webhook" />
              <ElOption label="事件驱动" value="event" />
              <ElOption label="Agent 生命周期" value="agent_lifecycle" />
              <ElOption label="内容匹配" value="content_match" />
              <ElOption label="工作流完成" value="workflow_completion" />
            </ElSelect>
          </ElFormItem>
          <ElFormItem
            v-if="editForm.triggerType === 'cron'"
            label="Cron 表达式"
            required
          >
            <ElInput v-model="editForm.cronExpression" placeholder="例如: 0 0 * * * (每天零点)" />
          </ElFormItem>
          <ElFormItem label="目标 Agent">
            <ElInput v-model="editForm.targetAgentCode" placeholder="请输入目标 Agent 编码" />
          </ElFormItem>
          <ElFormItem label="配置 JSON">
            <ElInput v-model="editForm.config" type="textarea" :rows="4" placeholder='{"key": "value"}' />
          </ElFormItem>
          <ElFormItem label="启用状态">
            <ElSwitch
              v-model="editForm.enabled"
              active-text="启用"
              inactive-text="停用"
            />
          </ElFormItem>
        </ElForm>
        <YdDialogFooter>
          <YdButtonBase variant="outline" @click="formModalVisible = false">取消</YdButtonBase>
          <YdButtonBase @click="submitForm">{{ isEditMode ? '保存修改' : '确认创建' }}</YdButtonBase>
        </YdDialogFooter>
      </YdDialogContent>
    </YdDialog>
  </Page>
</template>
