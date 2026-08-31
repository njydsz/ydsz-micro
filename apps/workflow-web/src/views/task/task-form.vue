<!--
 * 流程任务（任务处理弹窗组件）
 *
 * @path apps\workflow-web\src\views\task\task-form.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
/**
 * 流程任务（任务处理弹窗组件）
 * <p>「处理任务」弹窗：选择动作（同意/驳回/转办/委托），填写处理意见 comment，
 * 转办/委托时补充目标人 targetUserId，构造 FlowTaskOperateDTO（src/api/flowTask.ts，auto-generated）。
 * 对应提交 pass/reject/transfer/delegate，成功后 emit('success') 并关闭弹窗。
 *
 * @author ydsz-team
 * @since 1.0.0
 */
import { useYDSZModal } from '@ydsz/common-ui';
import {
  ElForm,
  ElFormItem,
  ElInput,
  ElMessage,
  ElOption,
  ElRadio,
  ElRadioGroup,
  ElSelect,
} from 'element-plus';
import { computed, onMounted, reactive, ref } from 'vue';
import {
  countersignAfter,
  countersignBefore,
  countersignParallel,
  delegate,
  pass,
  reject,
  transfer,
} from '#/api/flowTask';
import { listQuickComments, incrementUseCount } from '#/api/flowComment';
import type { FlowRunTaskVO, FlowTaskOperateDTO, FlowQuickCommentVO } from '#/api/models';
import { $t } from '#/locales';
import FlowUserSelector from '#/components/FlowUserSelector.vue';

const emit = defineEmits<{ success: [] }>();
const formRef = ref();

/** 快捷评语列表 */
const quickComments = ref<FlowQuickCommentVO[]>([]);
/** 快捷评语加载状态 */
const quickCommentLoading = ref(false);
/** 当前选中的快捷评语 ID */
const selectedQuickCommentId = ref<string>('');

/** 加载快捷评语列表 */
async function loadQuickComments() {
  quickCommentLoading.value = true;
  try {
    quickComments.value = (await listQuickComments()) ?? [];
  } finally {
    quickCommentLoading.value = false;
  }
}

/** 选择快捷评语 */
function handleQuickCommentSelect(commentId: string) {
  const selected = quickComments.value.find((c) => c.id === commentId);
  if (selected?.content) {
    formData.comment = selected.content;
    // 累计使用次数
    if (selected.id) {
      incrementUseCount({ id: selected.id }).catch(() => {});
    }
  }
}

onMounted(() => {
  loadQuickComments();
});

/** 处理动作 */
type TaskAction =
  | 'pass'
  | 'reject'
  | 'transfer'
  | 'delegate'
  | 'countersignBefore'
  | 'countersignAfter'
  | 'countersignParallel';

/** 任务处理表单状态 */
interface TaskHandleState {
  taskId: string;
  action: TaskAction;
  comment: string;
  targetUserId: string;
}

const formData = reactive<TaskHandleState>({
  taskId: '',
  action: 'pass',
  comment: '',
  targetUserId: '',
});

const rules = {
  targetUserId: [{ required: true, message: $t('wf.fillTargetUser'), trigger: 'blur' }],
};

const [Modal, modalApi] = useYDSZModal({
  onOpenChange: (isOpen: boolean) => {
    if (!isOpen) return;
    const data = modalApi.getData<{ record?: FlowRunTaskVO }>();
    selectedQuickCommentId.value = '';
    Object.assign(formData, {
      taskId: data?.record?.id ?? '',
      action: 'pass',
      comment: '',
      targetUserId: '',
    });
  },
  onConfirm: async () => {
    // 转办/委托必须填写目标人
    if (formData.action === 'transfer' || formData.action === 'delegate') {
      try {
        await formRef.value?.validate();
      } catch {
        return;
      }
    }
    if (!formData.taskId) {
      ElMessage.warning($t('wf.missingTaskId'));
      return;
    }
    modalApi.lock();
    try {
      const payload: FlowTaskOperateDTO = {
        taskId: formData.taskId,
        comment: formData.comment || undefined,
        targetUserId: formData.targetUserId || undefined,
      };
      switch (formData.action) {
        case 'pass': {
          await pass(payload);
          break;
        }
        case 'reject': {
          await reject(payload);
          break;
        }
        case 'transfer': {
          await transfer(payload);
          break;
        }
        case 'delegate': {
          await delegate(payload);
          break;
        }
        case 'countersignBefore': {
          await countersignBefore(payload);
          break;
        }
        case 'countersignAfter': {
          await countersignAfter(payload);
          break;
        }
        case 'countersignParallel': {
          await countersignParallel(payload);
          break;
        }
      }
      ElMessage.success($t('wf.processSuccess'));
      emit('success');
      modalApi.close();
    } finally {
      modalApi.unlock();
    }
  },
});

const title = computed(() => {
  const actionMap: Record<TaskAction, string> = {
    pass: $t('wf.actionPass'),
    reject: $t('wf.actionReject'),
    transfer: $t('wf.actionTransfer'),
    delegate: $t('wf.actionDelegate'),
    countersignBefore: $t('wf.actionCountersignBefore'),
    countersignAfter: $t('wf.actionCountersignAfter'),
    countersignParallel: $t('wf.actionCountersignParallel'),
  };
  return `${actionMap[formData.action]} - ${$t('wf.taskHandle')}`;
});
</script>

<template>
  <Modal :title="title">
    <ElForm
      ref="formRef"
      :model="formData"
      :rules="rules"
      label-width="100px"
      label-position="right"
    >
      <ElFormItem :label="$t('wf.handleAction')">
        <ElRadioGroup v-model="formData.action">
          <ElRadio value="pass">{{ $t('wf.approve') }}</ElRadio>
          <ElRadio value="reject">{{ $t('wf.reject') }}</ElRadio>
          <ElRadio value="transfer">{{ $t('wf.transfer') }}</ElRadio>
          <ElRadio value="delegate">{{ $t('wf.delegate') }}</ElRadio>
          <ElRadio value="countersignBefore">{{ $t('wf.countersignBefore') }}</ElRadio>
          <ElRadio value="countersignAfter">{{ $t('wf.countersignAfter') }}</ElRadio>
          <ElRadio value="countersignParallel">{{ $t('wf.countersignParallel') }}</ElRadio>
        </ElRadioGroup>
      </ElFormItem>
      <ElFormItem :label="$t('wf.quickComment')">
        <ElSelect
          v-model="selectedQuickCommentId"
          :placeholder="$t('wf.selectQuickCommentPlaceholder')"
          :loading="quickCommentLoading"
          clearable
          style="width: 100%"
          @change="handleQuickCommentSelect"
        >
          <ElOption
            v-for="item in quickComments"
            :key="item.id"
            :label="item.content"
            :value="item.id"
          />
        </ElSelect>
      </ElFormItem>
      <ElFormItem :label="$t('wf.comment')">
        <ElInput
          v-model="formData.comment"
          type="textarea"
          :rows="3"
          :placeholder="$t('wf.commentPlaceholder')"
        />
      </ElFormItem>
      <ElFormItem
        v-if="formData.action === 'transfer' || formData.action === 'delegate'"
        :label="$t('wf.targetUser')"
        prop="targetUserId"
      >
        <FlowUserSelector v-model="formData.targetUserId" />
      </ElFormItem>
    </ElForm>
  </Modal>
</template>
