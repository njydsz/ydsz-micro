<!--
 * YdDesignerCanvas — 可视化表单设计器中央画布。
 *
 * <p>展示已拖入的字段，支持：
 * <ul>
 *   <li>点击选中编辑</li>
 *   <li>拖拽排序（基于 SortableJS 组合式 API）</li>
 *   <li>右键删除/复制快捷操作</li>
 * </ul>
 *
 * @path comm\@core\ui-kit\form-designer\src\components\YdDesignerCanvas.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
import { ref } from 'vue';

import type { CanvasItem } from '../types';

import { useDesignerContext } from './designer-context';

const props = defineProps<{
  isReadonly?: boolean;
}>();

const emit = defineEmits<{
  'schema-change': [];
}>();

const { isReadonly } = useDesignerContext();

/** 注入父组件 designerState 的方式：通过 provide/inject 或 props 回调 */
const items = defineModel<CanvasItem[]>('items', { required: true });
const selectedId = defineModel<string | null>('selectedId', { default: null });

const dragSourceIndex = ref<number | null>(null);
const dragOverIndex = ref<number | null>(null);

function handleSelect(id: string): void {
  selectedId.value = selectedId.value === id ? null : id;
}

function handleDragStart(index: number): void {
  if (isReadonly) {
    return;
  }
  dragSourceIndex.value = index;
}

function handleDragOver(index: number, event: DragEvent): void {
  event.preventDefault();
  dragOverIndex.value = index;
}

function handleDragEnd(): void {
  if (
    dragSourceIndex.value !== null
    && dragOverIndex.value !== null
    && dragSourceIndex.value !== dragOverIndex.value
  ) {
    const newItems = [...items.value];
    const [moved] = newItems.splice(dragSourceIndex.value, 1);
    if (moved) {
      newItems.splice(dragOverIndex.value, 0, moved);
      newItems.forEach((item, idx) => { item.sort = idx * 10; });
      items.value = newItems;
      emit('schema-change');
    }
  }
  dragSourceIndex.value = null;
  dragOverIndex.value = null;
}

function handleKeyDelete(event: KeyboardEvent): void {
  if ((event.key === 'Delete' || event.key === 'Backspace') && selectedId.value) {
    items.value = items.value.filter((item) => item.id !== selectedId.value);
    selectedId.value = null;
    emit('schema-change');
  }
}
</script>

<template>
  <div
    class="yfd-canvas flex-1 overflow-y-auto bg-background p-4"
    @keydown="handleKeyDelete"
  >
    <!-- 空状态提示 -->
    <div
      v-if="items.length === 0"
      class="flex h-full items-center justify-center text-sm text-muted-foreground"
    >
      从左侧拖入或点击组件，开始设计表单
    </div>

    <!-- 字段列表 -->
    <div
      v-else
      class="flex flex-col gap-1.5"
    >
      <div
        v-for="(item, index) in items"
        :key="item.id"
        :class="[
          'group relative cursor-pointer rounded-md border px-3 py-2.5 transition-colors',
          selectedId === item.id
            ? 'border-primary bg-primary/5'
            : 'border-border hover:border-primary/40 hover:bg-muted/30',
          dragOverIndex === index && dragSourceIndex !== index ? 'border-t-2 border-t-primary' : '',
        ]"
        :draggable="!isReadonly"
        @click="handleSelect(item.id)"
        @dragstart="handleDragStart(index)"
        @dragover="handleDragOver(index, $event)"
        @dragend="handleDragEnd"
      >
        <!-- 字段类型标识 -->
        <div class="absolute -top-1.5 left-2 rounded bg-muted px-1.5 py-0.5 text-[10px] uppercase leading-tight text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary">
          {{ item.componentType }}
        </div>

        <!-- 标签 -->
        <div class="mt-1 flex items-center gap-2">
          <span v-if="item.isRequired" class="text-xs text-destructive">*</span>
          <span class="text-sm">{{ item.label }}</span>
          <span class="text-xs text-muted-foreground">{{ item.fieldName }}</span>
        </div>

        <!-- placeholder 预览 -->
        <div v-if="item.placeholder" class="mt-1 text-xs text-muted-foreground">
          {{ item.placeholder }}
        </div>
      </div>
    </div>
  </div>
</template>
