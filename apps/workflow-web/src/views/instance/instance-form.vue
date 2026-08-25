<!--
 * 流程实例（发起流程表单组件）
 *
 * @path apps\workflow-web\src\views\instance\instance-form.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
/**
 * 流程实例（发起流程表单组件）
 * <p>「发起流程」弹窗，字段对应契约 FlowStartProcessDTO（src/api/flowInstance.ts，auto-generated）：
 * flowCode/title/businessType/businessNo/initiatorName 等，提交走 startProcess。
 * 成功后 emit('success') 并关闭弹窗。
 *
 * @author ydsz-team
 * @since 1.0.0
 */
import { useYDSZModal } from '@ydsz/common-ui';
import { ElForm, ElFormItem, ElInput, ElMessage } from 'element-plus';
import { reactive, ref } from 'vue';
import { startProcess } from '#/api/flowInstance';
import type { FlowStartProcessDTO } from '#/api/models';

const emit = defineEmits<{ success: [] }>();
const formRef = ref();

/** 发起流程表单状态（字段对应 FlowStartProcessDTO） */
interface StartProcessState {
  flowCode: string;
  title: string;
  businessType: string;
  businessNo: string;
  initiatorName: string;
}

const formData = reactive<StartProcessState>({
  flowCode: '',
  title: '',
  businessType: '',
  businessNo: '',
  initiatorName: '',
});

const rules = {
  flowCode: [{ required: true, message: '请输入流程编码', trigger: 'blur' }],
};

const [Modal, modalApi] = useYDSZModal({
  onOpenChange: (isOpen: boolean) => {
    if (!isOpen) return;
    Object.assign(formData, {
      flowCode: '',
      title: '',
      businessType: '',
      businessNo: '',
      initiatorName: '',
    });
  },
  onConfirm: async () => {
    try {
      await formRef.value?.validate();
    } catch {
      return;
    }
    modalApi.lock();
    try {
      const payload: FlowStartProcessDTO = {
        flowCode: formData.flowCode,
        title: formData.title || undefined,
        businessType: formData.businessType || undefined,
        businessNo: formData.businessNo || undefined,
        initiatorName: formData.initiatorName || undefined,
      };
      await startProcess(payload);
      ElMessage.success('发起成功');
      emit('success');
      modalApi.close();
    } finally {
      modalApi.unlock();
    }
  },
});
</script>

<template>
  <Modal title="发起流程">
    <ElForm ref="formRef" :model="formData" :rules="rules" label-width="110px" label-position="right">
      <ElFormItem label="流程编码" prop="flowCode">
        <ElInput v-model="formData.flowCode" placeholder="请输入流程编码（flowCode）" />
      </ElFormItem>
      <ElFormItem label="标题">
        <ElInput v-model="formData.title" placeholder="流程实例标题（可选）" />
      </ElFormItem>
      <ElFormItem label="业务类型">
        <ElInput v-model="formData.businessType" placeholder="业务类型（可选）" />
      </ElFormItem>
      <ElFormItem label="业务单号">
        <ElInput v-model="formData.businessNo" placeholder="业务单号（可选）" />
      </ElFormItem>
      <ElFormItem label="发起人">
        <ElInput v-model="formData.initiatorName" placeholder="发起人姓名（可选）" />
      </ElFormItem>
    </ElForm>
  </Modal>
</template>