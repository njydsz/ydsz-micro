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
import { useYDSZModal } from '@ydsz/common-ui';
import { ElForm, ElFormItem, ElInput, ElMessage, ElRadio, ElRadioGroup } from 'element-plus';
import { computed, reactive, ref } from 'vue';

import { save, update } from '#/api/dict';
import type { DictTypeVO } from '#/api/models';

const emit = defineEmits<{ success: [] }>();

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
  typeCode: [{ required: true, message: '请输入类型编码', trigger: 'blur' }],
  typeName: [{ required: true, message: '请输入类型名称', trigger: 'blur' }],
};

const [Modal, modalApi] = useYDSZModal({
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

const title = computed(() => (isEdit.value ? '编辑字典类型' : '新增字典类型'));
</script>

<template>
  <Modal :title="title">
    <ElForm ref="formRef" :model="formData" :rules="rules" label-width="100px" label-position="right">
      <ElFormItem label="类型编码" prop="typeCode">
        <ElInput v-model="formData.typeCode" placeholder="请输入类型编码" :disabled="isEdit" />
      </ElFormItem>
      <ElFormItem label="类型名称" prop="typeName">
        <ElInput v-model="formData.typeName" placeholder="请输入类型名称" />
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