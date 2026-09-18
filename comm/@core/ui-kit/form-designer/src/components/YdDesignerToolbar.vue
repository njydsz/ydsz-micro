<!--
 * YdDesignerToolbar — 可视化表单设计器顶部工具栏。
 *
 * <p>提供撤销/重做/预览/提交/清空操作入口。
 *
 * @path comm\@core\ui-kit\form-designer\src\components\YdDesignerToolbar.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
defineProps<{
  canUndo?: boolean;
  canRedo?: boolean;
  itemCount?: number;
  showPreview?: boolean;
  isReadonly?: boolean;
}>();

const emit = defineEmits<{
  undo: [];
  redo: [];
  preview: [];
  submit: [];
  clear: [];
}>();
</script>

<template>
  <div class="yfd-toolbar flex items-center justify-between border-b px-4 py-2">
    <div class="flex items-center gap-2">
      <!-- 撤销 / 重做 -->
      <button
        type="button"
        :disabled="!canUndo"
        class="rounded p-1.5 text-sm text-foreground hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
        aria-label="撤销"
        @click="emit('undo')"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clip-rule="evenodd" />
        </svg>
      </button>
      <button
        type="button"
        :disabled="!canRedo"
        class="rounded p-1.5 text-sm text-foreground hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
        aria-label="重做"
        @click="emit('redo')"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clip-rule="evenodd" />
        </svg>
      </button>

      <span class="ml-2 text-xs text-muted-foreground">{{ itemCount }} 个字段</span>
    </div>

    <div class="flex items-center gap-2">
      <button
        type="button"
        :disabled="isReadonly"
        class="rounded px-3 py-1.5 text-xs hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
        @click="emit('clear')"
      >
        清空
      </button>

      <button
        v-if="showPreview"
        type="button"
        class="rounded px-3 py-1.5 text-xs hover:bg-muted"
        @click="emit('preview')"
      >
        预览
      </button>

      <button
        type="button"
        :disabled="isReadonly || itemCount === 0"
        class="rounded bg-primary px-3 py-1.5 text-xs text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-40"
        @click="emit('submit')"
      >
        生成 Schema
      </button>
    </div>
  </div>
</template>
