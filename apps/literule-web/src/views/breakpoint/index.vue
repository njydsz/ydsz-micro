<!--
 * 规则断点调试页面
 *
 * @path apps\literule-web\src\views\breakpoint\index.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
/**
 * 规则断点调试（页面）
 * <p>断点管理 + 调试会话工具页，数据来自后端契约 API（apps/literule-web/src/api/ruleDebug.ts）。
 *
 * @author ydsz-team
 * @since 1.0.0
 */
import type { VxeGridProps } from '@ydsz/plugins/vxe-table';
import { Page } from '@ydsz/common-ui';
import { YdBadge, YdButtonBase } from '@ydsz-core/ydsz-ui';
import { YdConfirm, YdPrompt } from '@ydsz-core/popup-ui';
import { h, ref } from 'vue';
import { createLogger } from '@ydsz-core/shared/utils';
import { useYDSZVxeGrid } from '#/adapter/vxe-table';
const logger = createLogger('literule-breakpoint');
import {
  addBreakpoint,
  createSession,
  listBreakpoints,
  listSessions,
  removeBreakpoint,
  submitCommand,
  terminateSession,
} from '#/api/ruleDebug';
import { formatJsonResult, toRecordList } from '#/utils/format';
defineOptions({ name: 'BreakpointManagement' });
/** 断点/Session 行数据的兜底类型（后端契约返回 unknown） */
type DebugRow = Record<string, unknown>;
const gridOptions: VxeGridProps<DebugRow> = {
  columns: [
    { type: 'seq', width: 50, title: '序号' },
    { field: 'breakpointId', title: '断点ID', width: 160 },
    { field: 'ruleCode', title: '规则编码', width: 160 },
    { field: 'condition', title: '断点条件', minWidth: 200 },
    { field: 'hitCount', title: '命中次数', width: 90 },
    {
      field: 'status',
      title: '状态',
      width: 90,
      slots: {
        default: ({ row }) => h(YdBadge, { variant: 'default' }, () => String(row.status ?? '-')),
      },
    },
    { field: 'createdAt', title: '创建时间', width: 160 },
    {
      field: 'action',
      title: '操作',
      width: 90,
      fixed: 'right',
      slots: {
        default: ({ row }) =>
          h(
            YdButtonBase,
            {
              size: 'sm',
              variant: 'link',
              onClick: () => handleRemoveBreakpoint(row),
            },
            () => '删除',
          ),
      },
    },
  ],
  height: 'auto',
  proxyConfig: {
    ajax: {
      query: async () => {
        const items = toRecordList(await listBreakpoints());
        return { items, total: items.length };
      },
    },
  },
  toolbarConfig: { custom: true, refresh: { code: 'query' }, zoom: true },
};
const [Grid, gridApi] = useYDSZVxeGrid({ gridOptions });
/** 新增断点（规则编码） */
async function handleAddBreakpoint() {
  try {
    const value = await YdPrompt<string>({
      content: t('createBreakpointPrompt'),
      confirmText: t('confirmBtn'),
      cancelText: t('cancelBtn'),
      defaultValue: '',
      componentProps: {
        placeholder: 'ruleCode',
      },
      beforeClose: ({ isConfirm, value: inputValue }) => {
        if (!isConfirm) return;
        if (!inputValue?.trim()) {
          showToast.warning(t('ruleCodeEmptyError'));
          return false;
        }
      },
    });
    await addBreakpoint({ ruleCode: value?.trim() });
    showToast.success(t('breakpointAddSuccess'));
    gridApi.query();
  } catch (error) {
    if (error !== undefined && error !== null) {
      logger.warn('新增断点失败: {}', error);
    }
    // 用户提示由 errorMessageResponseInterceptor 统一处理
  }
}
/** 删除断点 */
async function handleRemoveBreakpoint(row: DebugRow) {
  const breakpointId = String(row.breakpointId ?? row.id ?? '');
  if (!breakpointId) {
    showToast.warning(t('breakpointIdMissing'));
    return;
  }
  try {
    await YdConfirm(t('confirmDeleteBreakpoint'), t('deleteConf'), { icon: 'warning' });
    await removeBreakpoint({ breakpointId });
    showToast.success(t('deleteSuccess'));
    gridApi.query();
  } catch (error) {
    logger.warn('删除断点失败: {}', error);
    // 用户提示由 errorMessageResponseInterceptor 统一处理
  }
}
/** 调试会话列表 */
const sessions = ref<DebugRow[]>([]);
const selectedSessionId = ref('');
const commandText = ref('');
const commandResult = ref('');
/** 加载调试会话列表 */
async function loadSessions() {
  sessions.value = toRecordList(await listSessions());
  if (!selectedSessionId.value && sessions.value.length > 0) {
    const first = sessions.value[0] ?? {};
    selectedSessionId.value = String(first.sessionId ?? first.id ?? '');
  }
}
/** 创建调试会话 */
async function handleCreateSession() {
  try {
    const value = await YdPrompt<string>({
      content: t('createSessionPrompt'),
      confirmText: t('confirmBtn'),
      cancelText: t('cancelBtn'),
      defaultValue: '',
      componentProps: {
        placeholder: 'ruleCode',
      },
    });
    await createSession(value?.trim() ? { ruleCode: value.trim() } : {});
    showToast.success(t('sessionCreateSuccess'));
    await loadSessions();
  } catch (error) {
    if (error !== undefined && error !== null) {
      logger.warn('创建调试会话失败: {}', error);
    }
    // 用户提示由 errorMessageResponseInterceptor 统一处理
  }
}
/** 选择会话 */
function handleSelectSession(row: DebugRow) {
  selectedSessionId.value = String(row.sessionId ?? row.id ?? '');
}
/** 结束会话 */
async function handleTerminateSession(row?: DebugRow) {
  const sessionId = row ? String(row.sessionId ?? row.id ?? '') : selectedSessionId.value;
  if (!sessionId) {
    showToast.warning(t('selectSessionFirst'));
    return;
  }
  try {
    await YdConfirm(t('endSessionConfirm'), { title: t('endSession'), type: 'warning' });
    await terminateSession({ sessionId });
    showToast.success(t('sessionEndSuccess'));
    if (!row) {
      selectedSessionId.value = '';
    }
    await loadSessions();
  } catch (error) {
    logger.warn('结束调试会话失败: {}', error);
    // 用户提示由 errorMessageResponseInterceptor 统一处理
  }
}
/** 向选中会话提交调试命令 */
async function handleSubmitCommand() {
  if (!selectedSessionId.value) {
    showToast.warning('请先选择会话');
    return;
  }
  if (!commandText.value.trim()) {
    showToast.warning(t('inputDebugCommand'));
    return;
  }
  const data = await submitCommand(
    { sessionId: selectedSessionId.value },
    { command: commandText.value.trim() },
  );
  commandResult.value = formatJsonResult(data);
}
</script>
<template>
  <Page auto-content-height>
    <div class="flex flex-col gap-3 p-4">
      <Grid table-title="断点列表">
        <template #toolbar-tools
          ><YdButtonBase @click="handleAddBreakpoint">新增断点</YdButtonBase></template
        >
      </Grid>
      <div class="rounded border border-gray-200 bg-white p-3">
        <div class="mb-2 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="text-sm font-medium">调试会话</span>
            <span v-if="selectedSessionId" class="text-xs text-gray-500"
              >当前会话：{{ selectedSessionId }}</span
            >
          </div>
          <div class="flex gap-2">
            <YdButtonBase size="sm" @click="handleCreateSession">创建会话</YdButtonBase>
            <YdButtonBase size="sm" variant="secondary" @click="loadSessions">刷新会话</YdButtonBase>
          </div>
        </div>
        <YdTable :data="sessions" border size="small" class="mb-2">
          <YdTableColumn prop="sessionId" label="会话ID" min-width="180" />
          <YdTableColumn prop="ruleCode" label="规则编码" width="160" />
          <YdTableColumn prop="status" label="状态" width="90" />
          <YdTableColumn prop="createdAt" label="创建时间" width="170" />
          <YdTableColumn label="操作" width="160" fixed="right">
            <template #default="{ row }">
              <YdButtonBase variant="link" size="sm" @click="handleSelectSession(row)"
                >选择</YdButtonBase
              >
              <YdButtonBase variant="link" size="sm" @click="handleTerminateSession(row)"
                >结束</YdButtonBase
              >
            </template>
          </YdTableColumn>
        </YdTable>
        <div class="flex items-start gap-3">
          <YdInput
            v-model="commandText"
            type="textarea"
            :rows="4"
            placeholder="输入调试命令…"
            class="flex-1"
          />
          <YdButtonBase :disabled="!selectedSessionId" @click="handleSubmitCommand"
            >提交命令</YdButtonBase
          >
        </div>
        <pre
          v-if="commandResult"
          class="mt-2 overflow-auto rounded border border-gray-300 bg-gray-50 p-3 text-xs"
          >{{ commandResult }}</pre>
      </div>
    </div>
  </Page>
</template>
