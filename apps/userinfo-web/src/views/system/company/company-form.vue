<!--
 * 公司表单组件 — 支持新增/编辑公司信息（公司编码、名称、上级公司、联系人、状态）
 *
 * @path apps\userinfo-web\src\views\system\company\company-form.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
/**
 * 公司（表单组件）
 * <p>公司的创建/编辑表单，字段对应契约 CompanyDTO（src/api/company.ts，auto-generated）：
 * 公司编码、公司名称、上级公司（复用 company.tree() 的层级数据做级联选择）、联系人、
 * 联系电话、地址、状态。提交走 create/update，成功后 emit('success') 并关闭弹窗。
 *
 * @author ydsz-team
 * @since 1.0.0
 */
import { useYdModal } from '@ydsz/common-ui';

import { YdForm, YdFormItem, YdInput, YdRadioGroupItem, YdRadioGroup, YdTreeSelect } from '@ydsz-core/ydsz-ui';
import { computed, reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';

import { createLogger } from '@ydsz-core/shared/utils';

import { create, update } from '#/api/company';
import type { CompanyDTO, CompanyTreeVO, CompanyVO } from '#/api/models';

const emit = defineEmits<{ success: [] }>();

const logger = createLogger('userinfo-company');
const { t } = useI18n();

const formRef = ref();
const isEdit = ref(false);

/** 上级公司树数据（来自 company.tree()，由列表页传入） */
const treeData = ref<CompanyTreeVO[]>([]);

/** 将 CompanyTreeVO 树转换为 YdTreeSelect 所需的 options 格式 */
const treeOptions = computed(() => mapCompanyTreeToOptions(treeData.value));

function mapCompanyTreeToOptions(nodes: CompanyTreeVO[]): { label: string; value: string; children?: { label: string; value: string }[] }[] {
  return nodes.map(node => ({
    label: node.companyName ?? '',
    value: node.id ?? '',
    ...(node.children?.length && { children: mapCompanyTreeToOptions(node.children) }),
  }));
}

interface CompanyFormState {
  id: string;
  companyName: string;
  companyCode: string;
  parentId: string;
  contactPerson: string;
  contactPhone: string;
  address: string;
  status: string;
}

const formData = reactive<CompanyFormState>({
  id: '',
  companyName: '',
  companyCode: '',
  parentId: '',
  contactPerson: '',
  contactPhone: '',
  address: '',
  status: '1',
});

const rules = {
  companyName: [{ required: true, message: t('company.companyNamePlaceholder'), trigger: 'blur' }],
  companyCode: [{ required: true, message: t('company.companyCodePlaceholder'), trigger: 'blur' }],
};

const [Modal, modalApi] = useYdModal({
  onOpenChange: (isOpen: boolean) => {
    if (!isOpen) return;
    const data = modalApi.getData<{ record?: CompanyVO; treeData?: CompanyTreeVO[] }>();
    treeData.value = data?.treeData ?? [];

    if (data?.record) {
      isEdit.value = true;
      Object.assign(formData, {
        id: data.record.id ?? '',
        companyName: data.record.companyName ?? '',
        companyCode: data.record.companyCode ?? '',
        parentId: data.record.parentId ?? '',
        contactPerson: data.record.contactPerson ?? '',
        contactPhone: data.record.contactPhone ?? '',
        address: data.record.address ?? '',
        status: data.record.status ?? '1',
      });
    } else {
      isEdit.value = false;
      Object.assign(formData, {
        id: '',
        companyName: '',
        companyCode: '',
        parentId: '',
        contactPerson: '',
        contactPhone: '',
        address: '',
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
      const payload: CompanyDTO = {
        companyName: formData.companyName,
        companyCode: formData.companyCode,
        parentId: formData.parentId || undefined,
        contactPerson: formData.contactPerson,
        contactPhone: formData.contactPhone,
        address: formData.address,
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

const title = computed(() => (isEdit.value ? `${t('page.edit')}${t('page.companyBase')}` : `${t('page.create')}${t('page.companyBase')}`));
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
      <YdFormItem :label="t('company.parentCompany')">
        <YdTreeSelect
          v-model="formData.parentId"
          :options="treeOptions"
          :placeholder="t('company.parentCompanyPlaceholder')"
          class="w-full"
        />
      </YdFormItem>
      <YdFormItem :label="t('page.companyName')" prop="companyName">
        <YdInput v-model="formData.companyName" :placeholder="t('company.companyNamePlaceholder')" />
      </YdFormItem>
      <YdFormItem :label="t('page.companyCode')" prop="companyCode">
        <YdInput v-model="formData.companyCode" :placeholder="t('company.companyCodePlaceholder')" />
      </YdFormItem>
      <YdFormItem :label="t('company.contactPerson')">
        <YdInput v-model="formData.contactPerson" :placeholder="t('company.contactPersonPlaceholder')" />
      </YdFormItem>
      <YdFormItem :label="t('company.contactPhone')">
        <YdInput v-model="formData.contactPhone" :placeholder="t('company.contactPhonePlaceholder')" />
      </YdFormItem>
      <YdFormItem :label="t('company.address')">
        <YdInput v-model="formData.address" type="textarea" :rows="2" :placeholder="t('company.addressPlaceholder')" />
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