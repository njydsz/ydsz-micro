<!--
 * TeamRun 多Agent协作页面
 *
 * <p>管理多Agent协作运行任务,支持创建 TeamRun、添加成员、启动和取消。
 *
 * @path apps/agent-web/src/views/team-run/index.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
/**
 * TeamRun 多Agent协作页面
 * <p>消费后端 TeamRunController（apps/agent-web/src/api/teamRun.ts）：
 * listActiveTeamRuns() 获取活跃列表,getTeamRun() 查看详情,
 * createTeamRun() / addMember() / startTeamRun() / cancelTeamRun() 管理操作。
 *
 * @author ydsz-team
 * @since 1.0.0
*/
import type { VxeTableGridOptions } from '@ydsz/plugins/vxe-table';
import { Page, useYDSZModal } from '@ydsz/common-ui';
import { ElButton, ElCard, ElDialog, ElEmpty, ElForm, ElFormItem, ElInput, ElMessageBox, ElOption, ElSelect, ElTag } from 'element-plus';
import { h, ref } from 'vue';
import { createLogger } from '@ydsz/utils';
import { useYDSZVxeGrid } from '#/adapter/vxe-table';
import { addMember, cancelTeamRun, createTeamRun, getTeamRun, listActiveTeamRuns, startTeamRun } from '#/api/teamRun';
import type { TeamRun } from '#/api/models';

const logger = createLogger('agent-teamrun');

defineOptions({ name: 'TeamRunManagement' });

/** TeamRun 列表数据 */
const teamRuns = ref<TeamRun[]>([]);

/** TeamRun 详情弹窗可见性 */
const teamRunDetailVisible = ref(false);

/** 创建 TeamRun 弹窗可见性 */
const createModalVisible = ref(false);

/** 添加成员弹窗可见性 */
const addMemberModalVisible = ref(false);

/** 当前选中的 TeamRun */
const selectedTeamRun = ref<TeamRun | null>(null);

/** 当前要添加成员的 TeamRun ID */
const currentTeamRunId = ref('');

/** 创建 TeamRun 表单 */
const createForm = ref({
  title: '',
  description: '',
  pattern: 'SEQUENTIAL',
});

/** 添加成员表单 */
const memberForm = ref({
  agentCode: '',
  role: '',
  inputContext: '',
  executionOrder: 0,
});

/** 状态标签类型 */
function getStatusTagType(status: string): 'success' | 'danger' | 'warning' | 'info' {
  switch ((status ?? '').toUpperCase()) {
    case 'COMPLETED':
    case 'FINISHED':
    case 'SUCCESS':
      return 'success';
    case 'FAILED':
    case 'ERROR':
    case 'CANCELLED':
      return 'danger';
    case 'RUNNING':
    case 'IN_PROGRESS':
    case 'ACTIVE':
      return 'warning';
    case 'PENDING':
    case 'WAITING':
    case 'CREATED':
      return 'info';
    default:
      return 'info';
  }
}

/** TeamRun 列表列定义 */
const gridColumns: VxeTableGridOptions<TeamRun>['columns'] = [
  { type: 'seq', width: 50, title: '序号' },
  { field: 'teamRunId', title: 'TeamRun ID', width: 200, showOverflow: true },
  { field: 'title', title: '名称', width: 180, showOverflow: true },
  { field: 'pattern', title: '协作模式', width: 120 },
  {
    field: 'status',
    title: '状态',
    width: 100,
    slots: {
      default: ({ row }) =>
        h(ElTag, { type: getStatusTagType(row.status ?? '') }, () => row.status ?? '-'),
    },
  },
  {
    field: 'members',
    title: '成员数',
    width: 80,
    formatter: ({ row }) => (row.members ? String(row.members.length) : '0'),
  },
  { field: 'createdAt', title: '创建时间', width: 170 },
  { field: 'startedAt', title: '启动时间', width: 170 },
  { field: 'completedAt', title: '完成时间', width: 170 },
  {
    field: 'action',
    title: '操作',
    width: 320,
    fixed: 'right',
    slots: {
      default: ({ row }) =>
        h('div', { class: 'flex gap-1' }, [
          h(ElButton, { size: 'small', link: true, type: 'primary', onClick: () => handleViewDetail(row) }, () => '详情'),
          h(ElButton, { size: 'small', link: true, type: 'success', onClick: () => handleAddMember(row) }, () => '加成员'),
          h(ElButton, {
            size: 'small', link: true, type: 'warning',
            onClick: () => handleStart(row),
          }, () => '启动'),
          h(ElButton, { size: 'small', link: true, type: 'danger', onClick: () => handleCancel(row) }, () => '取消'),
        ]),
    },
  },
];

const gridOptions: VxeTableGridOptions<TeamRun> = {
  columns: gridColumns,
  height: 'auto',
  proxyConfig: {
    ajax: {
      query: async () => {
        const items = await listActiveTeamRuns();
        teamRuns.value = items ?? [];
        return { items: items ?? [], total: items?.length ?? 0 };
      },
    },
  },
  toolbarConfig: { custom: true, refresh: { code: 'query' }, search: true, zoom: true },
  formConfig: { enabled: true, items: [
    { field: 'title', title: '名称', itemRender: { name: 'Input', props: { placeholder: 'TeamRun名称' } } },
    { field: 'teamRunId', title: 'TeamRun ID', itemRender: { name: 'Input', props: { placeholder: 'TeamRun ID' } } },
  ] },
};

const [Grid, gridApi] = useYDSZVxeGrid({ gridOptions });

/** 刷新列表 */
function refreshList(): void {
  gridApi.query();
}

/** 打开创建弹窗 */
function handleCreate(): void {
  createForm.value = { title: '', description: '', pattern: 'SEQUENTIAL' };
  createModalVisible.value = true;
}

/** 提交创建 TeamRun */
async function submitCreate(): Promise<void> {
  try {
    await createTeamRun({
      title: createForm.value.title,
      description: createForm.value.description,
      pattern: createForm.value.pattern,
    });
    createModalVisible.value = false;
    refreshList();
  } catch (error) {
    logger.warn('创建 TeamRun 失败: {}', error);
  }
}

/** 查看 TeamRun 详情 */
async function handleViewDetail(row: TeamRun): Promise<void> {
  try {
    selectedTeamRun.value = await getTeamRun({ teamRunId: row.teamRunId ?? '' });
    teamRunDetailVisible.value = true;
  } catch (error) {
    logger.warn('获取 TeamRun 详情失败: {}', error);
  }
}

/** 打开添加成员弹窗 */
function handleAddMember(row: TeamRun): void {
  currentTeamRunId.value = row.teamRunId ?? '';
  memberForm.value = { agentCode: '', role: '', inputContext: '', executionOrder: (row.members?.length ?? 0) + 1 };
  addMemberModalVisible.value = true;
}

/** 提交添加成员 */
async function submitAddMember(): Promise<void> {
  try {
    await addMember(
      { teamRunId: currentTeamRunId.value },
      {
        agentCode: memberForm.value.agentCode,
        role: memberForm.value.role,
        inputContext: memberForm.value.inputContext,
        executionOrder: memberForm.value.executionOrder,
      },
    );
    addMemberModalVisible.value = false;
    refreshList();
  } catch (error) {
    logger.warn('添加成员失败: {}', error);
  }
}

/** 启动 TeamRun */
async function handleStart(row: TeamRun): Promise<void> {
  try {
    await ElMessageBox.confirm(
      `确定启动 TeamRun「${row.title ?? row.teamRunId ?? ''}」吗?`,
      '启动确认',
      { type: 'warning' },
    );
  } catch {
    return;
  }
  try {
    await startTeamRun({ teamRunId: row.teamRunId ?? '' });
    refreshList();
  } catch (error) {
    logger.warn('启动 TeamRun 失败: {}', error);
  }
}

/** 取消 TeamRun */
async function handleCancel(row: TeamRun): Promise<void> {
  try {
    await ElMessageBox.confirm(
      `确定取消 TeamRun「${row.title ?? row.teamRunId ?? ''}」吗?`,
      '取消确认',
      { type: 'warning' },
    );
  } catch {
    return;
  }
  try {
    await cancelTeamRun({ teamRunId: row.teamRunId ?? '' });
    refreshList();
  } catch (error) {
    logger.warn('取消 TeamRun 失败: {}', error);
  }
}
</script>

<template>
  <Page auto-content-height>
    <div class="space-y-4 p-4">
      <!-- 列表 -->
      <ElCard>
        <Grid table-title="TeamRun 多Agent协作列表">
          <template #toolbar-tools>
            <ElButton type="primary" @click="handleCreate">创建 TeamRun</ElButton>
          </template>
        </Grid>
        <ElEmpty v-if="teamRuns.length === 0" description="暂无 TeamRun 任务" />
      </ElCard>
    </div>

    <!-- 创建 TeamRun 弹窗 -->
    <ElDialog v-model="createModalVisible" title="创建 TeamRun" width="500px">
      <ElForm :model="createForm" label-width="100px">
        <ElFormItem label="名称" required>
          <ElInput v-model="createForm.title" placeholder="请输入 TeamRun 名称" />
        </ElFormItem>
        <ElFormItem label="描述">
          <ElInput v-model="createForm.description" type="textarea" :rows="3" placeholder="请输入描述信息" />
        </ElFormItem>
        <ElFormItem label="协作模式">
          <ElSelect v-model="createForm.pattern" class="w-full">
            <ElOption label="顺序执行" value="SEQUENTIAL" />
            <ElOption label="并行执行" value="PARALLEL" />
            <ElOption label="层级执行" value="HIERARCHICAL" />
            <ElOption label="协商模式" value="NEGOTIATION" />
          </ElSelect>
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="createModalVisible = false">取消</ElButton>
        <ElButton type="primary" @click="submitCreate">确认创建</ElButton>
      </template>
    </ElDialog>

    <!-- 添加成员弹窗 -->
    <ElDialog v-model="addMemberModalVisible" title="添加成员" width="500px">
      <ElForm :model="memberForm" label-width="100px">
        <ElFormItem label="Agent 编码" required>
          <ElInput v-model="memberForm.agentCode" placeholder="请输入 Agent 编码" />
        </ElFormItem>
        <ElFormItem label="角色">
          <ElInput v-model="memberForm.role" placeholder="请输入角色名称" />
        </ElFormItem>
        <ElFormItem label="执行顺序">
          <ElInput v-model.number="memberForm.executionOrder" type="number" placeholder="执行顺序" />
        </ElFormItem>
        <ElFormItem label="输入上下文">
          <ElInput v-model="memberForm.inputContext" type="textarea" :rows="3" placeholder="请输入输入上下文" />
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="addMemberModalVisible = false">取消</ElButton>
        <ElButton type="primary" @click="submitAddMember">确认添加</ElButton>
      </template>
    </ElDialog>

    <!-- TeamRun 详情弹窗 -->
    <ElDialog
      v-model="teamRunDetailVisible"
      title="TeamRun 详情"
      width="800px"
      @close="selectedTeamRun = null"
    >
      <div v-if="selectedTeamRun">
        <!-- 基本信息 -->
        <ElCard class="mb-4">
          <template #header>
            <span class="font-medium">基本信息</span>
          </template>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <span class="text-sm text-gray-500">TeamRun ID:</span>
              <span class="text-sm font-medium">{{ selectedTeamRun.teamRunId }}</span>
            </div>
            <div>
              <span class="text-sm text-gray-500">名称:</span>
              <span class="text-sm font-medium">{{ selectedTeamRun.title }}</span>
            </div>
            <div>
              <span class="text-sm text-gray-500">描述:</span>
              <span class="text-sm font-medium">{{ selectedTeamRun.description ?? '-' }}</span>
            </div>
            <div>
              <span class="text-sm text-gray-500">协作模式:</span>
              <span class="text-sm font-medium">{{ selectedTeamRun.pattern ?? '-' }}</span>
            </div>
            <div>
              <span class="text-sm text-gray-500">状态:</span>
              <ElTag :type="getStatusTagType(selectedTeamRun.status ?? '')">
                {{ selectedTeamRun.status }}
              </ElTag>
            </div>
            <div>
              <span class="text-sm text-gray-500">发起人:</span>
              <span class="text-sm font-medium">{{ selectedTeamRun.initiatedBy ?? '-' }}</span>
            </div>
            <div>
              <span class="text-sm text-gray-500">创建时间:</span>
              <span class="text-sm font-medium">{{ selectedTeamRun.createdAt }}</span>
            </div>
            <div>
              <span class="text-sm text-gray-500">启动时间:</span>
              <span class="text-sm font-medium">{{ selectedTeamRun.startedAt ?? '-' }}</span>
            </div>
            <div>
              <span class="text-sm text-gray-500">完成时间:</span>
              <span class="text-sm font-medium">{{ selectedTeamRun.completedAt ?? '-' }}</span>
            </div>
            <div>
              <span class="text-sm text-gray-500">最终结果:</span>
              <span class="text-sm font-medium">{{ selectedTeamRun.finalResult ?? '-' }}</span>
            </div>
          </div>
        </ElCard>

        <!-- 成员列表 -->
        <ElCard>
          <template #header>
            <span class="font-medium">成员列表({{ selectedTeamRun.members?.length ?? 0 }})</span>
          </template>
          <div v-if="selectedTeamRun.members && selectedTeamRun.members.length > 0">
            <div
              v-for="member in selectedTeamRun.members"
              :key="member.memberId"
              class="mb-2 rounded border p-3"
            >
              <div class="grid grid-cols-3 gap-2">
                <div>
                  <span class="text-sm text-gray-500">Agent:</span>
                  <span class="text-sm font-medium">{{ member.agentCode }} ({{ member.agentName }})</span>
                </div>
                <div>
                  <span class="text-sm text-gray-500">角色:</span>
                  <span class="text-sm font-medium">{{ member.role ?? '-' }}</span>
                </div>
                <div>
                  <span class="text-sm text-gray-500">顺序:</span>
                  <span class="text-sm font-medium">{{ member.executionOrder }}</span>
                </div>
                <div>
                  <span class="text-sm text-gray-500">状态:</span>
                  <ElTag :type="getStatusTagType(member.status ?? '')" size="small">
                    {{ member.status }}
                  </ElTag>
                </div>
                <div>
                  <span class="text-sm text-gray-500">开始:</span>
                  <span class="text-sm font-medium">{{ member.startedAt ?? '-' }}</span>
                </div>
                <div>
                  <span class="text-sm text-gray-500">完成:</span>
                  <span class="text-sm font-medium">{{ member.completedAt ?? '-' }}</span>
                </div>
                <div v-if="member.errorMessage" class="col-span-3">
                  <span class="text-sm text-red-500">错误: {{ member.errorMessage }}</span>
                </div>
              </div>
            </div>
          </div>
          <ElEmpty v-else description="暂无成员" />
        </ElCard>
      </div>
      <template #footer>
        <ElButton @click="teamRunDetailVisible = false">关闭</ElButton>
      </template>
    </ElDialog>
  </Page>
</template>
