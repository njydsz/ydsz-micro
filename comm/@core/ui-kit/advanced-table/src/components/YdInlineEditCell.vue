<!--
 * YdInlineEditCell — 可编辑单元格组件。
 *
 * <p>点击后切换到编辑态（输入框），回车保存 / Esc 取消。
 *
 * <p>使用方式：需与 useInlineEdit composable 配合使用。
 *
 * @path comm\@core\ui-kit\advanced-table\src\components\YdInlineEditCell.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
import { ref, watch } from 'vue';

const props = defineProps<{
  /** 显示值 */
  value: unknown;
  /** 是否正在编辑 */
  isEditing: boolean;
}>();

const emit = defineEmits<{
  edit: [];
  save: [value: unknown];
  cancel: [];
}>();

/** 编辑中的草稿值 */
const draft = ref<unknown>(props.value);

/** 当进入编辑态时初始化草稿 */
watch(() => props.isEditing, (editing) => {
  if (editing) {
    draft.value = props.value;
  }
});

/**
 * 触发保存。
 */
function handleSave(): void {
  emit('save', draft.value);
}

/**
 * 按下 Esc 取消。
 */
function handleKeydown(event: KeyboardEvent): void {
  if (event.key === 'Enter') {
    event.preventDefault();
    handleSave();
  } else if (event.key === 'Escape') {
    event.preventDefault();
    emit('cancel');
  }
}

/**
 * 失焦保存。
 */
function handleBlur(): void {
  handleSave();
}
</script>

<template>
  <div class="adt-inline-cell h-full w-full">
    <!-- 编辑态 -->
    <input
      v-if="isEditing"
      v-model="draft as string"
      type="text"
      autofocus
      class="h-full w-full rounded border border-primary bg-background px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
      @keydown="handleKeydown"
      @blur="handleBlur"
    />

    <!-- 展示态 -->
    <div
      v-else
      class="flex h-full w-full cursor-pointer items-center px-2 py-1 text-sm hover:bg-muted/40"
      tabindex="0"
      role="button"
      :aria-label="`双击编辑: ${String(value)}`"
      @dblclick="emit('edit')"
      @keydown.enter="emit('edit')"
    >
      {{ value ?? '-' }}
    </div>
  </div>
</template>
