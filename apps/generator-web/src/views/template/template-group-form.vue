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
import { $t } from '@ydsz/locales';

import {
  YdButton,
  YdDialog,
  YdDialogContent,
  YdDialogFooter,
  YdDialogHeader,
  YdDialogTitle,
  YdInput,
  YdForm,
  YdFormItem,
} from '@ydsz-core/ydsz-ui';

defineOptions({ name: 'TemplateGroupForm' });

defineProps<{
  visible: boolean;
}>();

const emit = defineEmits<{
  'update:visible': [value: boolean];
  submit: [data: { name: string; description: string; sort?: number }];
}>();

const formRef = ref();

const form = reactive({
  name: '',
  description: '',
  sort: 0,
});

const rules = {
  name: [{ required: true, message: () => $t('template.groupNamePlaceholder'), trigger: 'blur' }],
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
        <YdDialogTitle>{{ $t('template.groupFormTitle') }}</YdDialogTitle>
      </YdDialogHeader>
      <YdForm ref="formRef" :model="form" :rules="rules" label-width="100px">
        <YdFormItem :label="$t('template.groupName')" prop="name">
          <YdInput v-model="form.name" :placeholder="$t('template.groupNameHint')" />
        </YdFormItem>
        <YdFormItem :label="$t('template.groupDescription')">
          <YdInput
            v-model="form.description"
            :placeholder="$t('template.groupDescriptionPlaceholder')"
          />
        </YdFormItem>
        <YdFormItem :label="$t('template.groupSort')">
          <YdInput v-model="form.sort" type="number" :min="0" />
        </YdFormItem>
      </YdForm>
      <YdDialogFooter>
        <YdButton variant="secondary" @click="handleClose">
          {{ $t('template.groupFormCancel') }}
        </YdButton>
        <YdButton @click="handleSubmit">{{ $t('template.groupFormConfirm') }}</YdButton>
      </YdDialogFooter>
    </YdDialogContent>
  </YdDialog>
</template>
