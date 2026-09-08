<!--
 * 模板分组表单对话框
 *
 * <p>新建模板分组。
 *
 * @path apps/generator-web/src/views/template/template-group-form.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
/**
 * 模板分组表单组件。
 *
 * @author ydsz-team
 * @since 1.0.0
 */
import { reactive, ref } from 'vue';

import { ElDialog, ElForm, ElFormItem, ElInput, ElInputNumber } from 'element-plus';

defineOptions({ name: 'TemplateGroupForm' });

const props = defineProps<{
  visible: boolean;
}>();

const emit = defineEmits<{
  'update:visible': [value: boolean];
  submit: [data: { name: string; description: string; sortOrder?: number }];
}>();

const formRef = ref();

const form = reactive({
  name: '',
  description: '',
  sortOrder: 0,
});

const rules = {
  name: [{ required: true, message: '请输入分组名称', trigger: 'blur' }],
};

function handleClose() {
  emit('update:visible', false);
}

async function handleSubmit() {
  await formRef.value?.validate();
  emit('submit', { ...form });
  emit('update:visible', false);
}
</script>

<template>
  <ElDialog
    :model-value="visible"
    title="新建模板分组"
    width="450px"
    @update:model-value="handleClose"
  >
    <ElForm ref="formRef" :model="form" :rules="rules" label-width="100px">
      <ElFormItem label="分组名称" prop="name">
        <ElInput v-model="form.name" placeholder="如 mybatis-plus、mongodb" />
      </ElFormItem>
      <ElFormItem label="描述">
        <ElInput v-model="form.description" placeholder="分组用途说明" />
      </ElFormItem>
      <ElFormItem label="排序">
        <ElInputNumber v-model="form.sortOrder" :min="0" />
      </ElFormItem>
    </ElForm>
    <template #footer>
      <ElButton @click="handleClose">取消</ElButton>
      <ElButton type="primary" @click="handleSubmit">确定</ElButton>
    </template>
  </ElDialog>
</template>
