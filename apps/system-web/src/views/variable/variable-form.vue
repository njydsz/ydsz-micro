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
import { useYDSZModal } from '@ydsz/common-ui';
import { ElForm, ElFormItem, ElInput, ElMessage, ElRadio, ElRadioGroup } from 'element-plus';
import { computed, reactive, ref } from 'vue';

import { save, update } from '#/api/variable';
import type { VariableVO } from '#/api/models';

const emit = defineEmits<{ success: [] }>();

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
  variableKey: [{ required: true, message: '请输入变量键', trigger: 'blur' }],
};

const [Modal, modalApi] = useYDSZModal({
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

const title = computed(() => (isEdit.value ? '编辑系统变量' : '新增系统变量'));
</script>

<template>
  <Modal :title="title">
    <ElForm ref="formRef" :model="formData" :rules="rules" label-width="100px" label-position="right">
      <ElFormItem label="变量键" prop="variableKey">
        <ElInput v-model="formData.variableKey" placeholder="请输入变量键" :disabled="isEdit" />
      </ElFormItem>
      <ElFormItem label="值类型" prop="valueType">
        <ElInput v-model="formData.valueType" placeholder="请输入值类型（String/Number/Boolean）" />
      </ElFormItem>
      <ElFormItem label="变量值" prop="variableValue">
        <ElInput v-model="formData.variableValue" type="textarea" :rows="2" placeholder="请输入变量值" />
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