<!--
 * 规则定义编辑表单组件
 *
 * @path apps\literule-web\src\views\rule\rule-form.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
/**
 * 规则定义（表单组件）
 * <p>规则定义的创建/编辑表单，数据提交到后端契约 API ruleAdmin#save。
 *
 * @author ydsz-team
 * @since 1.0.0
 */
import type { RuleDefinitionVO } from '#/api/models';
import { useYDSZModal } from '@ydsz/common-ui';
import { ElMessage } from 'element-plus';
import { computed, reactive, ref } from 'vue';
import { save } from '#/api/ruleAdmin';
const emit = defineEmits<{ success: [] }>();
const formRef = ref();
const isEdit = ref(false);
/** 规则表单数据（映射 RuleDefinition 的可编辑字段） */
interface RuleFormData {
  code: string;
  name: string;
  category: string;
  description: string;
  conditionExpression: string;
  priority: number;
  enabled: boolean;
}
const formData = reactive<RuleFormData>({
  code: '',
  name: '',
  category: '',
  description: '',
  conditionExpression: '',
  priority: 0,
  enabled: true,
});
const rules = {
  name: [{ required: true, message: '请输入规则名称', trigger: 'blur' }],
};
const [Modal, modalApi] = useYDSZModal({
  onOpenChange: (isOpen: boolean) => {
    if (!isOpen) return;
    const data = modalApi.getData<{ record?: RuleDefinitionVO }>();
    if (data?.record) {
      isEdit.value = true;
      Object.assign(formData, {
        code: data.record.ruleCode ?? '',
        name: data.record.ruleName ?? '',
        category: data.record.category ?? '',
        description: data.record.description ?? '',
        conditionExpression: data.record.conditionExpression ?? '',
        priority: data.record.priority ?? 0,
        enabled: data.record.enabled ?? true,
      });
    } else {
      isEdit.value = false;
      Object.assign(formData, {
        code: '',
        name: '',
        category: '',
        description: '',
        conditionExpression: '',
        priority: 0,
        enabled: true,
      });
    }
  },
  onConfirm: async () => {
    try { await formRef.value?.validate(); } catch { return; }
    modalApi.lock();
    try {
      await save({ changeDesc: isEdit.value ? '更新规则' : '创建规则' }, formData);
      ElMessage.success(isEdit.value ? '更新成功' : '创建成功');
      emit('success');
      modalApi.close();
    } finally { modalApi.unlock(); }
  },
});
const title = computed(() => (isEdit.value ? '编辑规则' : '新增规则'));
</script>
<template>
  <Modal :title="title">
    <ElForm ref="formRef" :model="formData" :rules="rules" label-width="100px" label-position="right">
      <ElFormItem label="规则编码" prop="code">
        <ElInput v-model="formData.code" placeholder="请输入规则编码" :disabled="isEdit" />
      </ElFormItem>
      <ElFormItem label="规则名称" prop="name">
        <ElInput v-model="formData.name" placeholder="请输入规则名称" />
      </ElFormItem>
      <ElFormItem label="分类" prop="category">
        <ElInput v-model="formData.category" placeholder="请输入分类" />
      </ElFormItem>
      <ElFormItem label="优先级">
        <ElInputNumber v-model="formData.priority" :min="0" :max="999" />
      </ElFormItem>
      <ElFormItem label="条件表达式">
        <ElInput v-model="formData.conditionExpression" type="textarea" :rows="3" placeholder="请输入条件表达式" />
      </ElFormItem>
      <ElFormItem label="描述">
        <ElInput v-model="formData.description" type="textarea" :rows="2" placeholder="请输入描述" />
      </ElFormItem>
      <ElFormItem label="启用">
        <ElSwitch v-model="formData.enabled" />
      </ElFormItem>
    </ElForm>
  </Modal>
</template>