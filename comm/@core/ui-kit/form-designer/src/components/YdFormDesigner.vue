<!--
 * YdFormDesigner — 可视化表单设计器。
 *
 * <p>拖拽式表单搭建器，三大区域：左侧组件面板 + 中央画布 + 右侧属性面板。
 *
 * @path comm\@core\ui-kit\form-designer\src\components\YdFormDesigner.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts">
export interface YdFormDesignerProps {
  /** 初始 Schema */
  initialSchema?: import('../types').DesignerSchema;
  /** 是否显示预览按钮 */
  showPreview?: boolean;
  /** 是否只读模式 */
  isReadonly?: boolean;
}
</script>

<script lang="ts" setup>
import type { DesignerSchema } from '../types';

import { useDesignerState } from '../composables/use-designer-state';
import { YdDesignerCanvas } from './YdDesignerCanvas.vue';
import { YdDesignerPalette } from './YdDesignerPalette.vue';
import { YdDesignerPropertyPanel } from './YdDesignerPropertyPanel.vue';
import { YdDesignerToolbar } from './YdDesignerToolbar.vue';

const props = withDefaults(defineProps<YdFormDesignerProps>(), {
  showPreview: true,
  isReadonly: false,
});

const emit = defineEmits<{
  'schema-change': [schema: DesignerSchema];
  'submit': [schema: DesignerSchema];
  'preview': [schema: DesignerSchema];
}>();

const designer = useDesignerState(props.initialSchema);

/**
 * 处理 Schema 变更。
 */
function handleSchemaChange(): void {
  emit('schema-change', designer.exportSchema());
}

/**
 * 处理预览。
 */
function handlePreview(): void {
  emit('preview', designer.exportSchema());
}

/**
 * 处理提交。
 */
function handleSubmit(): void {
  emit('submit', designer.exportSchema());
}
</script>

<template>
  <div class="yfd-container flex h-full flex-col overflow-hidden rounded-lg border bg-background">
    <!-- 工具栏 -->
    <YdDesignerToolbar
      :can-undo="designer.canUndo.value"
      :can-redo="designer.canRedo.value"
      :item-count="designer.itemCount.value"
      :show-preview="showPreview"
      :is-readonly="isReadonly"
      @undo="designer.undo(); handleSchemaChange()"
      @redo="designer.redo(); handleSchemaChange()"
      @preview="handlePreview"
      @submit="handleSubmit"
      @clear="designer.clearAll(); handleSchemaChange()"
    />

    <!-- 主体三栏布局 -->
    <div class="yfd-body flex flex-1 overflow-hidden">
      <!-- 左侧：组件面板 -->
      <YdDesignerPalette
        :is-readonly="isReadonly"
        @add-component="(meta) => { designer.addItem(meta); handleSchemaChange(); }"
      />

      <!-- 中央：画布 -->
      <YdDesignerCanvas
        v-model:items="designer.schema.value.items"
        v-model:selected-id="designer.selectedId.value"
        :is-readonly="isReadonly"
        @schema-change="handleSchemaChange"
      />

      <!-- 右侧：属性面板 -->
      <YdDesignerPropertyPanel
        v-model:selected-item="designer.selectedItem.value"
        :is-readonly="isReadonly"
        @update-item="(id, updates) => { designer.updateItem(id, updates); handleSchemaChange(); }"
      />
    </div>
  </div>
</template>
