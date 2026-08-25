<!--
 * 规则变量编辑表单组件
 *
 * @path apps\literule-web\src\views\variable\variable-form.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
/**
 * 规则变量（表单组件）
 * <p>规则变量的创建/编辑表单，数据提交到后端契约 API ruleVariableAdmin#save。
 *
 * @author ydsz-team
 * @since 1.0.0
 */
import type { VariableDefinitionVO } from '#/api/models';
import { useVbenModal } from '@ydsz/common-ui';
import { ElMessage } from 'element-plus';
import { computed, reactive, ref } from 'vue';
import { save } from '#/api/ruleVariableAdmin';
const emit = defineEmits<{ success: [] }>();
const formRef = ref();
const isEdit = ref(false);
/** 变量表单数据（映射 VariableDefinition 的可编辑字段） */
interface VariableFormData {
  name: string;
  type: string;
  category: string;
  description: string;
  required: boolean;
}
const formData = reactive<VariableFormData>({
  name: '',
  type: '',
  category: '',
  description: '',
  required: false,
});
const rules = {
  name: [{ required: true, message: '请输入变量名称', trigger: 'blur' }],
};
const [Modal, modalApi] = useVbenModal({
  onOpenChange: (isOpen: boolean) => {
    if (!isOpen) return;
    const data = modalApi.getData<{ record?: VariableDefinitionVO }>();
    if (data?.record) {
      isEdit.value = true;
      Object.assign(formData, {
        name: data.record.name ?? '',
        type: data.record.type ?? '',
        category: data.record.category ?? '',
        description: data.record.description ?? '',
        required: false,
      });
    } else {
      isEdit.value = false;
      Object.assign(formData, {
        name: '',
        type: '',
        category: '',
        description: '',
        required: false,
      });
    }
  },
  onConfirm: async () => {
    try { await formRef.value?.validate(); } catch { return; }
    modalApi.lock();
    try {
      await save(formData);
      ElMessage.success(isEdit.value ? '更新成功' : '创建成功');
      emit('success');
      modalApi.close();
    } finally { modalApi.unlock(); }
  },
});
const title = computed(() => (isEdit.value ? '编辑规则变量' : '新增规则变量'));
</script>
<template>
  <Modal :title="title">
    <ElForm ref="formRef" :model="formData" :rules="rules" label-width="100px" label-position="right">
      <ElFormItem label="变量名称" prop="name">
        <ElInput v-model="formData.name" placeholder="请输入变量名称" :disabled="isEdit" />
      </ElFormItem>
      <ElFormItem label="变量类型">
        <ElInput v-model="formData.type" placeholder="请输入变量类型（如 String/Number/Boolean）" />
      </ElFormItem>
      <ElFormItem label="分类">
        <ElInput v-model="formData.category" placeholder="请输入分类" />
      </ElFormItem>
      <ElFormItem label="描述">
        <ElInput v-model="formData.description" type="textarea" :rows="2" placeholder="请输入描述" />
      </ElFormItem>
      <ElFormItem label="必填">
        <ElSwitch v-model="formData.required" />
      </ElFormItem>
    </ElForm>
  </Modal>
</template>