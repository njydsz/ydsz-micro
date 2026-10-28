<!--
 * 租户（表单组件）
 *
 * @path apps\system-web\src\views\tenant\tenant-form.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
/**
 * 租户（表单组件）
 * <p>新增/编辑租户表单，数据提交到后端契约 API tenant#save / tenant#update（apps/system-web/src/api/tenant.ts）。
 *
 * @author ydsz-team
 * @since 1.0.0
 */
import { useYdModal } from '@ydsz/common-ui';
import { YdDatePicker, YdForm, YdFormItem, YdInput, YdSelectItem, YdSelect } from '@ydsz-core/ydsz-ui';
import { computed, reactive, ref } from 'vue';
import { showToast } from '@ydsz/notification';
import { save, update } from '#/api/tenant';
import type { TenantDTO, TenantVO } from '#/api/models';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

defineOptions({ name: 'TenantForm' });

const emit = defineEmits<{ success: [] }>();
const formRef = ref();

/** 租户表单数据 */
interface TenantFormData {
  id: string;
  tenantCode: string;
  tenantName: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  planId: string;
  expireAt: string;
  datasourceKey: string;
  status: string;
}

const formData = reactive<TenantFormData>({
  id: '',
  tenantCode: '',
  tenantName: '',
  contactName: '',
  contactPhone: '',
  contactEmail: '',
  planId: '',
  expireAt: '',
  datasourceKey: '',
  status: 'ACTIVE',
});

const rules = {
  tenantCode: [{ required: true, message: t('business.tenantCodePlaceholder'), trigger: 'blur' }],
  tenantName: [{ required: true, message: t('business.tenantNamePlaceholder'), trigger: 'blur' }],
};

const [Modal, modalApi] = useYdModal({
  onOpenChange: (isOpen: boolean) => {
    if (!isOpen) return;
    const data = modalApi.getData() as { mode?: string; record?: TenantVO } | undefined;
    if (data?.mode === 'edit' && data.record) {
      Object.assign(formData, {
        id: data.record.id ?? '',
        tenantCode: data.record.tenantCode ?? '',
        tenantName: data.record.tenantName ?? '',
        contactName: data.record.contactName ?? '',
        contactPhone: data.record.contactPhone ?? '',
        contactEmail: data.record.contactEmail ?? '',
        planId: data.record.planId ?? '',
        expireAt: data.record.expireAt ?? '',
        datasourceKey: data.record.datasourceKey ?? '',
        status: data.record.status ?? 'ACTIVE',
      });
    } else {
      Object.assign(formData, {
        id: '',
        tenantCode: '',
        tenantName: '',
        contactName: '',
        contactPhone: '',
        contactEmail: '',
        planId: '',
        expireAt: '',
        datasourceKey: '',
        status: 'ACTIVE',
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
      const dto: TenantDTO = { ...formData };
      if (formData.id) {
        await update(dto);
        showToast.success(t('business.updateSuccess'));
      } else {
        await save(dto);
        showToast.success(t('business.createSuccess'));
      }
      emit('success');
      modalApi.close();
    } finally {
      modalApi.unlock();
    }
  },
});

const isEdit = computed(() => !!formData.id);
</script>

<template>
  <Modal :title="isEdit ? t('tenantForm.editTitle') : t('tenantForm.createTitle')">
    <YdForm ref="formRef" :model="formData" :rules="rules" label-width="100px" label-position="right">
      <YdFormItem :label="t('business.tenantCode')" prop="tenantCode">
        <YdInput v-model="formData.tenantCode" :placeholder="t('business.tenantCodePlaceholder')" :disabled="isEdit" />
      </YdFormItem>
      <YdFormItem :label="t('business.tenantName')" prop="tenantName">
        <YdInput v-model="formData.tenantName" :placeholder="t('business.tenantNamePlaceholder')" />
      </YdFormItem>
      <YdFormItem :label="t('business.contactName')" prop="contactName">
        <YdInput v-model="formData.contactName" :placeholder="t('tenantForm.contactNamePlaceholder')" />
      </YdFormItem>
      <YdFormItem :label="t('business.contactPhone')" prop="contactPhone">
        <YdInput v-model="formData.contactPhone" :placeholder="t('tenantForm.contactPhonePlaceholder')" />
      </YdFormItem>
      <YdFormItem :label="t('business.contactEmail')" prop="contactEmail">
        <YdInput v-model="formData.contactEmail" :placeholder="t('tenantForm.contactEmailPlaceholder')" />
      </YdFormItem>
      <YdFormItem :label="t('tenantForm.planId')" prop="planId">
        <YdInput v-model="formData.planId" :placeholder="t('tenantForm.planIdPlaceholder')" />
      </YdFormItem>
      <YdFormItem :label="t('business.expireAt')" prop="expireAt">
        <YdDatePicker v-model="formData.expireAt" type="datetime" :placeholder="t('tenantForm.expireAtPlaceholder')" class="w-full" />
      </YdFormItem>
      <YdFormItem :label="t('tenantForm.datasource')" prop="datasourceKey">
        <YdInput v-model="formData.datasourceKey" :placeholder="t('tenantForm.datasourcePlaceholder')" />
      </YdFormItem>
      <YdFormItem :label="t('business.status')" prop="status">
        <YdSelect v-model="formData.status" :placeholder="t('tenantForm.statusPlaceholder')">
          <YdSelectItem :label="t('business.enabled')" value="ACTIVE" />
          <YdSelectItem :label="t('business.disabled')" value="INACTIVE" />
        </YdSelect>
      </YdFormItem>
    </YdForm>
  </Modal>
</template>
