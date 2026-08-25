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
import { ElForm, ElFormItem, ElInput, ElMessage, ElRadio, ElRadioGroup } from 'element-plus';
import { computed, reactive, ref } from 'vue';
import { delegate, pass, reject, transfer } from '#/api/flowTask';
import type { FlowRunTaskVO, FlowTaskOperateDTO } from '#/api/models';

const emit = defineEmits<{ success: [] }>();
const formRef = ref();

/** 处理动作 */
type TaskAction = 'pass' | 'reject' | 'transfer' | 'delegate';

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
  targetUserId: [{ required: true, message: '请填写目标用户ID', trigger: 'blur' }],
};

const [Modal, modalApi] = useYDSZModal({
  onOpenChange: (isOpen: boolean) => {
    if (!isOpen) return;
    const data = modalApi.getData<{ record?: FlowRunTaskVO }>();
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
      ElMessage.warning('缺少任务 ID，无法处理');
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
      }
      ElMessage.success('处理成功');
      emit('success');
      modalApi.close();
    } finally {
      modalApi.unlock();
    }
  },
});

const title = computed(() => {
  const actionMap: Record<TaskAction, string> = {
    pass: '同意（通过）',
    reject: '驳回',
    transfer: '转办',
    delegate: '委托',
  };
  return `${actionMap[formData.action]} - 任务处理`;
});
</script>

<template>
  <Modal :title="title">
    <ElForm ref="formRef" :model="formData" :rules="rules" label-width="100px" label-position="right">
      <ElFormItem label="处理动作">
        <ElRadioGroup v-model="formData.action">
          <ElRadio value="pass">同意</ElRadio>
          <ElRadio value="reject">驳回</ElRadio>
          <ElRadio value="transfer">转办</ElRadio>
          <ElRadio value="delegate">委托</ElRadio>
        </ElRadioGroup>
      </ElFormItem>
      <ElFormItem label="处理意见">
        <ElInput v-model="formData.comment" type="textarea" :rows="3" placeholder="请输入处理意见（可选）" />
      </ElFormItem>
      <ElFormItem v-if="formData.action === 'transfer' || formData.action === 'delegate'" label="目标用户ID" prop="targetUserId">
        <ElInput v-model="formData.targetUserId" placeholder="请输入目标用户 ID" />
      </ElFormItem>
    </ElForm>
  </Modal>
</template>