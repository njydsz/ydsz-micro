<!--
 * 规则变量编辑表单组件
 *
 * @path apps\literule-web\src\views\variable\variable-form.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
/**
 * 规则变量（表单组件）
 * <p>规则变量的创建/编辑表单，数据提交到后端契约 API ruleVariableAdmin#save。
 *
 * @author ydsz-team
 * @since 1.0.0
 */
import type { VariableDefinitionVO } from '#/api/models';
import { useYDSZModal } from '@ydsz/common-ui';
import { createLogger } from '@ydsz-core/shared/utils';
import { ElMessage } from 'element-plus';
import { computed, reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { save } from '#/api/ruleVariableAdmin';
const logger = createLogger('literule-variable');
const { t } = useI18n();
const emit = defineEmits<{ success: [] }>();
const formRef = ref();
const isEdit = ref(false);
/** 变量表单数据（映射 VariableDefinition 的可编辑字段） */
interface VariableFormData {
  name: string;
  type: string;
  category: string;
  description: string;
  isRequired: boolean;
}
const formData = reactive<VariableFormData>({
  name: '',
  type: '',
  category: '',
  description: '',
  isRequired: false,
});
const rules = {
  name: [{ required: true, message: () => t('variableNamePlaceholder'), trigger: 'blur' }],
};
const [Modal, modalApi] = useYDSZModal({
  onOpenChange: (isOpen: boolean) => {
    if (!isOpen) return;
    const data = modalApi.getData<{ record?: VariableDefinitionVO }>();
    if (data?.record) {
      isEdit.value = true;
      Object.assign(formData, {
        name: data.record.name ?? '',
        type: data.record.type ?? '',
        category: data.record.category ?? '',
        description: data.record.description ?? '',
        isRequired: false,
      });
    } else {
      isEdit.value = false;
      Object.assign(formData, {
        name: '',
        type: '',
        category: '',
        description: '',
        isRequired: false,
      });
    }
  },
  onConfirm: async () => {
    try {
      await formRef.value?.validate();
    } catch (error) {
      logger.debug("表单校验未通过: {}", error);
      return;
    }
    modalApi.lock();
    try {
      await save(formData);
      ElMessage.success(isEdit.value ? t('updateSuccess') : t('createSuccess'));
      emit('success');
      modalApi.close();
    } finally {
      modalApi.unlock();
    }
  },
});
const title = computed(() => (isEdit.value ? t('editVariableTitle') : t('createVariableTitle')));
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
      <ElFormItem :label="t('variableNameColumn')" prop="name">
        <ElInput v-model="formData.name" :placeholder="t('variableNamePlaceholder')" :disabled="isEdit" />
      </ElFormItem>
      <ElFormItem :label="t('variableType')">
        <ElInput v-model="formData.type" :placeholder="t('variableTypePlaceholder')" />
      </ElFormItem>
      <ElFormItem :label="t('categoryColumn')">
        <ElInput v-model="formData.category" :placeholder="t('variableCategoryPlaceholder')" />
      </ElFormItem>
      <ElFormItem :label="t('descriptionColumn')">
        <ElInput
          v-model="formData.description"
          type="textarea"
          :rows="2"
          :placeholder="t('variableDescriptionPlaceholder')"
        />
      </ElFormItem>
      <ElFormItem :label="t('required')">
        <ElSwitch v-model="formData.isRequired" />
      </ElFormItem>
    </ElForm>
  </Modal>
</template>
