<!--
 * 特性开关表单组件 — 支持新增/编辑特性开关
 *
 * @path apps\system-web\src\views\feature-flag\feature-flag-form.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
/**
 * 特性开关（表单组件）
 * <p>消费后端契约 FeatureFlagController（src/api/featureFlag.ts）的特性开关创建/编辑表单，
 * 字段对应契约 FeatureFlagDTO，提交走 save/update。
 *
 * @author ydsz-team
 * @since 1.0.0
 */
import { useYdModal } from '@ydsz/common-ui';
import { YdForm, YdFormItem, YdInput, YdRadioGroupItem, YdRadioGroup } from '@ydsz-core/ydsz-ui';
import { computed, reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';

import { save, update } from '#/api/featureFlag';
import type { FeatureFlagVO } from '#/api/models';

const { t } = useI18n();

const emit = defineEmits<{ success: [] }>();

const formRef = ref();
const isEdit = ref(false);

/** 表单状态（字段对齐契约 FeatureFlagDTO，status 为字符串 '1'/'0'） */
interface FeatureFlagFormState {
  id?: string;
  flagKey: string;
  flagName: string;
  flagType: string;
  defaultValue: string;
  currentValue: string;
  description: string;
  status: string;
}

const formData = reactive<FeatureFlagFormState>({
  id: '',
  flagKey: '',
  flagName: '',
  flagType: 'BOOLEAN',
  defaultValue: '',
  currentValue: '',
  description: '',
  status: '1',
});

const rules = {
  flagKey: [{ required: true, message: t('featureFlag.flagKeyPlaceholder'), trigger: 'blur' }],
  flagName: [{ required: true, message: t('featureFlag.flagNamePlaceholder'), trigger: 'blur' }],
  flagType: [{ required: true, message: t('featureFlag.flagType'), trigger: 'change' }],
};

const [Modal, modalApi] = useYdModal({
  onOpenChange: (isOpen: boolean) => {
    if (!isOpen) return;
    const data = modalApi.getData<{ record?: FeatureFlagVO }>();
    if (data?.record) {
      isEdit.value = true;
      Object.assign(formData, {
        id: data.record.id ?? '',
        flagKey: data.record.flagKey ?? '',
        flagName: data.record.flagName ?? '',
        flagType: data.record.flagType ?? 'BOOLEAN',
        defaultValue: data.record.defaultValue ?? '',
        currentValue: data.record.currentValue ?? '',
        description: data.record.description ?? '',
        status: data.record.status ?? '1',
      });
    } else {
      isEdit.value = false;
      Object.assign(formData, {
        id: '',
        flagKey: '',
        flagName: '',
        flagType: 'BOOLEAN',
        defaultValue: '',
        currentValue: '',
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
        showToast.success(t('operationSuccess'));
      } else {
        await save(formData);
        showToast.success(t('operationSuccess'));
      }
      emit('success');
      modalApi.close();
    } finally {
      modalApi.unlock();
    }
  },
});

const title = computed(() => (isEdit.value ? t('featureFlag.edit') : t('featureFlag.create')));

/** 判断给定字段名在 rules 中是否包含 required 校验 */
function isRequired(field: string): boolean {
  const fieldRules = rules[field];
  if (!fieldRules) return false;
  if (Array.isArray(fieldRules)) return fieldRules.some((r) => r.required);
  return false;
}
</script>

<template>
  <Modal :title="title">
    <YdForm ref="formRef" :model="formData" :rules="rules" label-width="100px" label-position="right">
      <YdFormItem prop="flagKey">
        <label class="mb-1 flex items-center text-sm font-medium text-text-primary">
          <span v-if="isRequired('flagKey')" class="mr-0.5 text-red-500">*</span>
          {{ t('featureFlag.flagKey') }}
        </label>
        <YdInput v-model="formData.flagKey" :placeholder="t('featureFlag.flagKeyPlaceholder')" :disabled="isEdit" />
      </YdFormItem>
      <YdFormItem prop="flagName">
        <label class="mb-1 flex items-center text-sm font-medium text-text-primary">
          <span v-if="isRequired('flagName')" class="mr-0.5 text-red-500">*</span>
          {{ t('featureFlag.flagName') }}
        </label>
        <YdInput v-model="formData.flagName" :placeholder="t('featureFlag.flagNamePlaceholder')" />
      </YdFormItem>
      <YdFormItem prop="flagType">
        <label class="mb-1 flex items-center text-sm font-medium text-text-primary">
          <span v-if="isRequired('flagType')" class="mr-0.5 text-red-500">*</span>
          {{ t('featureFlag.flagType') }}
        </label>
        <YdRadioGroup v-model="formData.flagType">
          <YdRadioGroupItem value="BOOLEAN">{{ t('featureFlag.typeBoolean') }}</YdRadioGroupItem>
          <YdRadioGroupItem value="STRING">{{ t('featureFlag.typeString') }}</YdRadioGroupItem>
          <YdRadioGroupItem value="JSON">{{ t('featureFlag.typeJson') }}</YdRadioGroupItem>
        </YdRadioGroup>
      </YdFormItem>
      <YdFormItem>
        <label class="mb-1 flex items-center text-sm font-medium text-text-primary">{{ t('featureFlag.defaultValue') }}</label>
        <YdInput v-model="formData.defaultValue" type="textarea" :rows="2" :placeholder="t('featureFlag.defaultValuePlaceholder')" />
      </YdFormItem>
      <YdFormItem>
        <label class="mb-1 flex items-center text-sm font-medium text-text-primary">{{ t('featureFlag.currentValue') }}</label>
        <YdInput v-model="formData.currentValue" type="textarea" :rows="2" :placeholder="t('featureFlag.currentValuePlaceholder')" />
      </YdFormItem>
      <YdFormItem>
        <label class="mb-1 flex items-center text-sm font-medium text-text-primary">{{ t('featureFlag.description') }}</label>
        <YdInput v-model="formData.description" type="textarea" :rows="2" :placeholder="t('featureFlag.descriptionPlaceholder')" />
      </YdFormItem>
      <YdFormItem prop="status">
        <label class="mb-1 flex items-center text-sm font-medium text-text-primary">
          <span v-if="isRequired('status')" class="mr-0.5 text-red-500">*</span>
          {{ t('featureFlag.status') }}
        </label>
        <YdRadioGroup v-model="formData.status">
          <YdRadioGroupItem value="1">{{ t('common.enabled') }}</YdRadioGroupItem>
          <YdRadioGroupItem value="0">{{ t('common.disabled') }}</YdRadioGroupItem>
        </YdRadioGroup>
      </YdFormItem>
    </YdForm>
  </Modal>
</template>
