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
import { createLogger } from '@YDSZ-core/shared/utils';
import { useI18n } from 'vue-i18n';

const logger = createLogger('workflow-template');
const { t } = useI18n();

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
  templateCode: [{ required: true, message: t('template.templateCode.required'), trigger: 'blur' }],
};

const [Modal, modalApi] = useYDSZModal({
  onOpenChange: (isOpen: boolean) => {
    if (!isOpen) return;
    Object.assign(formData, { templateCode: '', flowName: '' });
  },
  onConfirm: async () => {
    try {
      await formRef.value?.validate();
    } catch (error) {
      logger.warn('模板导入表单验证失败', error);
      return;
    }
    modalApi.lock();
    try {
      await importTemplate(
        { templateCode: formData.templateCode },
        { flowName: formData.flowName || undefined },
      );
      ElMessage.success(t('template.import.success'));
      emit('success');
      modalApi.close();
    } finally {
      modalApi.unlock();
    }
  },
});
</script>

<template>
  <Modal :title="t('template.import.title')">
    <ElForm
      ref="formRef"
      :model="formData"
      :rules="rules"
      label-width="100px"
      label-position="right"
    >
      <ElFormItem :label="t('template.templateCode.label')" prop="templateCode">
        <ElInput v-model="formData.templateCode" :placeholder="t('template.templateCode.placeholder')" />
      </ElFormItem>
      <ElFormItem :label="t('template.flowName.label')">
        <ElInput v-model="formData.flowName" :placeholder="t('template.flowName.placeholder')" />
      </ElFormItem>
      <ElFormItem :label="t('common.description.label')">
        <div class="text-xs leading-relaxed text-gray-400">
          {{ t('template.import.desc.prefix') }}
          <br />{{ t('template.import.desc.suffix') }}
        </div>
      </ElFormItem>
    </ElForm>
  </Modal>
</template>
