<!--
 * YdColumnChooser —— 表格列显隐配置面板。
 *
 * <p>以 Popover 形式展示全部可隐藏列的 checkbox 列表，提供：
 *  - 单列勾选切换
 *  - 全选 / 全不选 / 重置 按钮
 *  - 受控 / 非受控两种模式
 *
 * <p>通常放置于表格工具栏「列设置」按钮的弹出层中。
 *
 * @path comm/@core/ui-kit/ydsz-ui/src/components/data-table/YdColumnChooser.vue
 * @author ydsz-team
 * @since 26.10.30
-->
<script lang="ts" setup>
import { computed } from 'vue';

import { useLocale } from '../../locale/useLocale';
import { useColumnChooser } from './use-column-chooser';
import type { ColumnVisibilityState, UseColumnChooserReturn } from './column-chooser-types';

/* ============================================================ */
/* Props                                                          */
/* ============================================================ */

interface Props {
  /** 完整列定义（label 用于展示，key 用于映射） */
  columns: Array<{ key: string; label: string; hideable?: boolean }>;
  /** 受控可见性 map（可选） */
  visibility?: Record<string, boolean>;
}

const props = defineProps<Props>();

/* ============================================================ */
/* Emit                                                           */
/* ============================================================ */

const emit = defineEmits<{
  /** 列可见性变化（visible-key 列表） */
  change: [visibleKeys: string[]];
  /** 重置为默认 */
  reset: [];
}>();

const { t } = useLocale();

/* ============================================================ */
/* Composable                                                     */
/* ============================================================ */

const chooser: UseColumnChooserReturn = useColumnChooser({
  allColumns: () => props.columns,
  controlledVisibility: undefined, // 非受控模式接管
});

/* ============================================================ */
/* 派生状态                                                       */
/* ============================================================ */

const visibleCount = computed(() =>
  chooser.states.value.filter((s: ColumnVisibilityState) => s.visible).length,
);

const totalHideable = computed(() =>
  chooser.states.value.filter((s: ColumnVisibilityState) => s.hideable).length,
);

/* ============================================================ */
/* 操作转发                                                       */
/* ============================================================ */

function handleToggle(key: string): void {
  chooser.toggle(key);
  emit('change', chooser.visibleKeys.value);
}

function handleShowAll(): void {
  chooser.showAll();
  emit('change', chooser.visibleKeys.value);
}

function handleReset(): void {
  chooser.reset();
  emit('change', chooser.visibleKeys.value);
  emit('reset');
}

defineExpose({
  ...chooser,
});
</script>

<template>
  <div class="flex w-56 flex-col gap-2 p-1" role="group" :aria-label="t('table.columnChooser')">
    <!-- 操作栏 -->
    <div class="flex items-center justify-between border-b border-border px-2 py-1.5">
      <span class="text-xs font-medium text-muted-foreground">
        {{ t('table.columnChooser') }}
      </span>
      <div class="flex gap-1">
        <button
          class="rounded px-1.5 py-0.5 text-xs text-primary hover:bg-accent"
          type="button"
          @click="handleShowAll"
        >
          {{ t('table.showAll') }}
        </button>
        <button
          class="rounded px-1.5 py-0.5 text-xs text-muted-foreground hover:bg-accent"
          type="button"
          @click="handleReset"
        >
          {{ t('table.reset') }}
        </button>
      </div>
    </div>

    <!-- 计数提示 -->
    <div class="px-2 text-xs text-muted-foreground">
      {{ visibleCount }} / {{ totalHideable }} {{ t('table.columns') }}
    </div>

    <!-- 列列表 -->
    <div class="flex max-h-64 flex-col gap-0.5 overflow-y-auto">
      <label
        v-for="col in chooser.states.value"
        :key="col.key"
        class="flex cursor-pointer items-center gap-2 rounded px-2 py-1 hover:bg-accent"
        :class="{ 'opacity-50': !col.hideable }"
      >
        <input
          type="checkbox"
          :checked="col.visible"
          :disabled="!col.hideable"
          class="size-4 rounded border-muted-foreground text-primary focus:ring-primary"
          @change="handleToggle(col.key)"
        />
        <span class="flex-1 truncate text-sm">{{ col.label }}</span>
      </label>
    </div>
  </div>
</template>
