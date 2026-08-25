<!--
 * 系统配置表单组件 — 支持新增/编辑系统参数
 *
 * @path apps\system-web\src\views\config\config-form.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
/**
 * 系统配置（表单组件）
 * <p>消费后端契约 ConfigController（src/api/config.ts，auto-generated）的系统配置创建/编辑表单，
 * 字段对应契约 ConfigDTO（isPublic/sortOrder 为数字，status 为字符串 '1'/'0'），提交走 save/update。
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

import { save, update } from '#/api/config';
import type { ConfigVO } from '#/api/models';

const emit = defineEmits<{ success: [] }>();

const formRef = ref();
const isEdit = ref(false);

/** 表单状态（字段对齐契约 ConfigDTO，status 为字符串 '1'/'0'） */
interface ConfigFormState {
  id?: string;
  configKey: string;
  configGroup: string;
  configValue: string;
  valueType: string;
  defaultValue: string;
  description: string;
  isPublic: number;
  sortOrder: number;
  status: string;
}

const formData = reactive<ConfigFormState>({
  id: '',
  configKey: '',
  configGroup: '',
  configValue: '',
  valueType: '',
  defaultValue: '',
  description: '',
  isPublic: 0,
  sortOrder: 0,
  status: '1',
});

const rules = {
  configKey: [{ required: true, message: '请输入配置键', trigger: 'blur' }],
  configGroup: [{ required: true, message: '请输入配置分组', trigger: 'blur' }],
};

const [Modal, modalApi] = useYDSZModal({
  onOpenChange: (isOpen: boolean) => {
    if (!isOpen) return;
    const data = modalApi.getData<{ record?: ConfigVO }>();
    if (data?.record) {
      isEdit.value = true;
      Object.assign(formData, {
        id: data.record.id ?? '',
        configKey: data.record.configKey ?? '',
        configGroup: data.record.configGroup ?? '',
        configValue: data.record.configValue ?? '',
        valueType: data.record.valueType ?? '',
        defaultValue: data.record.defaultValue ?? '',
        description: data.record.description ?? '',
        isPublic: data.record.isPublic ?? 0,
        sortOrder: data.record.sortOrder ?? 0,
        status: data.record.status ?? '1',
      });
    } else {
      isEdit.value = false;
      Object.assign(formData, {
        id: '',
        configKey: '',
        configGroup: '',
        configValue: '',
        valueType: '',
        defaultValue: '',
        description: '',
        isPublic: 0,
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
      if (isEdit.value) {
        await update(formData);
        ElMessage.success('更新成功');
      } else {
        await save(formData);
        ElMessage.success('创建成功');
      }
      emit('success');
      modalApi.close();
    } finally {
      modalApi.unlock();
    }
  },
});

const title = computed(() => (isEdit.value ? '编辑系统配置' : '新增系统配置'));
</script>

<template>
  <Modal :title="title">
    <ElForm ref="formRef" :model="formData" :rules="rules" label-width="100px" label-position="right">
      <ElFormItem label="配置键" prop="configKey">
        <ElInput v-model="formData.configKey" placeholder="请输入配置键" :disabled="isEdit" />
      </ElFormItem>
      <ElFormItem label="配置分组" prop="configGroup">
        <ElInput v-model="formData.configGroup" placeholder="请输入配置分组" />
      </ElFormItem>
      <ElFormItem label="值类型" prop="valueType">
        <ElInput v-model="formData.valueType" placeholder="请输入值类型（String/Number/Boolean）" />
      </ElFormItem>
      <ElFormItem label="配置值" prop="configValue">
        <ElInput v-model="formData.configValue" type="textarea" :rows="2" placeholder="请输入配置值" />
      </ElFormItem>
      <ElFormItem label="默认值" prop="defaultValue">
        <ElInput v-model="formData.defaultValue" type="textarea" :rows="2" placeholder="请输入默认值" />
      </ElFormItem>
      <ElFormItem label="排序" prop="sortOrder">
        <ElInputNumber v-model="formData.sortOrder" :min="0" :max="999" />
      </ElFormItem>
      <ElFormItem label="是否公开" prop="isPublic">
        <ElRadioGroup v-model="formData.isPublic">
          <ElRadio :value="1">公开</ElRadio>
          <ElRadio :value="0">私有</ElRadio>
        </ElRadioGroup>
      </ElFormItem>
      <ElFormItem label="描述">
        <ElInput v-model="formData.description" type="textarea" :rows="2" placeholder="请输入描述" />
      </ElFormItem>
      <ElFormItem label="状态" prop="status">
        <ElRadioGroup v-model="formData.status">
          <ElRadio value="1">启用</ElRadio>
          <ElRadio value="0">禁用</ElRadio>
        </ElRadioGroup>
      </ElFormItem>
    </ElForm>
  </Modal>
</template>