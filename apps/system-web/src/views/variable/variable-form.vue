<!--
 * 系统变量表单组件 — 支持新增/编辑系统变量
 *
 * @path apps\system-web\src\views\variable\variable-form.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
/**
 * 系统变量（表单组件）
 * <p>消费后端契约 VariableController（src/api/variable.ts，auto-generated）的系统变量创建/编辑表单，
 * 字段对应契约 VariableDTO，提交走 save/update。
 *
 * @author ydsz-team
 * @since 1.0.0
 */
import { useYdModal } from '@ydsz/common-ui';
import { YdForm, YdFormItem, YdInput, YdRadioGroupItem, YdRadioGroup } from '@ydsz-core/ydsz-ui';
import { computed, reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';

import { showToast } from '@ydsz/notification';

import { save, update } from '#/api/variable';
import type { VariableVO } from '#/api/models';

const emit = defineEmits<{ success: [] }>();

const { t } = useI18n();

const formRef = ref();
const isEdit = ref(false);

/** 表单状态（字段对齐契约 VariableDTO，status 为字符串 '1'/'0'） */
interface VariableFormState {
  id?: string;
  variableKey: string;
  variableValue: string;
  valueType: string;
  description: string;
  status: string;
}

const formData = reactive<VariableFormState>({
  id: '',
  variableKey: '',
  variableValue: '',
  valueType: '',
  description: '',
  status: '1',
});

const rules = {
  variableKey: [{ required: true, message: t('common.placeholder', [t('variable.key')]), trigger: 'blur' }],
};

const [Modal, modalApi] = useYdModal({
  onOpenChange: (isOpen: boolean) => {
    if (!isOpen) return;
    const data = modalApi.getData<{ record?: VariableVO }>();
    if (data?.record) {
      isEdit.value = true;
      Object.assign(formData, {
        id: data.record.id ?? '',
        variableKey: data.record.variableKey ?? '',
        variableValue: data.record.variableValue ?? '',
        valueType: data.record.valueType ?? '',
        description: data.record.description ?? '',
        status: data.record.status ?? '1',
      });
    } else {
      isEdit.value = false;
      Object.assign(formData, {
        id: '',
        variableKey: '',
        variableValue: '',
        valueType: '',
        description: '',
        status: '1',
      });
    }
  },
  onConfirm: async () => {
    try {
      await formRef.value?.validate();
    } catch {
      return;
    }
    modalApi.lock();
    try {
      if (isEdit.value) {
        await update(formData);
        showToast.success(t('updateSuccess'));
      } else {
        await save(formData);
        showToast.success(t('createSuccess'));
      }
      emit('success');
      modalApi.close();
    } finally {
      modalApi.unlock();
    }
  },
});

const title = computed(() => (isEdit.value ? t('editVariable') : t('createVariable')));
</script>

<template>
  <Modal :title="title">
    <YdForm ref="formRef" :model="formData" :rules="rules" label-width="100px" label-position="right">
      <YdFormItem :label="t('variable.key')" prop="variableKey">
        <YdInput v-model="formData.variableKey" :placeholder="t('common.placeholder', [t('variable.key')])" :disabled="isEdit" />
      </YdFormItem>
      <YdFormItem :label="t('variable.valueType')" prop="valueType">
        <YdInput v-model="formData.valueType" :placeholder="t('valueTypePlaceholder')" />
      </YdFormItem>
      <YdFormItem :label="t('variable.value')" prop="variableValue">
        <YdInput v-model="formData.variableValue" type="textarea" :rows="2" :placeholder="t('common.placeholder', [t('variable.value')])" />
      </YdFormItem>
      <YdFormItem :label="t('description')">
        <YdInput v-model="formData.description" type="textarea" :rows="2" :placeholder="t('descriptionPlaceholder')" />
      </YdFormItem>
      <YdFormItem :label="t('status')" prop="status">
        <YdRadioGroup v-model="formData.status">
          <YdRadioGroupItem value="1">{{ t('enabled') }}</YdRadioGroupItem>
          <YdRadioGroupItem value="0">{{ t('disabled') }}</YdRadioGroupItem>
        </YdRadioGroup>
      </YdFormItem>
    </YdForm>
  </Modal>
</template>