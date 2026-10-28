<!--
 * 应用表单组件 — 支持新增/编辑应用注册信息
 *
 * @path apps\system-web\src\views\app\app-form.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
/**
 * 应用（表单组件）
 * <p>消费后端契约 AppInfoController（src/api/appInfo.ts，auto-generated）的应用创建/编辑表单，
 * 字段对应契约 AppInfoDTO，提交走 save/update。
 *
 * @author ydsz-team
 * @since 1.0.0
 */
import { useYdModal } from '@ydsz/common-ui';
import { YdForm, YdFormItem, YdInput, YdRadioGroupItem, YdRadioGroup } from '@ydsz-core/ydsz-ui';
import { computed, reactive, ref } from 'vue';

import { showToast } from '@ydsz/notification';

import { save, update } from '#/api/appInfo';
import type { AppInfoVO } from '#/api/models';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const emit = defineEmits<{ success: [] }>();

const formRef = ref();
const isEdit = ref(false);

/** 表单状态（字段对齐契约 AppInfoDTO，status 为字符串 '1'/'0'） */
interface AppFormState {
  id?: string;
  appCode: string;
  appName: string;
  appKey: string;
  redirectUrl: string;
  scopes: string;
  boundIps: string;
  description: string;
  status: string;
}

const formData = reactive<AppFormState>({
  id: '',
  appCode: '',
  appName: '',
  appKey: '',
  redirectUrl: '',
  scopes: '',
  boundIps: '',
  description: '',
  status: '1',
});

const rules = {
  appCode: [{ required: true, message: t('appForm.appCodePlaceholder'), trigger: 'blur' }],
  appName: [{ required: true, message: t('appForm.appNamePlaceholder'), trigger: 'blur' }],
};

const [Modal, modalApi] = useYdModal({
  onOpenChange: (isOpen: boolean) => {
    if (!isOpen) return;
    const data = modalApi.getData<{ record?: AppInfoVO }>();
    if (data?.record) {
      isEdit.value = true;
      Object.assign(formData, {
        id: data.record.id ?? '',
        appCode: data.record.appCode ?? '',
        appName: data.record.appName ?? '',
        appKey: data.record.appKey ?? '',
        redirectUrl: data.record.redirectUrl ?? '',
        scopes: data.record.scopes ?? '',
        boundIps: data.record.boundIps ?? '',
        description: data.record.description ?? '',
        status: data.record.status ?? '1',
      });
    } else {
      isEdit.value = false;
      Object.assign(formData, {
        id: '',
        appCode: '',
        appName: '',
        appKey: '',
        redirectUrl: '',
        scopes: '',
        boundIps: '',
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
        showToast.success(t('business.updateSuccess'));
      } else {
        await save(formData);
        showToast.success(t('business.createSuccess'));
      }
      emit('success');
      modalApi.close();
    } finally {
      modalApi.unlock();
    }
  },
});

const title = computed(() => (isEdit.value ? t('appForm.editTitle') : t('appForm.createTitle')));
</script>

<template>
  <Modal :title="title">
    <YdForm ref="formRef" :model="formData" :rules="rules" label-width="100px" label-position="right">
      <YdFormItem :label="t('appForm.appCode')" prop="appCode">
        <YdInput v-model="formData.appCode" :placeholder="t('appForm.appCodePlaceholder')" :disabled="isEdit" />
      </YdFormItem>
      <YdFormItem :label="t('business.appName')" prop="appName">
        <YdInput v-model="formData.appName" :placeholder="t('appForm.appNamePlaceholder')" />
      </YdFormItem>
      <YdFormItem :label="t('appForm.appKeyLabel')" prop="appKey">
        <YdInput v-model="formData.appKey" :placeholder="t('appForm.appKeyLabel')" />
      </YdFormItem>
      <YdFormItem :label="t('appForm.redirectUrl')" prop="redirectUrl">
        <YdInput v-model="formData.redirectUrl" :placeholder="t('appForm.redirectUrlPlaceholder')" />
      </YdFormItem>
      <YdFormItem :label="t('appForm.scopes')" prop="scopes">
        <YdInput v-model="formData.scopes" :placeholder="t('appForm.scopesPlaceholder')" />
      </YdFormItem>
      <YdFormItem :label="t('appForm.boundIps')" prop="boundIps">
        <YdInput v-model="formData.boundIps" :placeholder="t('appForm.boundIpsPlaceholder')" />
      </YdFormItem>
      <YdFormItem :label="t('business.description')">
        <YdInput v-model="formData.description" type="textarea" :rows="2" :placeholder="t('business.descriptionPlaceholder')" />
      </YdFormItem>
      <YdFormItem :label="t('business.status')" prop="status">
        <YdRadioGroup v-model="formData.status">
          <YdRadioGroupItem value="1">{{ t('business.enabled') }}</YdRadioGroupItem>
          <YdRadioGroupItem value="0">{{ t('business.disabled') }}</YdRadioGroupItem>
        </YdRadioGroup>
      </YdFormItem>
    </YdForm>
  </Modal>
</template>
