<!--
 * 流程模板（模板导入表单组件）
 *
 * @path apps\workflow-web\src\views\template\template-form.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
/**
 * 流程模板（模板导入表单组件）
 * <p>后端 FlowTemplateController 无通用 create/update CRUD，本弹窗承接「模板导入」：
 * 填写 templateCode 后调用 importTemplate({templateCode}, {flowName})，
 * 将后端模板库中的模板导入为流程。成功后 emit('success') 并关闭弹窗。
 *
 * @author ydsz-team
 * @since 1.0.0
 */
import { useYDSZModal } from '@ydsz/common-ui';
import { ElForm, ElFormItem, ElInput, ElMessage } from 'element-plus';
import { reactive, ref } from 'vue';
import { importTemplate } from '#/api/flowTemplate';

const emit = defineEmits<{ success: [] }>();
const formRef = ref();

/** 模板导入表单状态 */
interface TemplateImportState {
  templateCode: string;
  flowName: string;
}

const formData = reactive<TemplateImportState>({
  templateCode: '',
  flowName: '',
});

const rules = {
  templateCode: [{ required: true, message: '请输入模板编码', trigger: 'blur' }],
};

const [Modal, modalApi] = useYDSZModal({
  onOpenChange: (isOpen: boolean) => {
    if (!isOpen) return;
    Object.assign(formData, { templateCode: '', flowName: '' });
  },
  onConfirm: async () => {
    try {
      await formRef.value?.validate();
    } catch {
      return;
    }
    modalApi.lock();
    try {
      await importTemplate(
        { templateCode: formData.templateCode },
        { flowName: formData.flowName || undefined },
      );
      ElMessage.success('导入成功');
      emit('success');
      modalApi.close();
    } finally {
      modalApi.unlock();
    }
  },
});
</script>

<template>
  <Modal title="模板导入">
    <ElForm
      ref="formRef"
      :model="formData"
      :rules="rules"
      label-width="100px"
      label-position="right"
    >
      <ElFormItem label="模板编码" prop="templateCode">
        <ElInput v-model="formData.templateCode" placeholder="请输入后端模板库中的模板编码" />
      </ElFormItem>
      <ElFormItem label="流程名称">
        <ElInput v-model="formData.flowName" placeholder="导入后的流程名称（可选）" />
      </ElFormItem>
      <ElFormItem label="说明">
        <div class="text-xs leading-relaxed text-gray-400">
          填写模板编码后将调用后端模板导入接口，
          <br />把模板库中的指定模板导入为可发起流程的流程定义。
        </div>
      </ElFormItem>
    </ElForm>
  </Modal>
</template>
