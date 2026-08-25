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
import { useYDSZModal } from '@ydsz/common-ui';

import {
  ElForm,
  ElFormItem,
  ElInput,
  ElInputNumber,
  ElMessage,
  ElRadio,
  ElRadioGroup,
} from 'element-plus';
import { computed, reactive, ref } from 'vue';

import { create, update } from '#/api/language';
import type { LanguageDTO, LanguageVO } from '#/api/models';

const emit = defineEmits<{ success: [] }>();

const formRef = ref();
const isEdit = ref(false);

/** 表单状态（字段对应 LanguageDTO） */
interface LanguageFormState {
  id: string;
  languageCode: string;
  languageName: string;
  isDefault: number;
  sortOrder: number;
  status: string;
}

const formData = reactive<LanguageFormState>({
  id: '',
  languageCode: '',
  languageName: '',
  isDefault: 0,
  sortOrder: 0,
  status: '1',
});

const rules = {
  languageCode: [{ required: true, message: '请输入语言编码', trigger: 'blur' }],
  languageName: [{ required: true, message: '请输入语言名称', trigger: 'blur' }],
};

const [Modal, modalApi] = useYDSZModal({
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
        sortOrder: data.record.sortOrder ?? 0,
        status: data.record.status ?? '1',
      });
    } else {
      isEdit.value = false;
      Object.assign(formData, {
        id: '',
        languageCode: '',
        languageName: '',
        isDefault: 0,
        sortOrder: 0,
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
      const payload: LanguageDTO = {
        languageCode: formData.languageCode,
        languageName: formData.languageName,
        isDefault: formData.isDefault,
        sortOrder: formData.sortOrder,
        status: formData.status,
      };
      if (isEdit.value) {
        await update({ ...payload, id: formData.id || undefined });
        ElMessage.success('更新成功');
      } else {
        await create(payload);
        ElMessage.success('创建成功');
      }
      emit('success');
      modalApi.close();
    } finally {
      modalApi.unlock();
    }
  },
});

const title = computed(() => (isEdit.value ? '编辑语言' : '新增语言'));
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
      <ElFormItem label="语言编码" prop="languageCode">
        <ElInput v-model="formData.languageCode" placeholder="如: zh-CN" :disabled="isEdit" />
      </ElFormItem>
      <ElFormItem label="语言名称" prop="languageName">
        <ElInput v-model="formData.languageName" placeholder="如: 简体中文" />
      </ElFormItem>
      <ElFormItem label="默认语言">
        <ElRadioGroup v-model="formData.isDefault">
          <ElRadio :value="1">默认</ElRadio>
          <ElRadio :value="0">非默认</ElRadio>
        </ElRadioGroup>
      </ElFormItem>
      <ElFormItem label="排序">
        <ElInputNumber v-model="formData.sortOrder" :min="0" :max="999" />
      </ElFormItem>
      <ElFormItem label="状态">
        <ElRadioGroup v-model="formData.status">
          <ElRadio value="1">启用</ElRadio>
          <ElRadio value="0">禁用</ElRadio>
        </ElRadioGroup>
      </ElFormItem>
    </ElForm>
  </Modal>
</template>