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
import { ElButton, ElMessage, ElMessageBox, ElTag } from 'element-plus';
import { h, ref } from 'vue';
import { useYDSZVxeGrid } from '#/adapter/vxe-table';
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
        default: ({ row }) => h(ElTag, { type: 'success' }, () => String(row.status ?? '-')),
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
            ElButton,
            {
              size: 'small',
              link: true,
              type: 'danger',
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
    const { value } = await ElMessageBox.prompt('请输入规则编码', '新增断点', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      inputPlaceholder: 'ruleCode',
      inputPattern: /\S+/,
      inputErrorMessage: '规则编码不能为空',
    });
    await addBreakpoint({ ruleCode: value.trim() });
    ElMessage.success('断点新增成功');
    gridApi.query();
  } catch {
    /* 错误提示由请求拦截器统一处理 */
  }
}
/** 删除断点 */
async function handleRemoveBreakpoint(row: DebugRow) {
  const breakpointId = String(row.breakpointId ?? row.id ?? '');
  if (!breakpointId) {
    ElMessage.warning('断点 ID 缺失，无法删除');
    return;
  }
  try {
    await ElMessageBox.confirm('确定删除该断点吗？', '删除确认', { type: 'warning' });
    await removeBreakpoint({ breakpointId });
    ElMessage.success('删除成功');
    gridApi.query();
  } catch {
    /* 错误提示由请求拦截器统一处理 */
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
    const { value } = await ElMessageBox.prompt(
      '请输入会话关联的规则编码（可留空）',
      '创建调试会话',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        inputPlaceholder: 'ruleCode',
      },
    );
    await createSession(value?.trim() ? { ruleCode: value.trim() } : {});
    ElMessage.success('会话创建成功');
    await loadSessions();
  } catch {
    /* 错误提示由请求拦截器统一处理 */
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
    ElMessage.warning('请先选择会话');
    return;
  }
  try {
    await ElMessageBox.confirm('确定结束该调试会话吗？', '结束会话', { type: 'warning' });
    await terminateSession({ sessionId });
    ElMessage.success('会话已结束');
    if (!row) {
      selectedSessionId.value = '';
    }
    await loadSessions();
  } catch {
    /* 错误提示由请求拦截器统一处理 */
  }
}
/** 向选中会话提交调试命令 */
async function handleSubmitCommand() {
  if (!selectedSessionId.value) {
    ElMessage.warning('请先选择会话');
    return;
  }
  if (!commandText.value.trim()) {
    ElMessage.warning('请输入调试命令');
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
          ><ElButton type="primary" @click="handleAddBreakpoint">新增断点</ElButton></template
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
            <ElButton size="small" type="primary" @click="handleCreateSession">创建会话</ElButton>
            <ElButton size="small" @click="loadSessions">刷新会话</ElButton>
          </div>
        </div>
        <ElTable :data="sessions" border size="small" class="mb-2">
          <ElTableColumn prop="sessionId" label="会话ID" min-width="180" />
          <ElTableColumn prop="ruleCode" label="规则编码" width="160" />
          <ElTableColumn prop="status" label="状态" width="90" />
          <ElTableColumn prop="createdAt" label="创建时间" width="170" />
          <ElTableColumn label="操作" width="160" fixed="right">
            <template #default="{ row }">
              <ElButton link type="primary" size="small" @click="handleSelectSession(row)"
                >选择</ElButton
              >
              <ElButton link type="danger" size="small" @click="handleTerminateSession(row)"
                >结束</ElButton
              >
            </template>
          </ElTableColumn>
        </ElTable>
        <div class="flex items-start gap-3">
          <ElInput
            v-model="commandText"
            type="textarea"
            :rows="4"
            placeholder="输入调试命令…"
            class="flex-1"
          />
          <ElButton type="primary" :disabled="!selectedSessionId" @click="handleSubmitCommand"
            >提交命令</ElButton
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
