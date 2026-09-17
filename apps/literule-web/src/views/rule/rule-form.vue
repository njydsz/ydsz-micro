<!--
 * 规则定义编辑表单组件
 *
 * @path apps\literule-web\src\views\rule\rule-form.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
/**
 * 规则定义（表单组件）
 * <p>规则定义的创建/编辑表单，数据提交到后端契约 API ruleAdmin#save。
 *
 * @author ydsz-team
 * @since 1.0.0
 */
import type { RuleDefinitionVO } from '#/api/models';
import { useYdModal } from '@ydsz/common-ui';
import { createLogger } from '@ydsz-core/shared/utils';
;
import { computed, reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { save } from '#/api/ruleAdmin';
const logger = createLogger('literule-rule');
const { t } = useI18n();
const emit = defineEmits<{ success: [] }>();
const formRef = ref();
const isEdit = ref(false);
/** 规则表单数据（映射 RuleDefinition 的可编辑字段） */
interface RuleFormData {
  code: string;
  name: string;
  category: string;
  description: string;
  conditionExpression: string;
  priority: number;
  isEnabled: boolean;
}
const formData = reactive<RuleFormData>({
  code: '',
  name: '',
  category: '',
  description: '',
  conditionExpression: '',
  priority: 0,
  isEnabled: true,
});
const rules = {
  name: [{ required: true, message: () => t('ruleNamePlaceholder'), trigger: 'blur' }],
};
const [Modal, modalApi] = useYdModal({
  onOpenChange: (isOpen: boolean) => {
    if (!isOpen) return;
    const data = modalApi.getData<{ record?: RuleDefinitionVO }>();
    if (data?.record) {
      isEdit.value = true;
      Object.assign(formData, {
        code: data.record.ruleCode ?? '',
        name: data.record.ruleName ?? '',
        category: data.record.category ?? '',
        description: data.record.description ?? '',
        conditionExpression: data.record.conditionExpression ?? '',
        priority: data.record.priority ?? 0,
        isEnabled: data.record.isEnabled ?? true,
      });
    } else {
      isEdit.value = false;
      Object.assign(formData, {
        code: '',
        name: '',
        category: '',
        description: '',
        conditionExpression: '',
        priority: 0,
        isEnabled: true,
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
      await save({ changeDesc: isEdit.value ? t('updateRuleDesc') : t('createRuleDesc') }, formData);
      showToast.success(isEdit.value ? t('updateSuccess') : t('createSuccess'));
      emit('success');
      modalApi.close();
    } finally {
      modalApi.unlock();
    }
  },
});
const title = computed(() => (isEdit.value ? t('editRuleTitle') : t('createRuleTitle')));
</script>
<template>
  <Modal :title="title">
    <YdForm
      ref="formRef"
      :model="formData"
      :rules="rules"
      label-width="100px"
      label-position="right"
    >
      <YdFormItem :label="t('ruleCodeColumn')" prop="code">
        <YdInput v-model="formData.code" :placeholder="t('ruleCodePlaceholder')" :disabled="isEdit" />
      </YdFormItem>
      <YdFormItem :label="t('ruleNameColumn')" prop="name">
        <YdInput v-model="formData.name" :placeholder="t('ruleNamePlaceholder')" />
      </YdFormItem>
      <YdFormItem :label="t('categoryColumn')" prop="category">
        <YdInput v-model="formData.category" :placeholder="t('categoryPlaceholder')" />
      </YdFormItem>
      <YdFormItem :label="t('priorityColumn')">
        <YdNumberFieldInput v-model="formData.priority" :min="0" :max="999" />
      </YdFormItem>
      <YdFormItem :label="t('conditionExpression')">
        <YdInput
          v-model="formData.conditionExpression"
          type="textarea"
          :rows="3"
          :placeholder="t('conditionExpressionPlaceholder')"
        />
      </YdFormItem>
      <YdFormItem :label="t('descriptionColumn')">
        <YdInput
          v-model="formData.description"
          type="textarea"
          :rows="2"
          :placeholder="t('descriptionPlaceholder')"
        />
      </YdFormItem>
      <YdFormItem :label="t('enabledColumn')">
        <YdSwitch v-model="formData.isEnabled" />
      </YdFormItem>
    </YdForm>
  </Modal>
</template>
