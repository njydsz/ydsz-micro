<!--
 * 嵌入式审批组件
 *
 * <p>可嵌入业务系统页面的审批组件，提供流程进度展示、快捷审批操作、审批历史查看。
 *
 * <p><b>核心功能：</b>
 * <ul>
 *   <li>流程进度展示（当前节点、审批人）
 *   <li>快捷审批操作（同意/驳回/转办/委托）
 *   <li>审批历史时间线
 *   <li>流程图预览
 * </ul>
 *
 * @path apps\workflow-web\src\components\EmbeddedApproval\index.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
/**
 * 嵌入式审批组件
 * <p>通过 businessType + businessId 加载审批面板数据。
 *
 * @author ydsz-team
 * @since 1.0.0
*/
import { ElButton, ElCard, ElEmpty, ElForm, ElFormItem, ElInput, ElMessage, ElSpace, ElTag, ElTimeline, ElTimelineItem } from 'element-plus';
import { computed, onMounted, reactive, ref } from 'vue';
import { loadPanel, quickAction } from '#/api/flowEmbeddedApproval';
import type { EmbeddedApprovalActionDTO, EmbeddedApprovalViewDTO } from '#/api/models';
import { $t } from '#/locales';

interface Props {
  /** 业务类型 */
  businessType: string;
  /** 业务 ID */
  businessId: string;
  /** 用户 ID（可选，默认取当前用户） */
  userId?: string;
}

const props = withDefaults(defineProps<Props>(), {
  userId: '',
});

const emit = defineEmits<{
  actionSuccess: [action: string];
}>();

const loading = ref(false);
const submitting = ref(false);
const panel = ref<EmbeddedApprovalViewDTO>({});

/** 操作表单 */
const form = reactive({
  action: 'pass',
  comment: '',
  targetUserId: '',
});

/** 可用操作列表 */
const availableActions = computed(() => panel.value.actions || []);

/** 当前任务列表 */
const currentTasks = computed(() => panel.value.currentTasks || []);

/** 审批历史 */
const history = computed(() => panel.value.history || []);

/** 是否可撤回 */
const canRecall = computed(() => panel.value.canRecall || false);

/** 加载面板数据 */
async function loadPanelData() {
  loading.value = true;
  try {
    panel.value = await loadPanel({
      businessType: props.businessType,
      businessId: props.businessId,
      userId: props.userId,
    });
  } catch {
    ElMessage.error('加载审批面板失败');
  } finally {
    loading.value = false;
  }
}

/**
 * 提交快捷操作
 */
async function handleAction() {
  submitting.value = true;
  try {
    const payload: EmbeddedApprovalActionDTO = {
      businessType: props.businessType,
      businessId: props.businessId,
      userId: props.userId,
      action: form.action,
      comment: form.comment,
      targetUserId: form.targetUserId,
    };
    await quickAction(payload);
    ElMessage.success($t('wf.processSuccess'));
    emit('actionSuccess', form.action);
    // 重新加载面板
    await loadPanelData();
  } catch {
    ElMessage.error('操作失败');
  } finally {
    submitting.value = false;
  }
}

/**
 * 撤回操作
 */
async function handleRecall() {
  submitting.value = true;
  try {
    const payload: EmbeddedApprovalActionDTO = {
      businessType: props.businessType,
      businessId: props.businessId,
      userId: props.userId,
      action: 'recall',
    };
    await quickAction(payload);
    ElMessage.success($t('wf.recalledSuccess'));
    emit('actionSuccess', 'recall');
    await loadPanelData();
  } catch {
    ElMessage.error('撤回失败');
  } finally {
    submitting.value = false;
  }
}

onMounted(() => {
  loadPanelData();
});
</script>

<template>
  <ElCard v-loading="loading" class="embedded-approval" shadow="never">
    <template #header>
      <div class="header">
        <span class="title">审批信息</span>
        <ElTag v-if="panel.myRole" size="small" type="primary">{{ panel.myRole }}</ElTag>
      </div>
    </template>

    <ElEmpty v-if="!loading && !availableActions.length" description="暂无待处理任务" />

    <div v-else class="content">
      <!-- 当前任务 -->
      <div v-if="currentTasks.length" class="section">
        <div class="section-title">当前节点</div>
        <div v-for="task in currentTasks" :key="task.id" class="task-item">
          <span class="task-node">{{ task.nodeName }}</span>
          <span class="task-assignee">{{ task.assigneeName }}</span>
        </div>
      </div>

      <!-- 操作面板 -->
      <ElForm v-if="availableActions.length" :model="form" label-width="80px" size="small">
        <ElFormItem label="操作">
          <ElSpace wrap>
            <ElButton
              v-if="availableActions.includes('pass')"
              type="primary"
              size="small"
              @click="form.action = 'pass'"
            >
              {{ $t('wf.approve') }}
            </ElButton>
            <ElButton
              v-if="availableActions.includes('reject')"
              type="danger"
              size="small"
              @click="form.action = 'reject'"
            >
              {{ $t('wf.reject') }}
            </ElButton>
            <ElButton
              v-if="availableActions.includes('transfer')"
              size="small"
              @click="form.action = 'transfer'"
            >
              {{ $t('wf.transfer') }}
            </ElButton>
            <ElButton
              v-if="availableActions.includes('delegate')"
              size="small"
              @click="form.action = 'delegate'"
            >
              {{ $t('wf.delegate') }}
            </ElButton>
          </ElSpace>
        </ElFormItem>
        <ElFormItem label="意见">
          <ElInput
            v-model="form.comment"
            type="textarea"
            :rows="2"
            :placeholder="$t('wf.commentPlaceholder')"
          />
        </ElFormItem>
        <ElFormItem>
          <ElButton type="primary" :loading="submitting" @click="handleAction">
            提交
          </ElButton>
          <ElButton
            v-if="canRecall"
            :loading="submitting"
            @click="handleRecall"
          >
            {{ $t('wf.recall') }}
          </ElButton>
        </ElFormItem>
      </ElForm>

      <!-- 审批历史 -->
      <div v-if="history.length" class="section">
        <div class="section-title">审批历史</div>
        <ElTimeline>
          <ElTimelineItem
            v-for="item in history"
            :key="item.id"
            :timestamp="item.createdAt"
            placement="top"
          >
            <div class="history-item">
              <span class="history-action">{{ item.action }}</span>
              <span class="history-user">{{ item.userName }}</span>
              <span v-if="item.comment" class="history-comment">{{ item.comment }}</span>
            </div>
          </ElTimelineItem>
        </ElTimeline>
      </div>
    </div>
  </ElCard>
</template>

<style scoped>
.embedded-approval {
  max-width: 600px;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.title {
  font-weight: 600;
  font-size: 16px;
}

.content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.section {
  padding: 12px 0;
  border-top: 1px solid var(--el-border-color-lighter);
}

.section-title {
  font-weight: 600;
  font-size: 14px;
  color: #303133;
  margin-bottom: 8px;
}

.task-item {
  display: flex;
  justify-content: space-between;
  padding: 4px 0;
}

.task-node {
  color: #606266;
}

.task-assignee {
  color: #409eff;
}

.history-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.history-action {
  font-weight: 500;
  color: #303133;
}

.history-user {
  font-size: 12px;
  color: #909399;
}

.history-comment {
  font-size: 13px;
  color: #606266;
}
</style>
