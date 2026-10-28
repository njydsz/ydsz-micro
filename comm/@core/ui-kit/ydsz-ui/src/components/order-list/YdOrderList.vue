<script lang="ts" setup>
/**
 * OrderList 单列拖拽排序列表。
 *
 * 能力：
 * - 拖拽项重排序（HTML5 DnD API）
 * - 单选 + 控制栏（上移 / 下移 / 置顶 / 置底）
 * - 过滤（filter=true）
 *
 * @author ydsz-team
 * @since 1.0.0
 */
import {
  computed,
  ref,
  watch,
} from 'vue';

import { cn } from '@ydsz-core/shared/utils';
import { ChevronDown, ChevronUp, GripVertical, Search } from 'lucide-vue-next';

import { useLocale } from '../../locale/useLocale';

import type { OrderListEmits, OrderListProps } from './order-list-types';

defineOptions({ name: 'YdOrderList' });

const props = withDefaults(defineProps<OrderListProps>(), {
  dragdrop: false,
  filter: false,
  modelValue: () => [],
  optionLabel: undefined,
});

const emit = defineEmits<OrderListEmits>();

const { t } = useLocale();

// ---------------------------------------------------------------------------
// 内部状态
// ---------------------------------------------------------------------------

/** 过滤关键词 */
const query = ref('');
/** 当前选中项的索引 */
const selectedIndex = ref<number>(-1);

// ---------------------------------------------------------------------------
// 工具函数
// ---------------------------------------------------------------------------

/**
 * 获取项的显示文本。
 */
function getItemLabel(item: unknown): string {
  if (!item) return '';
  const record = item as Record<string, unknown>;
  if (props.optionLabel) {
    return String(record[props.optionLabel] ?? '');
  }
  const parts: string[] = [];
  for (const v of Object.values(record)) {
    if (v !== null && v !== undefined) {
      parts.push(String(v));
    }
  }
  return parts.join(' ');
}

// ---------------------------------------------------------------------------
// 派生数据
// ---------------------------------------------------------------------------

/** 当前数据列表 */
const items = computed(() => props.modelValue ?? []);

/** 过滤后显示 */
const filteredItems = computed(() => {
  if (!query.value.trim()) return items.value;
  const q = query.value.trim().toLowerCase();
  return items.value.filter((it) => getItemLabel(it).toLowerCase().includes(q));
});

/** 重排并发出事件 */
function reorder(fromIndex: number, toIndex: number): void {
  if (fromIndex < 0 || fromIndex >= items.value.length) return;
  if (toIndex < 0 || toIndex >= items.value.length) return;
  if (fromIndex === toIndex) return;

  const arr = [...items.value];
  const [moved] = arr.splice(fromIndex, 1);
  arr.splice(toIndex, 0, moved!);
  selectedIndex.value = toIndex;
  emit('update:modelValue', arr);
  emit('reorder', { value: arr, fromIndex, toIndex });
}

/** 上移 */
function moveUp(): void {
  if (selectedIndex.value <= 0) return;
  reorder(selectedIndex.value, selectedIndex.value - 1);
}

/** 下移 */
function moveDown(): void {
  if (selectedIndex.value < 0 || selectedIndex.value >= items.value.length - 1) return;
  reorder(selectedIndex.value, selectedIndex.value + 1);
}

/** 置顶 */
function moveToTop(): void {
  if (selectedIndex.value <= 0) return;
  reorder(selectedIndex.value, 0);
}

/** 置底 */
function moveToBottom(): void {
  const last = items.value.length - 1;
  if (selectedIndex.value < 0 || selectedIndex.value >= last) return;
  reorder(selectedIndex.value, last);
}

// ---------------------------------------------------------------------------
// 拖拽排序（HTML5 原生 DnD）
// ---------------------------------------------------------------------------

/** 拖拽起始索引 */
const dragFromIndex = ref<number>(-1);

function onDragStart(event: DragEvent, index: number): void {
  dragFromIndex.value = index;
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', String(index));
  }
}

function onDragOver(event: DragEvent, _index: number): void {
  event.preventDefault();
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'move';
  }
}

function onDrop(event: DragEvent, toIndex: number): void {
  const fromIndex = dragFromIndex.value;
  if (fromIndex < 0 || fromIndex === toIndex) return;
  reorder(fromIndex, toIndex);
  dragFromIndex.value = -1;
}

function onDragEnd(): void {
  dragFromIndex.value = -1;
}

// ---------------------------------------------------------------------------
// 选择项
// ---------------------------------------------------------------------------

function onSelectItem(index: number): void {
  selectedIndex.value = index;
}

// ---------------------------------------------------------------------------
// 同步外部 v-model
// ---------------------------------------------------------------------------

watch(
  () => props.modelValue,
  () => {
    // 确保选中索引不越界
    if (selectedIndex.value >= items.value.length) {
      selectedIndex.value = items.value.length - 1;
    }
  },
);

/** 按钮禁用状态 */
const isFirstSelected = computed(() => selectedIndex.value <= 0);
const isLastSelected = computed(
  () => selectedIndex.value < 0 || selectedIndex.value >= items.value.length - 1,
);
</script>

<template>
  <div
    :class="
      cn(
        'yd-orderlist flex flex-col gap-2 rounded-lg border border-neutral-200 bg-white p-2 dark:border-neutral-700',
        props.class,
      )
    "
    role="group"
    :aria-label="t('orderList.ariaLabel')"
  >
    <!-- 控制栏 -->
    <div class="flex flex-wrap items-center gap-1">
      <button
        type="button"
        :disabled="isFirstSelected"
        :title="t('orderList.moveToTop')"
        :aria-label="t('orderList.moveToTop')"
        class="order-btn"
        @click="moveToTop"
      >
        {{ t('orderList.moveToTop') }}
      </button>
      <button
        type="button"
        :disabled="isFirstSelected"
        :title="t('orderList.moveUp')"
        :aria-label="t('orderList.moveUp')"
        class="order-btn order-btn--icon"
        @click="moveUp"
      >
        <ChevronUp class="size-3.5" aria-hidden="true" />
      </button>
      <button
        type="button"
        :disabled="isLastSelected"
        :title="t('orderList.moveDown')"
        :aria-label="t('orderList.moveDown')"
        class="order-btn order-btn--icon"
        @click="moveDown"
      >
        <ChevronDown class="size-3.5" aria-hidden="true" />
      </button>
      <button
        type="button"
        :disabled="isLastSelected"
        :title="t('orderList.moveToBottom')"
        :aria-label="t('orderList.moveToBottom')"
        class="order-btn"
        @click="moveToBottom"
      >
        {{ t('orderList.moveToBottom') }}
      </button>

      <!-- 搜索（filter 模式） -->
      <div
        v-if="props.filter"
        class="relative ml-auto flex items-center"
      >
        <Search class="absolute left-2 size-3.5 text-neutral-400" aria-hidden="true" />
        <input
          v-model="query"
          type="text"
          :placeholder="t('orderList.filterPlaceholder')"
          class="h-7 w-40 rounded border border-neutral-200 bg-white pl-7 pr-2 text-xs text-neutral-800 outline-none placeholder:text-neutral-400 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-200"
        />
      </div>
    </div>

    <!-- 列表 -->
    <ul
      class="max-h-80 flex flex-col gap-0.5 overflow-y-auto"
      role="listbox"
      :aria-label="t('orderList.listAriaLabel')"
    >
      <li
        v-for="(item, index) in filteredItems"
        :key="getItemLabel(item) + index"
        :class="
          cn(
            'flex cursor-pointer items-center gap-2 rounded px-3 py-2 text-sm transition-colors',
            'hover:bg-neutral-100 dark:hover:bg-neutral-800',
            index === selectedIndex
              ? 'bg-primary/10 font-medium text-primary-700 dark:text-primary-300'
              : 'text-neutral-800 dark:text-neutral-200',
          )
        "
        :aria-selected="index === selectedIndex"
        :draggable="props.dragdrop"
        role="option"
        @click="onSelectItem(index)"
        @dragstart="onDragStart($event, index)"
        @dragover="onDragOver($event, index)"
        @drop="onDrop($event, index)"
        @dragend="onDragEnd"
      >
        <GripVertical
          v-if="props.dragdrop"
          class="size-4 shrink-0 text-neutral-400"
          aria-hidden="true"
        />
        <span class="truncate">{{ getItemLabel(item) }}</span>
      </li>
      <li
        v-if="filteredItems.length === 0"
        class="px-3 py-6 text-center text-sm text-neutral-400"
      >
        —
      </li>
    </ul>
  </div>
</template>

<style scoped>
.yd-orderlist {
  display: flex;
  flex-direction: column;
}

.order-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 28px;
  padding: 0 10px;
  border-radius: 9999px;
  background-color: #404040;
  /* neutral-700 */
  color: #ffffff;
  font-size: 12px;
  line-height: 1;
  transition: background-color 150ms ease, opacity 150ms ease;
  white-space: nowrap;
  flex-shrink: 0;
}

.order-btn--icon {
  width: 28px;
  padding: 0;
}

.order-btn:hover:not(:disabled) {
  background-color: #262626;
  /* neutral-800 */
}

.order-btn:active:not(:disabled) {
  background-color: #171717;
  /* neutral-900 */
}

.order-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
</style>
