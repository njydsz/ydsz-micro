<!--
 * 审批详情弹窗 —— 展示变更前后值、审批时间线，
 * 并在当前用户为待审批人时显示通过/拒绝表单。
 *
 * <p>暴露方法：
 * <pre>
 * dialogRef.value.open(record)            // 查看详情
 * dialogRef.value.open(record, 'reject')   // 直接进入拒绝模式
 * </pre>
 *
 * @path apps\system-web\src\views\config-approval\approval-detail-dialog.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
/**
 * 审批详情弹窗
 *
 * @author ydsz-team
 * @since 1.0.0
 */
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';

import {
  ElButton,
  ElDescriptions,
  ElDescriptionsItem,
  ElDialog,
  ElDivider,
  ElForm,
  ElFormItem,
  ElInput,
  ElMessage,
  ElTimeline,
  ElTimelineItem,
} from 'element-plus';

import { createLogger } from '@ydsz-core/shared/utils';

import type {
  ConfigApprovalChangeType,
  ConfigApprovalRecord,
  ConfigApprovalResourceType,
  ConfigApprovalStatus,
} from '#/api/types/config-approval';

const logger = createLogger('approval-detail-dialog');

const { t } = useI18n();

const emit = defineEmits<{
  (e: 'approved'): void;
  (e: 'rejected'): void;
  (e: 'withdrawn'): void;
}>();

/** 弹窗可见性 */
const visible = ref(false);

/** 当前审批单数据 */
const record = ref<ConfigApprovalRecord | null>(null);

/** 加载状态 */
const submitting = ref(false);

/** 拒绝原因表单 */
const rejectionReason = ref('');

/** 审批时间线 Mock（来自详情接口 auditLogs） */
const timeline = ref<
  Array<{
    action: string;
    actionTime: string;
    comment: string;
    status: string;
    approverName: string;
  }>
>([]);

/** 弹窗标题 */
const dialogTitle = computed(() =>
  record.value ? `${t('configApproval.detail')} - ${record.value.title}` : t('configApproval.detail'),
);

/** Tag 类型映射 */
function statusTagType(status: ConfigApprovalStatus): 'success' | 'warning' | 'danger' | 'info' {
  switch (status) {
    case 'APPROVED':
      return 'success';
    case 'PENDING':
      return 'warning';
    case 'REJECTED':
      return 'danger';
    case 'WITHDRAWN':
      return 'info';
  }
}

function statusLabel(status: ConfigApprovalStatus): string {
  switch (status) {
    case 'PENDING':
      return t('configApproval.statusPending');
    case 'APPROVED':
      return t('configApproval.statusApproved');
    case 'REJECTED':
      return t('configApproval.statusRejected');
    case 'WITHDRAWN':
      return t('configApproval.statusWithdrawn');
  }
}

function resourceTypeLabel(type: ConfigApprovalResourceType): string {
  switch (type) {
    case 'CONFIG':
      return t('configApproval.resourceConfig');
    case 'DICT':
      return t('configApproval.resourceDict');
    case 'VARIABLE':
      return t('configApproval.resourceVariable');
  }
}

function changeTypeLabel(type: ConfigApprovalChangeType): string {
  switch (type) {
    case 'CREATE':
      return t('configApproval.changeCreate');
    case 'UPDATE':
      return t('configApproval.changeUpdate');
    case 'DELETE':
      return t('configApproval.changeDelete');
  }
}

/** 是否为「当前用户为审批人 且 状态为 PENDING」→ 显示操作按钮 */
const canOperate = computed(
  () => record.value?.status === 'PENDING' && record.value.currentApproverName === '当前用户',
);
const canWithdraw = computed(
  () => record.value?.status === 'PENDING' && record.value.submitterName === '张三',
);

// =====================================================================
// 公开方法
// =====================================================================

/** 打开审批详情弹窗 */
function open(data: ConfigApprovalRecord, _mode: 'view' | 'reject' = 'view') {
  record.value = data;
  rejectionReason.value = '';
  submitting.value = false;
  visible.value = true;

  // 构造 Mock 时间线 —— TODO: 后端对接后替换为 getApprovalDetailApi(data.id).auditLogs
  buildMockTimeline(data);
}

/** 关闭弹窗 */
function close() {
  visible.value = false;
  record.value = null;
  rejectionReason.value = '';
}

/** 构造 Mock 时间线数据 */
function buildMockTimeline(data: ConfigApprovalRecord) {
  timeline.value = [
    {
      action: t('configApproval.changeCreate'),
      actionTime: data.submittedAt,
      comment: data.reason || '',
      status: 'done',
      approverName: data.submitterName,
    },
    {
      action:
        data.status === 'PENDING'
          ? t('configApproval.nodePending')
          : t('configApproval.nodeApproved'),
      actionTime: data.submittedAt,
      comment: '',
      status: 'process',
      approverName: data.currentApproverName ?? '',
    },
  ];
}

// =====================================================================
// 操作处理
// =====================================================================

async function handleApprove() {
  if (!record.value) return;
  submitting.value = true;
  try {
    // TODO: 对接真实 API —— await approveApprovalApi(record.value.id)
    logger.info('[Mock] 通过审批单:', record.value.id);
    await new Promise((resolve) => setTimeout(resolve, 300));
    ElMessage.success(t('configApproval.approveSuccess'));
    emit('approved');
    close();
  } finally {
    submitting.value = false;
  }
}

async function handleReject() {
  if (!record.value) return;
  if (!rejectionReason.value.trim()) {
    ElMessage.error(t('configApproval.reasonRequired'));
    return;
  }
  submitting.value = true;
  try {
    // TODO: 对接真实 API —— await rejectApprovalApi(record.value.id, rejectionReason.value)
    logger.info('[Mock] 拒绝审批单:', record.value.id, rejectionReason.value);
    await new Promise((resolve) => setTimeout(resolve, 300));
    ElMessage.success(t('configApproval.rejectSuccess'));
    emit('rejected');
    close();
  } finally {
    submitting.value = false;
  }
}

async function handleWithdraw() {
  if (!record.value) return;
  submitting.value = true;
  try {
    // TODO: 对接真实 API —— await withdrawApprovalApi(record.value.id)
    logger.info('[Mock] 撤回审批单:', record.value.id);
    await new Promise((resolve) => setTimeout(resolve, 300));
    ElMessage.success(t('configApproval.withdrawSuccess'));
    emit('withdrawn');
    close();
  } finally {
    submitting.value = false;
  }
}

defineExpose({ close, open });
</script>

<template>
  <ElDialog v-model="visible" :title="dialogTitle" width="700px" @close="close">
    <div v-if="record" class="approval-detail">
      <!-- 基本信息 -->
      <ElDescriptions :column="2" border>
        <ElDescriptionsItem :label="t('configApproval.colResourceType')">
          {{ resourceTypeLabel(record.resourceType) }}
        </ElDescriptionsItem>
        <ElDescriptionsItem :label="t('configApproval.colChangeType')">
          {{ changeTypeLabel(record.changeType) }}
        </ElDescriptionsItem>
        <ElDescriptionsItem :label="t('configApproval.colSubmitter')">
          {{ record.submitterName }}
        </ElDescriptionsItem>
        <ElDescriptionsItem :label="t('configApproval.colSubmittedAt')">
          {{ record.submittedAt }}
        </ElDescriptionsItem>
        <ElDescriptionsItem :label="t('configApproval.colStatus')">
          <ElTag :type="statusTagType(record.status)">{{ statusLabel(record.status) }}</ElTag>
        </ElDescriptionsItem>
        <ElDescriptionsItem
          v-if="record.currentApproverName"
          :label="t('configApproval.colCurrentApprover')"
        >
          {{ record.currentApproverName }}
        </ElDescriptionsItem>
        <ElDescriptionsItem :label="t('common.reasonLabel')" :span="2">
          {{ record.reason || '-' }}
        </ElDescriptionsItem>
        <ElDescriptionsItem
          v-if="record.rejectionReason"
          :label="t('common.rejectionReasonLabel')"
          :span="2"
        >
          {{ record.rejectionReason }}
        </ElDescriptionsItem>
      </ElDescriptions>

      <ElDivider />

      <!-- 变更前后值 Diff -->
      <div class="diff-section">
        <h4>{{ t('configApproval.viewDiff') }}</h4>
        <div class="diff-container">
          <div class="diff-panel">
            <div class="diff-panel-title">{{ t('configApproval.beforeValue') }}</div>
            <pre class="diff-content before">{{ record.beforeJson || '-' }}</pre>
          </div>
          <div class="diff-panel">
            <div class="diff-panel-title">{{ t('configApproval.afterValue') }}</div>
            <pre class="diff-content after">{{ record.afterJson || '-' }}</pre>
          </div>
        </div>
      </div>

      <ElDivider />

      <!-- 审批时间线 -->
      <div>
        <h4>{{ t('configApproval.approvalTimeline') }}</h4>
        <ElTimeline>
          <ElTimelineItem
            v-for="(item, idx) in timeline"
            :key="item.actionTime ?? idx"
            :timestamp="item.actionTime"
            :type="item.status === 'done' ? 'primary' : 'warning'"
            placement="top"
          >
            <div><strong>{{ item.action }}</strong> — {{ item.approverName }}</div>
            <div v-if="item.comment" class="timeline-comment">{{ item.comment }}</div>
          </ElTimelineItem>
        </ElTimeline>
      </div>

      <ElDivider v-if="canOperate" />

      <!-- 拒绝原因表单（pending + 当前审批人） -->
      <div v-if="canOperate" class="reject-form">
        <h4>{{ t('configApproval.rejectTitle') }}</h4>
        <ElForm @submit.prevent="handleReject">
          <ElFormItem :label="t('common.rejectionReasonLabel')">
            <ElInput
              v-model="rejectionReason"
              type="textarea"
              :rows="3"
              :placeholder="t('common.placeholder', [t('common.rejectionReasonLabel')])"
            />
          </ElFormItem>
        </ElForm>
      </div>
    </div>

    <template #footer>
      <ElButton @click="close">{{ t('common.close') }}</ElButton>
      <template v-if="canOperate">
        <ElButton type="primary" :loading="submitting" @click="handleApprove">
          {{ t('common.approve') }}
        </ElButton>
        <ElButton type="danger" :loading="submitting" @click="handleReject">
          {{ t('common.reject') }}
        </ElButton>
      </template>
      <ElButton
        v-if="canWithdraw"
        type="warning"
        :loading="submitting"
        @click="handleWithdraw"
      >
        {{ t('common.withdraw') }}
      </ElButton>
    </template>
  </ElDialog>
</template>

<style scoped>
.approval-detail {
  max-height: 60vh;
  overflow-y: auto;
}

.diff-section {
  margin: 16px 0;
}

.diff-section h4 {
  margin: 0 0 12px;
  font-size: 14px;
}

.diff-container {
  display: flex;
  gap: 12px;
}

.diff-panel {
  flex: 1;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  overflow: hidden;
}

.diff-panel-title {
  padding: 8px 12px;
  background: #f5f7fa;
  border-bottom: 1px solid #dcdfe6;
  font-size: 12px;
  font-weight: 600;
  color: #606266;
}

.diff-content {
  margin: 0;
  padding: 12px;
  font-size: 12px;
  font-family: 'Courier New', monospace;
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 240px;
  overflow-y: auto;
}

.diff-content.before {
  background: #fef0f0;
}

.diff-content.after {
  background: #f0f9eb;
}

.timeline-comment {
  color: #909399;
  font-size: 12px;
}

.reject-form h4 {
  margin: 0 0 12px;
  font-size: 14px;
}
</style>
