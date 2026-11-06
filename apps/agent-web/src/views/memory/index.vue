<!--
 * 对话记忆管理列表页面
 *
 * <p>展示对话记忆列表，支持按对话 ID 搜索查看、清除记忆、触发记忆整合。
 *
 * @path apps/agent-web/src/views/memory/index.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
import { $t } from '@ydsz/locales';
/**
 * 对话记忆管理（列表页）
 * <p>消费后端 MemoryController（apps/agent-web/src/api/memory.ts）：
 * loadMemory() / countMessages() 获取记忆数量与列表，
 * clearMemory() 清除记忆，consolidateMemory() 触发整合。
 *
 * @author ydsz-team
 * @since 1.0.0
 */
import type { VxeTableGridOptions } from '@ydsz/plugins/vxe-table';
import { Page } from '@ydsz/common-ui';
import {
  YdBadge,
  YdButton,
  YdCard,
  YdEmptyState,
  YdInput,
  YdSelect,
  YdTextarea,
} from '@ydsz-core/ydsz-ui';
import { YdConfirm } from '@ydsz-core/popup-ui';
import { h, ref } from 'vue';
import { createLogger } from '@ydsz/utils';
import { useYdModal } from '@ydsz/common-ui';
import { useYDSZVxeGrid } from '#/adapter/vxe-table';
import { clearMemory, consolidate, countMessages, loadMemory, saveMemory } from '#/api/memory';
import type { MemoryVO, SaveMemoryRequest } from '#/api/memory';

const logger = createLogger('agent-memory');

defineOptions({ name: 'MemoryManagement' });

/** 当前查询的对话 ID */
const queryConversationId = ref('');

/** 消息数量 */
const messageCount = ref(0);

/** 正在加载 */
const isLoading = ref(false);

/** 记忆列表数据 */
const memoryList = ref<MemoryVO[]>([]);

/** 角色标签类型 */
function getRoleTagType(role: string): 'success' | 'danger' | 'warning' | 'info' {
  switch ((role ?? '').toUpperCase()) {
    case 'USER':
      return 'primary' as 'info';
    case 'ASSISTANT':
      return 'success';
    case 'SYSTEM':
      return 'warning';
    case 'TOOL':
      return 'danger';
    default:
      return 'info';
  }
}

/** 角色中文标签 */
function getRoleLabel(role: string): string {
  switch ((role ?? '').toUpperCase()) {
    case 'USER':
      return '用户';
    case 'ASSISTANT':
      return '助手';
    case 'SYSTEM':
      return '系统';
    case 'TOOL':
      return '工具';
    default:
      return role ?? '-';
  }
}

/** 列定义 */
const columns: VxeTableGridOptions<MemoryVO>['columns'] = [
  { type: 'seq', width: 50, title: '序号' },
  { field: 'id', title: '消息 ID', width: 200, showOverflow: true },
  {
    field: 'role',
    title: '角色',
    width: 100,
    slots: {
      default: ({ row }) =>
        h(YdBadge, { variant: getRoleTagType(row.role ?? '') }, () => getRoleLabel(row.role ?? '')),
    },
  },
  { field: 'content', title: '消息内容', minWidth: 200, showOverflow: 'tooltip' },
  { field: 'createdAt', title: '创建时间', width: 170 },
  { field: 'toolCallId', title: 'ToolCall ID', width: 160, showOverflow: true },
  {
    field: 'action',
    title: '操作',
    width: 140,
    fixed: 'right',
    slots: {
      default: ({ row }) =>
        h('div', { class: 'flex gap-1' }, [
          h(
            YdButton,
            { size: 'sm', variant: 'link', onClick: () => handleViewDetail(row) },
            () => '详情',
          ),
          h(
            YdButton,
            { size: 'sm', variant: 'destructive', onClick: () => handleDelete(row) },
            () => '删除',
          ),
        ]),
    },
  },
];

/** 表格配置 */
const gridOptions: VxeTableGridOptions<MemoryVO> = {
  columns,
  height: 'auto',
  proxyConfig: {
    ajax: {
      query: async () => {
        if (!queryConversationId.value.trim()) {
          return { items: [], total: 0 };
        }
        isLoading.value = true;
        try {
          const items = await loadMemory({ conversationId: queryConversationId.value.trim() });
          memoryList.value = items ?? [];
          const count = await countMessages({ conversationId: queryConversationId.value.trim() });
          messageCount.value = count ?? 0;
          return { items: items ?? [], total: items?.length ?? 0 };
        } catch (error) {
          logger.warn('加载记忆数据失败: {}', error);
          return { items: [], total: 0 };
        } finally {
          isLoading.value = false;
        }
      },
    },
  },
  toolbarConfig: { custom: true, refresh: { code: 'query' }, search: true, zoom: true },
  formConfig: {
    enabled: true,
    items: [
      {
        field: 'content',
        title: '内容关键字',
        itemRender: { name: 'YdInput', props: { placeholder: '请输入消息内容关键字' } },
      },
      {
        field: 'role',
        title: '消息角色',
        itemRender: { name: 'YdInput', props: { placeholder: '请输入消息角色' } },
      },
    ],
  },
};

const [Grid, gridApi] = useYDSZVxeGrid({ gridOptions });

/** 新增记忆弹窗输入 */
const saveFormRole = ref<string>('USER');
const saveFormContent = ref<string>('');
const [SaveMemoryModal, saveMemoryApi] = useYdModal({ connectedComponent: null });

async function handleOpenSaveMemory(): Promise<void> {
  if (!queryConversationId.value.trim()) {
    showToast.warning('请先输入对话 ID');
    return;
  }
  saveFormRole.value = 'USER';
  saveFormContent.value = '';
  saveMemoryApi.open();
}

async function handleSaveMemoryConfirm(): Promise<void> {
  if (!saveFormContent.value.trim()) {
    showToast.warning($t('validation.required.memoryContent'));
    return;
  }
  const data: SaveMemoryRequest = {
    role: saveFormRole.value,
    content: saveFormContent.value.trim(),
  };
  try {
    await saveMemory({ conversationId: queryConversationId.value.trim() }, data);
    showToast.success($t('operation.success'));
    gridApi.query();
  } catch (error) {
    logger.warn('新增记忆失败: {}', error);
  }
}

/** 搜索处理 */
function handleSearch(): void {
  if (!queryConversationId.value.trim()) {
    showToast.warning('请输入对话 ID');
    return;
  }
  gridApi.query();
}

/** 清除全部记忆 */
async function handleClearAll(): Promise<void> {
  if (!queryConversationId.value.trim()) {
    showToast.warning('请先输入对话 ID');
    return;
  }
  try {
    await YdConfirm(
      `确定清除对话「${queryConversationId.value.trim()}」的全部记忆吗？该操作不可撤销。`,
      '清除确认',
      { type: 'warning' },
    );
  } catch {
    logger.debug('用户取消清除记忆操作');
    return;
  }
  try {
    await clearMemory({ conversationId: queryConversationId.value.trim() });
    showToast.success('清除成功');
    gridApi.query();
  } catch (error) {
    logger.warn('清除记忆失败: {}', error);
  }
}

/** 触发记忆整合 */
async function handleConsolidate(): Promise<void> {
  if (!queryConversationId.value.trim()) {
    showToast.warning('请先输入对话 ID');
    return;
  }
  try {
    await YdConfirm(
      `确定对对话「${queryConversationId.value.trim()}」执行记忆整合吗？将提取有价值的事实并刷新用户画像。`,
      '整合确认',
      { type: 'warning' },
    );
  } catch {
    logger.debug('用户取消记忆整合操作');
    return;
  }
  try {
    await consolidate({ conversationId: queryConversationId.value.trim() }, {});
    showToast.success('记忆整合任务已触发');
  } catch (error) {
    logger.warn('触发记忆整合失败: {}', error);
  }
}

/** 查看详情 */
function handleViewDetail(row: MemoryVO): void {
  gridApi.query();
  logger.debug('查看记忆详情: {}', row.id);
}

/** 删除单条记忆 */
async function handleDelete(row: MemoryVO): Promise<void> {
  try {
    await YdConfirm(`确定删除消息「${row.id ?? ''}」吗？该操作不可撤销。`, '删除确认', {
      type: 'warning',
    });
  } catch {
    logger.debug('用户取消删除记忆操作');
    return;
  }
  try {
    await clearMemory({ conversationId: queryConversationId.value.trim() });
    showToast.success('单条记忆删除需清除后重新加载');
    gridApi.query();
  } catch (error) {
    logger.warn('删除记忆失败: {}', error);
  }
}
</script>

<template>
  <Page auto-content-height>
    <div class="space-y-4 p-5">
      <!-- 搜索区域 -->
      <YdCard shadow="never">
        <div class="flex items-center gap-5">
          <span class="whitespace-nowrap text-sm font-medium">{{ $t('business.memory.conversationId') }}：</span>
          <YdInput
            v-model="queryConversationId"
            :placeholder="$t('business.memory.conversationIdPlaceholder')"
            style="width: 360px"
            @keyup.enter="handleSearch"
          />
          <YdButton :loading="isLoading" @click="handleSearch">{{
            $t('business.memory.actions.query')
          }}</YdButton>
          <YdButton
            variant="default"
            :disabled="!queryConversationId.trim()"
            @click="handleOpenSaveMemory"
            >{{ $t('business.memory.actions.add') }}</YdButton
          >
          <YdButton
            variant="destructive"
            :disabled="!queryConversationId.trim()"
            @click="handleClearAll"
            >{{ $t('business.memory.actions.clear') }}</YdButton
          >
          <YdButton
            variant="outline"
            :disabled="!queryConversationId.trim()"
            @click="handleConsolidate"
            >{{ $t('business.memory.actions.consolidate') }}</YdButton
          >
        </div>
      </YdCard>

      <!-- 统计卡片 -->
      <div class="grid grid-cols-1 gap-5 md:grid-cols-3">
        <YdCard shadow="hover">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-500">{{ $t('business.memory.stats.totalMessages') }}</p>
              <p class="mt-1 text-2xl font-bold text-blue-600">{{ messageCount }}</p>
            </div>
            <div class="rounded-full bg-blue-50 p-3">
              <span class="text-2xl text-blue-500">💬</span>
            </div>
          </div>
        </YdCard>

        <YdCard shadow="hover">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-500">{{ $t('business.memory.stats.currentConversation') }}</p>
              <p class="mt-1 truncate text-sm font-medium">{{ queryConversationId || '-' }}</p>
            </div>
            <div class="rounded-full bg-green-50 p-3">
              <span class="text-2xl text-green-500">🔗</span>
            </div>
          </div>
        </YdCard>

        <YdCard shadow="hover">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-500">{{ $t('business.memory.stats.loaded') }}</p>
              <p class="mt-1 text-2xl font-bold text-purple-600">{{ memoryList.length }}</p>
            </div>
            <div class="rounded-full bg-purple-50 p-3">
              <span class="text-2xl text-purple-500">💾</span>
            </div>
          </div>
        </YdCard>
      </div>

      <!-- 数据表格 -->
      <YdCard shadow="never">
        <Grid v-if="queryConversationId.trim()" :table-title="$t('business.memory.table.title')">
          <template #toolbar-tools>
            <YdButton @click="handleSearch">{{ $t('business.memory.table.refresh') }}</YdButton>
          </template>
        </Grid>
        <YdEmptyState v-else :description="$t('business.memory.table.empty')" />
      </YdCard>
    </div>

    <!-- 新增记忆弹窗 -->
    <SaveMemoryModal :title="$t('business.memory.modal.title')">
      <div class="space-y-4">
        <div>
          <label class="mb-1 block text-sm font-medium">{{ $t('business.memory.modal.role') }}</label>
          <YdSelect
            v-model:value="saveFormRole"
            :options="[
              { label: $t('business.memory.role.user'), value: 'USER' },
              { label: $t('business.memory.role.assistant'), value: 'ASSISTANT' },
              { label: $t('business.memory.role.system'), value: 'SYSTEM' },
              { label: $t('business.memory.role.tool'), value: 'TOOL' },
            ]"
          />
        </div>
        <div>
          <label class="mb-1 block text-sm font-medium">{{ $t('business.memory.modal.content') }}</label>
          <YdTextarea
            v-model:value="saveFormContent"
            :placeholder="$t('business.memory.modal.contentPlaceholder')"
            :rows="4"
          />
        </div>
      </div>
      <template #footer>
        <YdButton variant="outline" @click="saveMemoryApi.close()">{{
          $t('business.memory.modal.cancel')
        }}</YdButton>
        <YdButton @click="handleSaveMemoryConfirm">{{ $t('business.memory.modal.confirm') }}</YdButton>
      </template>
    </SaveMemoryModal>
  </Page>
</template>
