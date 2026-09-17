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

import {
  YdButtonBase,
  YdDialog,
  YdDialogContent,
  YdDialogFooter,
  YdDialogHeader,
  YdDialogTitle,
  YdInput,
} from '@ydsz-core/ydsz-ui';
import { YdForm, YdFormItem } from '@ydsz-core/ydsz-ui';

defineOptions({ name: 'TemplateGroupForm' });

defineProps<{
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
  <YdDialog :open="visible" @update:open="handleClose">
    <YdDialogContent>
      <YdDialogHeader>
        <YdDialogTitle>新建模板分组</YdDialogTitle>
      </YdDialogHeader>
      <YdForm ref="formRef" :model="form" :rules="rules" label-width="100px">
        <YdFormItem label="分组名称" prop="name">
          <YdInput v-model="form.name" placeholder="如 mybatis-plus、mongodb" />
        </YdFormItem>
        <YdFormItem label="描述">
          <YdInput v-model="form.description" placeholder="分组用途说明" />
        </YdFormItem>
        <YdFormItem label="排序">
          <YdInput v-model="form.sortOrder" type="number" :min="0" />
        </YdFormItem>
      </YdForm>
      <YdDialogFooter>
        <YdButtonBase variant="secondary" @click="handleClose">取消</YdButtonBase>
        <YdButtonBase @click="handleSubmit">确定</YdButtonBase>
      </YdDialogFooter>
    </YdDialogContent>
  </YdDialog>
</template>
