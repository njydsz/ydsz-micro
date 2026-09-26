<!--
 * 国际化语言表单组件 — 支持新增/编辑语言（语言编码、名称、默认标识、排序、状态）
 *
 * @path apps\userinfo-web\src\views\system\language\language-form.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
/**
 * 国际化（表单组件）
 * <p>语言的创建/编辑弹窗，字段对应契约 LanguageDTO（src/api/language.ts，auto-generated）：
 * 语言编码、语言名称、默认语言标识（数字 1/0）、排序、状态。
 * 提交走 create/update，成功后 emit('success') 并关闭弹窗。
 *
 * @author ydsz-team
 * @since 1.0.0
 */
import { useYdModal } from '@ydsz/common-ui';

import { YdForm, YdFormItem, YdInput, YdNumberFieldInput, YdRadioGroupItem, YdRadioGroup } from '@ydsz-core/ydsz-ui';
import { computed, reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';

import { createLogger } from '@ydsz-core/shared/utils';

import { create, update } from '#/api/language';
import type { LanguageDTO, LanguageVO } from '#/api/models';

const emit = defineEmits<{ success: [] }>();

const logger = createLogger('userinfo-language');
const { t } = useI18n();

const formRef = ref();
const isEdit = ref(false);

/** 表单状态（字段对应 LanguageDTO） */
interface LanguageFormState {
  id: string;
  languageCode: string;
  languageName: string;
  isDefault: number;
  sort?: number;
  status: string;
}

const formData = reactive<LanguageFormState>({
  id: '',
  languageCode: '',
  languageName: '',
  isDefault: 0,
  sort: 0,
  status: '1',
});

const rules = {
  languageCode: [{ required: true, message: t('language.languageCodePlaceholder'), trigger: 'blur' }],
  languageName: [{ required: true, message: t('language.languageNamePlaceholder'), trigger: 'blur' }],
};

const [Modal, modalApi] = useYdModal({
  onOpenChange: (isOpen: boolean) => {
    if (!isOpen) return;
    const data = modalApi.getData<{ record?: LanguageVO }>();
    if (data?.record) {
      isEdit.value = true;
      Object.assign(formData, {
        id: data.record.id ?? '',
        languageCode: data.record.languageCode ?? '',
        languageName: data.record.languageName ?? '',
        isDefault: data.record.isDefault ?? 0,
        sort: data.record.sort ?? 0,
        status: data.record.status ?? '1',
      });
    } else {
      isEdit.value = false;
      Object.assign(formData, {
        id: '',
        languageCode: '',
        languageName: '',
        isDefault: 0,
        sort: 0,
        status: '1',
      });
    }
  },
  onConfirm: async () => {
    try {
      await formRef.value?.validate();
    } catch (error) {
      logger.warn('表单校验失败: {}', error);
      return;
    }
    modalApi.lock();
    try {
      const payload: LanguageDTO = {
        languageCode: formData.languageCode,
        languageName: formData.languageName,
        isDefault: formData.isDefault,
        sort: formData.sort,
        status: formData.status,
      };
      if (isEdit.value) {
        await update({ ...payload, id: formData.id || undefined });
        showToast.success(t('page.updateSuccess'));
      } else {
        await create(payload);
        showToast.success(t('page.createSuccess'));
      }
      emit('success');
      modalApi.close();
    } finally {
      modalApi.unlock();
    }
  },
});

const title = computed(() => (isEdit.value ? `${t('page.edit')}${t('page.languageBase')}` : `${t('page.create')}${t('page.languageBase')}`));
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
      <YdFormItem :label="t('page.languageCode')" prop="languageCode">
        <YdInput v-model="formData.languageCode" :placeholder="t('language.languageCodePlaceholder')" :disabled="isEdit" />
      </YdFormItem>
      <YdFormItem :label="t('page.languageName')" prop="languageName">
        <YdInput v-model="formData.languageName" :placeholder="t('language.languageNamePlaceholder')" />
      </YdFormItem>
      <YdFormItem :label="t('language.defaultLanguage')">
        <YdRadioGroup v-model="formData.isDefault">
          <YdRadioGroupItem :value="1">{{ t('language.yesDefault') }}</YdRadioGroupItem>
          <YdRadioGroupItem :value="0">{{ t('language.noDefault') }}</YdRadioGroupItem>
        </YdRadioGroup>
      </YdFormItem>
      <YdFormItem :label="t('page.sortOrder')">
        <YdNumberFieldInput v-model="formData.sortOrder" :min="0" :max="999" />
      </YdFormItem>
      <YdFormItem :label="t('page.status')">
        <YdRadioGroup v-model="formData.status">
          <YdRadioGroupItem value="1">{{ t('page.enabled') }}</YdRadioGroupItem>
          <YdRadioGroupItem value="0">{{ t('page.disabled') }}</YdRadioGroupItem>
        </YdRadioGroup>
      </YdFormItem>
    </YdForm>
  </Modal>
</template>