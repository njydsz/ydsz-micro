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
import { $t } from '#/locales';

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
  flowCode: [{ required: true, message: $t('wf.inputFlowCode'), trigger: 'blur' }],
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
      ElMessage.success($t('wf.startSuccess'));
      emit('success');
      modalApi.close();
    } finally {
      modalApi.unlock();
    }
  },
});
</script>

<template>
  <Modal :title="$t('wf.startFlow')">
    <ElForm
      ref="formRef"
      :model="formData"
      :rules="rules"
      label-width="110px"
      label-position="right"
    >
      <ElFormItem :label="$t('wf.flowCode')" prop="flowCode">
        <ElInput v-model="formData.flowCode" :placeholder="$t('wf.inputFlowCode')" />
      </ElFormItem>
      <ElFormItem :label="$t('wf.title')">
        <ElInput v-model="formData.title" :placeholder="$t('wf.titlePlaceholder')" />
      </ElFormItem>
      <ElFormItem :label="$t('wf.businessType')">
        <ElInput v-model="formData.businessType" :placeholder="$t('wf.businessTypePlaceholder')" />
      </ElFormItem>
      <ElFormItem :label="$t('wf.businessNo')">
        <ElInput v-model="formData.businessNo" :placeholder="$t('wf.businessNoPlaceholder')" />
      </ElFormItem>
      <ElFormItem :label="$t('wf.initiator')">
        <ElInput v-model="formData.initiatorName" :placeholder="$t('wf.initiatorPlaceholder')" />
      </ElFormItem>
    </ElForm>
  </Modal>
</template>
