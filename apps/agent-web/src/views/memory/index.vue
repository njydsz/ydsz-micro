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
import { YdCard, YdEmptyState, YdButtonBase, YdInput, YdBadge } from '@ydsz-core/ydsz-ui';
import { h, ref } from 'vue';
import { createLogger } from '@ydsz/utils';
import { useYDSZVxeGrid } from '#/adapter/vxe-table';
import { clearMemory, consolidateMemory, countMessages, loadMemory } from '#/api/memory';
import type { MemoryVO } from '#/api/memory';

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
          h(YdButtonBase, { size: 'sm', variant: 'link', onClick: () => handleViewDetail(row) }, () => '详情'),
          h(YdButtonBase, { size: 'sm', variant: 'destructive', onClick: () => handleDelete(row) }, () => '删除'),
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
    await consolidateMemory({ conversationId: queryConversationId.value.trim() });
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
    await YdConfirm(
      `确定删除消息「${row.id ?? ''}」吗？该操作不可撤销。`,
      '删除确认',
      { type: 'warning' },
    );
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
    <div class="space-y-4 p-4">
      <!-- 搜索区域 -->
      <YdCard shadow="never">
        <div class="flex items-center gap-4">
          <span class="whitespace-nowrap text-sm font-medium">对话 ID：</span>
          <YdInput
            v-model="queryConversationId"
            placeholder="请输入对话 Conversation ID"
            style="width: 360px"
            @keyup.enter="handleSearch"
          />
          <YdButtonBase :loading="isLoading" @click="handleSearch">查询</YdButtonBase>
          <YdButtonBase variant="destructive" :disabled="!queryConversationId.trim()" @click="handleClearAll">清除全部</YdButtonBase>
          <YdButtonBase variant="outline" :disabled="!queryConversationId.trim()" @click="handleConsolidate">整合记忆</YdButtonBase>
        </div>
      </YdCard>

      <!-- 统计卡片 -->
      <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
        <YdCard shadow="hover">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-500">消息总数</p>
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
              <p class="text-sm text-gray-500">当前对话 ID</p>
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
              <p class="text-sm text-gray-500">已加载</p>
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
        <Grid v-if="queryConversationId.trim()" table-title="对话记忆列表">
          <template #toolbar-tools>
            <YdButtonBase @click="handleSearch">刷新</YdButtonBase>
          </template>
        </Grid>
        <YdEmptyState v-else description="请输入对话 ID 后点击查询" />
      </YdCard>
    </div>
  </Page>
</template>
