<!--
 * YdDesignerPalette — 可视化表单设计器左侧组件面板。
 *
 * <p>分「基础控件 / 高级控件 / 布局控件」三组，每组内组件可拖入画布。
 *
 * @path comm\@core\ui-kit\form-designer\src\components\YdDesignerPalette.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
import type { DesignerComponentMeta } from '../types';

import {
  ALL_PALETTE_COMPONENTS,
  COMPONENT_GROUPS,
} from '../palette';

defineProps<{
  /** 是否只读模式（只读时禁用拖拽添加） */
  isReadonly?: boolean;
}>();

const emit = defineEmits<{
  'add-component': [meta: DesignerComponentMeta];
}>();

/**
 * 处理组件项点击 — 非只读模式下直接加入画布。
 */
function handleItemClick(meta: DesignerComponentMeta): void {
  emit('add-component', meta);
}
</script>

<template>
  <div class="yfd-palette flex w-56 flex-shrink-0 flex-col gap-2 overflow-y-auto border-r bg-muted/20 p-3">
    <h3 class="text-xs font-semibold text-muted-foreground uppercase">组件面板</h3>

    <div
      v-for="group in COMPONENT_GROUPS"
      :key="group.key"
      class="flex flex-col gap-1"
    >
      <h4 class="mb-1 text-xs font-medium text-foreground">
        {{ group.label }}
      </h4>

      <div class="grid grid-cols-2 gap-1">
        <button
          v-for="comp in ALL_PALETTE_COMPONENTS.filter((c) => c.group === group.key)"
          :key="comp.componentType"
          type="button"
          :disabled="isReadonly"
          class="flex items-center gap-1.5 rounded border border-transparent bg-background px-2 py-1.5 text-xs text-foreground transition-colors hover:border-primary/30 hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-50"
          @click="handleItemClick(comp)"
        >
          <svg class="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" aria-hidden="true">
            <circle cx="10" cy="10" r="8" fill="none" stroke="currentColor" stroke-width="1.5" />
          </svg>
          <span class="truncate">{{ comp.label }}</span>
        </button>
      </div>
    </div>
  </div>
</template>
