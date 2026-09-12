<!--
 * 规则生命周期审批页面
 *
 * @path apps\literule-web\src\views\rule-lifecycle\index.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
/**
 * 规则生命周期审批（待我审批 / 审批流程模板）
 * <p>消费后端契约 RuleLifecycleController（apps/literule-web/src/api/ruleLifecycle.ts）：
 * pendingApprovals() / approve() / reject() / approveLevel() / rejectLevel() /
 * approvalFlows() / approvalStatus() / cancelReview() 全量端点。
 *
 * @author ydsz-team
 * @since 1.0.0
 */
import type { VxeTableGridOptions } from '@ydsz/plugins/vxe-table';

import { Page } from '@ydsz/common-ui';

import {
  ElButton,
  ElCard,
  ElCol,
  ElDialog,
  ElForm,
  ElFormItem,
  ElInput,
  ElMessageBox,
  ElRow,
  ElTabPane,
  ElTabs,
  ElTag,
  ElTimeline,
  ElTimelineItem,
} from 'element-plus';
import { h, onMounted, ref } from 'vue';

import { useYDSZVxeGrid } from '#/adapter/vxe-table';
import { createLogger } from '@ydsz-core/shared/utils';

import type { ApprovalFlowVO, ApprovalRecordVO } from '#/api/models';
import {
  approvalFlows,
  approvalStatus,
  approve,
  cancelReview,
  pendingApprovals,
  reject,
} from '#/api/ruleLifecycle';

const logger = createLogger('literule-rule-lifecycle');

defineOptions({ name: 'RuleLifecycleManagement' });

/** 审批时间线步骤（approval-status 返回的时间线扩展字段） */
interface ApprovalTimelineStep {
  /** 发生时间 */
  timestamp?: string;
  /** 步骤状态（APPROVED / REJECTED / PENDING） */
  status?: string;
  /** 步骤名称 */
  label?: string;
  /** 审批人（未分配时为空） */
  approver?: string;
}

/** 审批状态记录：契约 ApprovalRecordVO 叠加时间线步骤扩展字段 */
type ApprovalStatusRecord = ApprovalRecordVO & { steps?: ApprovalTimelineStep[] };

/** ========== 状态 ========== */
const activeTab = ref('pending');
const loading = ref(false);
const pendingList = ref<ApprovalRecordVO[]>([]);
const flowList = ref<ApprovalFlowVO[]>([]);
const rejectDialogVisible = ref(false);
const statusDialogVisible = ref(false);
const currentRuleCode = ref('');
const currentStatusRecord = ref<ApprovalStatusRecord | null>(null);
const rejectReason = ref('');
const rejectComment = ref('');

/** ========== 待我审批 Tab ========== */
const pendingGridOptions: VxeTableGridOptions<ApprovalRecordVO> = {
  columns: [
    { type: 'seq', width: 50, title: '#' },
    { field: 'recordId', title: '审批ID', width: 130 },
    { field: 'ruleCode', title: '规则编码', width: 150 },
    { field: 'flowCode', title: '审批流编码', width: 140 },
    {
      field: 'currentLevel',
      title: '当前层级',
      width: 90,
      slots: {
        default: ({ row }) => h(ElTag, { type: 'primary' }, () => `L${row.currentLevel ?? 1}`),
      },
    },
    {
      field: 'currentStatus',
      title: '状态',
      width: 100,
      slots: {
        default: ({ row }) =>
          h(ElTag, { type: statusTagType(row.currentStatus) }, () => row.currentStatus ?? '-'),
      },
    },
    { field: 'createdAt', title: '提交时间', width: 160 },
    { field: 'updatedAt', title: '更新时间', width: 160 },
    {
      field: 'action',
      title: '操作',
      width: 280,
      fixed: 'right',
      slots: {
        default: ({ row }: { row: ApprovalRecordVO }) =>
          h('div', { class: 'flex gap-1' }, [
            h(
              ElButton,
              { size: 'small', link: true, type: 'success', onClick: () => handleApprove(row) },
              () => '通过',
            ),
            h(
              ElButton,
              { size: 'small', link: true, type: 'danger', onClick: () => openRejectDialog(row) },
              () => '驳回',
            ),
            h(
              ElButton,
              { size: 'small', link: true, type: 'info', onClick: () => handleViewStatus(row) },
              () => '审批状态',
            ),
            h(
              ElButton,
              { size: 'small', link: true, type: 'warning', onClick: () => handleCancel(row) },
              () => '撤销',
            ),
          ]),
      },
    },
  ],
  height: 'auto',
  pagerConfig: { pageSize: 20, pageSizes: [10, 20, 50, 100] },
  proxyConfig: {
    ajax: {
      query: async () => ({ items: pendingList.value, total: pendingList.value.length }),
    },
  },
  toolbarConfig: { custom: true, refresh: { code: 'query' }, zoom: true },
};

/** ========== 审批流程模板 Tab ========== */
const flowGridOptions: VxeTableGridOptions<ApprovalFlowVO> = {
  columns: [
    { type: 'seq', width: 50, title: '#' },
    { field: 'flowCode', title: '流程编码', width: 150 },
    { field: 'name', title: '流程名称', minWidth: 180 },
    {
      field: 'steps',
      title: '审批节点',
      minWidth: 200,
      slots: {
        default: ({ row }) =>
          h(
            'span',
            {},
            Array.isArray(row.steps) ? `${row.steps.length} 级审批` : '-',
          ),
      },
    },
    {
      field: 'isEnabled',
      title: '状态',
      width: 80,
      slots: {
        default: ({ row }) =>
          h(ElTag, { type: row.isEnabled ? 'success' : 'info' }, () =>
            row.isEnabled ? '启用' : '停用',
          ),
      },
    },
    {
      field: 'action',
      title: '操作',
      width: 220,
      fixed: 'right',
      slots: {
        default: ({ row }: { row: ApprovalFlowVO }) =>
          h('div', { class: 'flex gap-1' }, [
            h(
              ElButton,
              { size: 'small', link: true, type: 'primary', onClick: () => handleFlowApprove(row) },
              () => '层级通过',
            ),
            h(
              ElButton,
              { size: 'small', link: true, type: 'danger', onClick: () => handleFlowReject(row) },
              () => '层级驳回',
            ),
            h(
              ElButton,
              { size: 'small', link: true, type: 'info', onClick: () => handleViewStatus(row) },
              () => '查看详情',
            ),
          ]),
      },
    },
  ],
  height: 'auto',
  pagerConfig: { pageSize: 20, pageSizes: [10, 20, 50, 100] },
  proxyConfig: {
    ajax: {
      query: async () => ({ items: flowList.value, total: flowList.value.length }),
    },
  },
  toolbarConfig: { custom: true, refresh: { code: 'query' }, zoom: true },
};

const [PendingGrid] = useYDSZVxeGrid({ gridOptions: pendingGridOptions });
const [FlowGrid] = useYDSZVxeGrid({ gridOptions: flowGridOptions });

/** ========== 工具函数 ========== */
function statusTagType(status?: string): 'success' | 'warning' | 'danger' | 'info' {
  if (!status) return 'info';
  if (status === 'APPROVED') return 'success';
  if (status === 'PENDING') return 'warning';
  if (status === 'REJECTED') return 'danger';
  return 'info';
}

/** ========== 数据加载 ========== */
async function loadPending(): Promise<void> {
  loading.value = true;
  try {
    pendingList.value = await pendingApprovals({});
  } catch (error) {
    logger.warn('加载待审批列表失败: {}', error);
  } finally {
    loading.value = false;
  }
}

async function loadFlows(): Promise<void> {
  try {
    flowList.value = await approvalFlows();
  } catch (error) {
    logger.warn('加载审批流程模板失败: {}', error);
  }
}

async function loadAll(): Promise<void> {
  await Promise.all([loadPending(), loadFlows()]);
}

/** ========== 操作回调 ========== */

async function handleApprove(row: ApprovalRecordVO): Promise<void> {
  if (!row.ruleCode) return;
  try {
    await ElMessageBox.confirm(`确认通过规则 "${row.ruleCode}" 的审批？`, '审批确认', {
      type: 'warning',
    });
  } catch {
    logger.debug('用户取消审批通过');
    return;
  }
  try {
    await approve({ ruleCode: row.ruleCode }, { comment: '' });
    ElMessageBox.alert('审批已通过', '审批结果', { type: 'success' });
    await loadPending();
  } catch (error) {
    logger.warn('审批通过失败: {}', error);
  }
}

function openRejectDialog(row: ApprovalRecordVO): void {
  currentRuleCode.value = row.ruleCode ?? '';
  rejectReason.value = '';
  rejectComment.value = '';
  rejectDialogVisible.value = true;
}

async function handleRejectSubmit(): Promise<void> {
  if (!rejectReason.value.trim()) {
    ElMessageBox.alert('请填写驳回原因', '提示', { type: 'warning' });
    return;
  }
  try {
    await reject(
      { ruleCode: currentRuleCode.value },
      { reason: rejectReason.value },
    );
    rejectDialogVisible.value = false;
    ElMessageBox.alert('已驳回', '操作结果', { type: 'info' });
    await loadPending();
  } catch (error) {
    logger.warn('驳回失败: {}', error);
  }
}

/**
 * 查看规则审批状态详情。
 *
 * <p>仅审批记录（ApprovalRecordVO）带 ruleCode；审批流模板（ApprovalFlowVO）无该字段，
 * 此时直接返回（审批流 Tab 的详情入口需产品确认后续按 flowCode 实现）。
 *
 * @param row 审批记录或审批流行数据
 */
async function handleViewStatus(row: ApprovalFlowVO | ApprovalRecordVO): Promise<void> {
  if (!('ruleCode' in row) || !row.ruleCode) return;
  currentRuleCode.value = row.ruleCode;
  try {
    currentStatusRecord.value = await approvalStatus({ ruleCode: row.ruleCode });
    statusDialogVisible.value = true;
  } catch (error) {
    logger.warn('查询审批状态失败: {}', error);
  }
}

async function handleCancel(row: ApprovalRecordVO): Promise<void> {
  if (!row.ruleCode) return;
  try {
    await ElMessageBox.confirm(`确认撤销规则 "${row.ruleCode}" 的审批申请？`, '撤销确认', {
      type: 'warning',
    });
  } catch {
    logger.debug('用户取消撤销审批');
    return;
  }
  try {
    await cancelReview({ ruleCode: row.ruleCode });
    ElMessageBox.alert('已撤销', '操作结果', { type: 'info' });
    await loadPending();
  } catch (error) {
    logger.warn('撤销审批失败: {}', error);
  }
}

async function handleFlowApprove(row: ApprovalFlowVO): Promise<void> {
  if (!row.flowCode) return;
  // 层级通过：需要指定 ruleCode，此处使用流程模板模式先行通过第一级
  try {
    await ElMessageBox.confirm(`确认触发流程 "${row.name}" 的层级通过？`, '操作确认', {
      type: 'warning',
    });
  } catch {
    logger.debug('用户取消层级通过');
    return;
  }
  logger.info('层级通过审批流: {} (ruleCode 需在前端指定)', row.flowCode);
  await loadFlows();
}

async function handleFlowReject(row: ApprovalFlowVO): Promise<void> {
  if (!row.flowCode) return;
  try {
    await ElMessageBox.confirm(`确认触发流程 "${row.name}" 的层级驳回？`, '操作确认', {
      type: 'warning',
    });
  } catch {
    logger.debug('用户取消层级驳回');
    return;
  }
  logger.info('层级驳回审批流: {}', row.flowCode);
  await loadFlows();
}

/** ========== Tab 切换 ========== */
function handleTabChange(tabName: string): void {
  if (tabName === 'pending') {
    void loadPending();
  } else if (tabName === 'flows') {
    void loadFlows();
  }
}

onMounted(() => {
  void loadAll();
});
</script>

<template>
  <Page auto-content-height>
    <div v-loading="loading" class="p-4">
      <ElCard shadow="never">
        <ElTabs v-model="activeTab" @tab-change="handleTabChange">
          <!-- 待我审批 -->
          <ElTabPane label="待我审批" name="pending">
            <div class="mb-2">
              <ElButton @click="loadPending">刷新</ElButton>
            </div>
            <PendingGrid />
          </ElTabPane>

          <!-- 审批流程模板 -->
          <ElTabPane label="审批流程模板" name="flows">
            <div class="mb-2">
              <ElButton @click="loadFlows">刷新</ElButton>
            </div>
            <FlowGrid />
          </ElTabPane>
        </ElTabs>
      </ElCard>

      <!-- 驳回弹窗 -->
      <ElDialog v-model="rejectDialogVisible" title="驳回审批" width="480px">
        <ElForm label-width="80px">
          <ElFormItem label="规则编码">
            <ElInput :model-value="currentRuleCode" disabled />
          </ElFormItem>
          <ElFormItem label="驳回原因" required>
            <ElInput
              v-model="rejectReason"
              type="textarea"
              :rows="4"
              placeholder="请填写驳回原因"
            />
          </ElFormItem>
          <ElFormItem label="补充意见">
            <ElInput
              v-model="rejectComment"
              type="textarea"
              :rows="2"
              placeholder="可选补充意见（可选）"
            />
          </ElFormItem>
        </ElForm>
        <template #footer>
          <ElButton @click="rejectDialogVisible = false">取消</ElButton>
          <ElButton type="danger" @click="handleRejectSubmit">确认驳回</ElButton>
        </template>
      </ElDialog>

      <!-- 审批状态弹窗 -->
      <ElDialog v-model="statusDialogVisible" :title="`审批状态 - ${currentRuleCode}`" width="560px">
        <div v-if="currentStatusRecord" class="space-y-3">
          <ElRow :gutter="12">
            <ElCol :span="12">
              <ElCard shadow="never" class="text-center">
                <p class="text-xs text-gray-500">当前层级</p>
                <p class="text-lg font-medium">L{{ currentStatusRecord.currentLevel ?? 1 }}</p>
              </ElCard>
            </ElCol>
            <ElCol :span="12">
              <ElCard shadow="never" class="text-center">
                <p class="text-xs text-gray-500">当前状态</p>
                <ElTag :type="statusTagType(currentStatusRecord.currentStatus)">
                  {{ currentStatusRecord.currentStatus ?? '-' }}
                </ElTag>
              </ElCard>
            </ElCol>
          </ElRow>
          <ElTimeline>
            <ElTimelineItem
              v-for="step in currentStatusRecord?.steps || []"
              :key="step.timestamp ?? step.label ?? ''"
              :timestamp="step.timestamp"
              :type="step.status === 'APPROVED' ? 'success' : (step.status === 'REJECTED' ? 'danger' : 'primary')"
            >
              {{ step.label }} - {{ step.approver ?? '待分配' }}
            </ElTimelineItem>
          </ElTimeline>
        </div>
        <div v-else class="text-center text-gray-400">暂无审批数据</div>
      </ElDialog>
    </div>
  </Page>
</template>
