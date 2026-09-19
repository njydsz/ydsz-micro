<!--
 * 模板编辑对话框
 *
 * <p>编辑模板文件内容（Velocity 语法）。
 *
 * @path apps/generator-web/src/views/template/template-form.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
/**
 * 模板编辑组件。
 *
 * <p>基于 textarea 编辑 Velocity 模板内容，预留语法高亮扩展。
 *
 * @author ydsz-team
 * @since 1.0.0
 */
import { ref, watch } from 'vue';

import { YdButton, YdDialog, YdDialogContent, YdDialogFooter, YdDialogHeader, YdDialogTitle } from '@ydsz-core/ydsz-ui';

import type { GenTemplate } from '#/api/models';

defineOptions({ name: 'TemplateForm' });

const props = defineProps<{
  visible: boolean;
  template: GenTemplate | null;
}>();

const emit = defineEmits<{
  'update:visible': [value: boolean];
  save: [data: { id: number; content: string }];
}>();

const content = ref('');

watch(
  () => props.visible,
  (val) => {
    if (val && props.template) {
      content.value = props.template.content ?? '';
    }
  },
);

function handleClose() {
  emit('update:visible', false);
}

function handleSave() {
  if (!props.template?.id) return;
  emit('save', { id: props.template.id, content: content.value });
}
</script>

<template>
  <YdDialog :open="visible" @update:open="handleClose">
    <YdDialogContent style="max-width: 70%">
      <YdDialogHeader>
        <YdDialogTitle>编辑模板 - {{ template?.fileName ?? '' }}</YdDialogTitle>
      </YdDialogHeader>
      <div class="mb-2 text-xs text-gray-500">
        文件路径: {{ template?.parentPath || '/' }}{{ template?.fileName }}
      </div>
      <textarea
        v-model="content"
        class="w-full border rounded p-3 font-mono text-xs"
        style="height: 60vh; resize: none; tab-size: 2"
        spellcheck="false"
      />
      <YdDialogFooter>
        <YdButton variant="secondary" @click="handleClose">取消</YdButton>
        <YdButton @click="handleSave">保存</YdButton>
      </YdDialogFooter>
    </YdDialogContent>
  </YdDialog>
</template>
