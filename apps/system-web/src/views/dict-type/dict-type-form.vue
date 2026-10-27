<!--
 * 字典类型表单组件 — 支持新增/编辑字典类型
 *
 * @path apps\system-web\src\views\dictType\dictType-form.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
/**
 * 字典类型（表单组件）
 * <p>消费后端契约 DictController（src/api/dict.ts，auto-generated）的字典类型创建/编辑表单，
 * 字段对应契约 DictTypeDTO，提交走 save/update。
 *
 * @author ydsz-team
 * @since 1.0.0
 */
import { useYdModal } from '@ydsz/common-ui';
import { YdForm, YdFormItem, YdInput, YdRadioGroupItem, YdRadioGroup } from '@ydsz-core/ydsz-ui';
import { computed, reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';

import { emitDictChange } from '@ydsz/shared-business';

import { showToast } from '@ydsz/notification';

import { save, update } from '#/api/dict';
import type { DictTypeVO } from '#/api/models';

const emit = defineEmits<{ success: [] }>();

const { t } = useI18n();

const formRef = ref();
const isEdit = ref(false);

/** 表单状态（字段对齐契约 DictTypeDTO，status 为字符串 '1'/'0'） */
interface DictTypeFormState {
  id?: string;
  typeCode: string;
  typeName: string;
  description: string;
  status: string;
}

const formData = reactive<DictTypeFormState>({
  id: '',
  typeCode: '',
  typeName: '',
  description: '',
  status: '1',
});

const rules = {
  typeCode: [{ required: true, message: t('common.placeholder', [t('typeCode')]), trigger: 'blur' }],
  typeName: [{ required: true, message: t('common.placeholder', [t('typeName')]), trigger: 'blur' }],
};

const [Modal, modalApi] = useYdModal({
  onOpenChange: (isOpen: boolean) => {
    if (!isOpen) return;
    const data = modalApi.getData<{ record?: DictTypeVO }>();
    if (data?.record) {
      isEdit.value = true;
      Object.assign(formData, {
        id: data.record.id ?? '',
        typeCode: data.record.typeCode ?? '',
        typeName: data.record.typeName ?? '',
        description: data.record.description ?? '',
        status: data.record.status ?? '1',
      });
    } else {
      isEdit.value = false;
      Object.assign(formData, {
        id: '',
        typeCode: '',
        typeName: '',
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
      // 广播字典类型变更事件，通知 YdDictSelect/YdDictTag 等组件自动刷新
      emitDictChange(formData.typeCode);
      emit('success');
      modalApi.close();
    } finally {
      modalApi.unlock();
    }
  },
});

const title = computed(() => (isEdit.value ? t('editDictType') : t('createDictType')));
</script>

<template>
  <Modal :title="title">
    <YdForm ref="formRef" :model="formData" :rules="rules" label-width="100px" label-position="right">
      <YdFormItem :label="t('typeCode')" prop="typeCode">
        <YdInput v-model="formData.typeCode" :placeholder="t('common.placeholder', [t('typeCode')])" :disabled="isEdit" />
      </YdFormItem>
      <YdFormItem :label="t('typeName')" prop="typeName">
        <YdInput v-model="formData.typeName" :placeholder="t('common.placeholder', [t('typeName')])" />
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
