<script setup lang="ts">
/**
 * YdDataTableHeadCell —— 数据表格表头单元格。
 *
 * <p>聚合三件事：排序触发（点击 / 键盘，Shift+点击追加多列排序）、列宽拖拽手柄、
 * 列顺序拖拽起点，并把表头文本交给 `#header-{columnKey}` 插槽覆盖。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\components\data-table\YdDataTableHeadCell.vue
 * @author ydsz-team
 * @since 5.7.0
 */
import { computed } from 'vue';

import { YdTableHead } from '../table';
import { useLocale } from '../../locale/useLocale';

import type { CSSProperties } from 'vue';
import type { SortOrder } from '../../composables/use-table-data';

defineOptions({ name: 'YdDataTableHeadCell' });

interface Props {
  /** 列 key */
  columnKey: string;
  /** 表头文本 */
  label: string;
  /** 是否可排序（渲染 button 并响应点击） */
  sortable?: boolean;
  /** 当前排序方向 */
  order?: SortOrder | null;
  /** 多列排序次序（1 起；单列排序为 null） */
  rank?: number | null;
  /** 是否可拖拽列宽 */
  resizable?: boolean;
  /** 是否可拖拽列顺序 */
  reorderable?: boolean;
  /** 拖拽时的列下标 */
  dragIndex?: number;
  /** 该列是否正在拖拽宽度 */
  resizing?: boolean;
  /** 对齐方式 */
  align?: 'left' | 'center' | 'right';
  /** 附加类名（sticky / relative） */
  headClass?: string;
  /** 附加样式（列宽 / 固定偏移） */
  headStyle?: CSSProperties;
  /** 跨越的表头行数（多级表头下的固定列需单列纵向合并） */
  rowspan?: number;
}

const props = withDefaults(defineProps<Props>(), {
  align: 'left',
  dragIndex: 0,
  headClass: '',
  order: null,
  rank: null,
  resizable: false,
  sortable: false,
});

const emit = defineEmits<{
  sort: [columnKey: string, additive: boolean];
  'resize-start': [columnKey: string, event: PointerEvent];
  'drag-start': [event: PointerEvent, index: number];
}>();

const { t } = useLocale();

/** WAI-ARIA 列头排序状态 */
const ariaSort = computed<string | undefined>(() => {
  if (!props.sortable) return undefined;
  if (props.order === 'asc') return 'ascending';
  if (props.order === 'desc') return 'descending';
  return 'none';
});

/** 排序方向图标 */
const orderIcon = computed<string>(() => {
  if (props.order === 'asc') return '↑';
  if (props.order === 'desc') return '↓';
  return '';
});

/** 表头按钮的可访问名称：让读屏用户知道点击后的排序方向 */
const sortHint = computed<string>(() => {
  if (props.order === 'asc') return `${props.label} ${t('table.sort.desc')}`;
  return `${props.label} ${t('table.sort.asc')}`;
});

/**
 * 触发排序：修饰键（Shift / Meta / Ctrl）表示追加到多列排序链。
 *
 * @param event - 鼠标点击事件
 * @returns 无
 */
function handleClick(event: MouseEvent): void {
  emit('sort', props.columnKey, event.shiftKey || event.metaKey || event.ctrlKey);
}

/**
 * 列顺序拖拽起点（仅在启用 reorderable 时转发）。
 *
 * @param event - 原生指针事件
 * @returns 无
 */
function handlePointerdown(event: PointerEvent): void {
  if (!props.reorderable) return;
  emit('drag-start', event, props.dragIndex);
}

/**
 * 列宽拖拽起点：阻止冒泡，避免同一次按下同时触发列顺序拖拽。
 *
 * @param event - 原生指针事件
 * @returns 无
 */
function handleResizeStart(event: PointerEvent): void {
  event.stopPropagation();
  emit('resize-start', props.columnKey, event);
}
</script>

<template>
  <YdTableHead
    :align="props.align"
    :class="props.headClass"
    :style="props.headStyle"
    :aria-sort="ariaSort"
    :rowspan="props.rowspan"
    :data-col-drag="props.reorderable ? props.dragIndex : undefined"
    @pointerdown="handlePointerdown"
  >
    <button
      v-if="props.sortable"
      type="button"
      class="inline-flex items-center gap-1 text-inherit"
      :aria-label="sortHint"
      @click="handleClick"
    >
      <slot :column-key="props.columnKey" :label="props.label" :order="props.order" :rank="props.rank">
        {{ props.label }}
      </slot>
      <span v-if="orderIcon" class="text-xs text-muted-foreground/50">{{ orderIcon }}</span>
      <span
        v-if="props.rank"
        class="rounded bg-muted px-1 text-[10px] leading-4 text-muted-foreground"
      >
        {{ props.rank }}
      </span>
    </button>
    <span v-else class="inline-flex items-center gap-1">
      <slot :column-key="props.columnKey" :label="props.label" :order="null" :rank="null">
        {{ props.label }}
      </slot>
    </span>
    <div
      v-if="props.resizable"
      class="yd-resize-handle absolute right-0 top-0 h-full w-1 cursor-col-resize select-none hover:bg-primary/30"
      :class="{ 'bg-primary/50': props.resizing }"
      role="separator"
      :aria-label="`${t('table.resizeColumn')} ${props.label}`"
      @pointerdown="handleResizeStart"
    />
  </YdTableHead>
</template>

<style scoped>
/* 列宽拖拽手柄 */
.yd-resize-handle {
  touch-action: none;
  user-select: none;
}
</style>
