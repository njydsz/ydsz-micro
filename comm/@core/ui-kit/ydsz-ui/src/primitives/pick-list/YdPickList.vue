<script lang="ts" setup>
/**
* PickList 双栏穿梭列表：source / target 两栏 + 中间控制按钮。
* 
 * 能力：
 * - 单选 / 多选（Ctrl / Shift + Click）
 * - 双击项在两侧穿梭
 * - 控件按钮：> < >> <<
 * - 过滤（filter=true）
 * - 拖拽重排序（dragdrop=true，HTML5 DnD）
 * - 响应式（responsive=true，窄屏上下排列）
* 
 * @path comm\@core\ui-kit\ydsz-ui\src\primitives\pick-list\YdPickList.vue
 * @author ydsz-team
 * @since 1.0.0
 */
import {
  computed,
  ref,
  watch,
} from 'vue';

import { cn } from '@ydsz-core/shared/utils';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  GripVertical,
  Search,
} from 'lucide-vue-next';

import { useComponentI18n } from '../../composables/use-component-i18n';

import type { PickListEmits, PickListProps } from './pick-list-types';

/** i18n 消息表 */
const pickListMessages = {
  zh: {
    pickList: {
      filterPlaceholder: '搜索',
      moveAllToSource: '全部移到左侧',
      moveAllToTarget: '全部移到右侧',
      moveToSource: '移到左侧',
      moveToTarget: '移到右侧',
      sourceHeader: '来源',
      targetHeader: '目标',
    },
  },
  en: {
    pickList: {
      filterPlaceholder: 'Search',
      moveAllToSource: 'Move all to source',
      moveAllToTarget: 'Move all to target',
      moveToSource: 'Move to source',
      moveToTarget: 'Move to target',
      sourceHeader: 'Source',
      targetHeader: 'Target',
    },
  },
};

defineOptions({ name: 'YdPickList' });

const props = withDefaults(defineProps<PickListProps>(), {
  dragdrop: false,
  filter: false,
  filterBy: undefined,
  modelValue: () => [[], []],
  optionLabel: undefined,
  optionValue: undefined,
  responsive: false,
  striped: false,
  sourceClass: undefined,
  sourceHeader: undefined,
  targetClass: undefined,
  targetHeader: undefined,
});

const emit = defineEmits<PickListEmits>();

const { t } = useComponentI18n({
  messages: pickListMessages,
});

// ---------------------------------------------------------------------------
// 内部状态
// ---------------------------------------------------------------------------

/** 左侧过滤关键词 */
const leftQuery = ref('');
/** 右侧过滤关键词 */
const rightQuery = ref('');
/** 左侧选中项的 value 集合 */
const leftChecked = ref<Set<unknown>>(new Set());
/** 右侧选中项的 value 集合 */
const rightChecked = ref<Set<unknown>>(new Set());

// ---------------------------------------------------------------------------
// 工具函数
// ---------------------------------------------------------------------------

/**
 * 获取项的唯一键。
 */
function getItemKey(item: unknown): unknown {
  if (props.optionValue) {
    return (item as Record<string, unknown>)[props.optionValue];
  }
  return item;
}

/**
 * 获取项的显示文本。
 */
function getItemLabel(item: unknown): string {
  if (!item) return '';
  const record = item as Record<string, unknown>;
  if (props.optionLabel) {
    return String(record[props.optionLabel] ?? '');
  }
  // 默认遍历所有字段 join
  const parts: string[] = [];
  for (const v of Object.values(record)) {
    if (v !== null && v !== undefined) {
      parts.push(String(v));
    }
  }
  return parts.join(' ');
}

/**
 * 过滤项。
 */
function filterItems(items: unknown[], query: string): unknown[] {
  if (!query.trim()) return items;
  const q = query.trim().toLowerCase();
  const field = props.filterBy;
  return items.filter((item) => {
    const record = item as Record<string, unknown>;
    if (field) {
      return String(record[field] ?? '').toLowerCase().includes(q);
    }
    return getItemLabel(item).toLowerCase().includes(q);
  });
}

// ---------------------------------------------------------------------------
// 派生数据
// ---------------------------------------------------------------------------

/** 当前源列表 */
const sourceItems = computed(() => props.modelValue?.[0] ?? []);
/** 当前目标列表 */
const targetItems = computed(() => props.modelValue?.[1] ?? []);

/** 左侧显示（过滤后） */
const filteredSource = computed(() => filterItems(sourceItems.value, leftQuery.value));
/** 右侧显示（过滤后） */
const filteredTarget = computed(() => filterItems(targetItems.value, rightQuery.value));

// ---------------------------------------------------------------------------
// 穿梭操作
// ---------------------------------------------------------------------------

/** 选中项 → 目标 */
function moveToTarget(): void {
  const keys = new Set(leftChecked.value);
  const items = sourceItems.value.filter((it) => keys.has(getItemKey(it)));
  if (items.length === 0) return;

  const newSource = sourceItems.value.filter((it) => !keys.has(getItemKey(it)));
  const newTarget = [...targetItems.value, ...items];
  leftChecked.value = new Set();
  emit('update:modelValue', [newSource, newTarget]);
  emit('move-to-target', { items });
}

/** 选中项 → 来源 */
function moveToSource(): void {
  const keys = new Set(rightChecked.value);
  const items = targetItems.value.filter((it) => keys.has(getItemKey(it)));
  if (items.length === 0) return;

  const newTarget = targetItems.value.filter((it) => !keys.has(getItemKey(it)));
  const newSource = [...sourceItems.value, ...items];
  rightChecked.value = new Set();
  emit('update:modelValue', [newSource, newTarget]);
  emit('move-to-source', { items });
}

/** 全部 → 目标 */
function moveAllToTarget(): void {
  const items = [...sourceItems.value];
  if (items.length === 0) return;
  const newTarget = [...targetItems.value, ...items];
  leftChecked.value = new Set();
  emit('update:modelValue', [[], newTarget]);
  emit('move-all-to-target', { items });
}

/** 全部 → 来源 */
function moveAllToSource(): void {
  const items = [...targetItems.value];
  if (items.length === 0) return;
  const newSource = [...sourceItems.value, ...items];
  rightChecked.value = new Set();
  emit('update:modelValue', [newSource, []]);
  emit('move-all-to-source', { items });
}

/** 双击单项 → 目标 */
function onSourceDblClick(item: unknown): void {
  const key = getItemKey(item);
  const items = [item];
  const newSource = sourceItems.value.filter((it) => getItemKey(it) !== key);
  const newTarget = [...targetItems.value, item];
  emit('update:modelValue', [newSource, newTarget]);
  emit('move-to-target', { items });
}

/** 双击单项 → 来源 */
function onTargetDblClick(item: unknown): void {
  const key = getItemKey(item);
  const items = [item];
  const newTarget = targetItems.value.filter((it) => getItemKey(it) !== key);
  const newSource = [...sourceItems.value, item];
  emit('update:modelValue', [newSource, newTarget]);
  emit('move-to-source', { items });
}

// ---------------------------------------------------------------------------
// 选择逻辑（Ctrl / Shift 多选）
// ---------------------------------------------------------------------------

/** 上一次点击的索引（Shift 范围选） */
let lastSourceClickIdx = -1;
let lastTargetClickIdx = -1;

/**
 * 处理左侧项点击。
 */
function onSourceItemClick(event: MouseEvent, item: unknown, index: number): void {
  const key = getItemKey(item);
  const newSet = new Set(leftChecked.value);
  if (event.shiftKey && lastSourceClickIdx >= 0) {
    const start = Math.min(lastSourceClickIdx, index);
    const end = Math.max(lastSourceClickIdx, index);
    for (let i = start; i <= end; i++) {
      newSet.add(getItemKey(filteredSource.value[i]!));
    }
  } else if (event.ctrlKey || event.metaKey) {
    if (newSet.has(key)) newSet.delete(key);
    else newSet.add(key);
    lastSourceClickIdx = index;
  } else {
    if (newSet.has(key) && newSet.size === 1) newSet.clear();
    else {
      newSet.clear();
      newSet.add(key);
    }
    lastSourceClickIdx = index;
  }
  leftChecked.value = newSet;
}

/**
 * 处理右侧项点击。
 */
function onTargetItemClick(event: MouseEvent, item: unknown, index: number): void {
  const key = getItemKey(item);
  const newSet = new Set(rightChecked.value);
  if (event.shiftKey && lastTargetClickIdx >= 0) {
    const start = Math.min(lastTargetClickIdx, index);
    const end = Math.max(lastTargetClickIdx, index);
    for (let i = start; i <= end; i++) {
      newSet.add(getItemKey(filteredTarget.value[i]!));
    }
  } else if (event.ctrlKey || event.metaKey) {
    if (newSet.has(key)) newSet.delete(key);
    else newSet.add(key);
    lastTargetClickIdx = index;
  } else {
    if (newSet.has(key) && newSet.size === 1) newSet.clear();
    else {
      newSet.clear();
      newSet.add(key);
    }
    lastTargetClickIdx = index;
  }
  rightChecked.value = newSet;
}

// ---------------------------------------------------------------------------
// 拖拽排序（source 列表内重排）
// ---------------------------------------------------------------------------

/** 拖拽起始索引 */
const dragFromIdx = ref<number>(-1);

function onDragStart(event: DragEvent, index: number): void {
  dragFromIdx.value = index;
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

function onDrop(event: DragEvent, toIndex: number, list: 'source' | 'target'): void {
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'move';
  }
  const fromIndex = dragFromIdx.value;
  if (fromIndex < 0 || fromIndex === toIndex) return;

  if (list === 'source') {
    const arr = [...sourceItems.value];
    const [moved] = arr.splice(fromIndex, 1);
    arr.splice(toIndex, 0, moved!);
    emit('update:modelValue', [arr, targetItems.value]);
    emit('reorder', { originalEvent: event, value: arr, fromIndex, toIndex });
  } else {
    const arr = [...targetItems.value];
    const [moved] = arr.splice(fromIndex, 1);
    arr.splice(toIndex, 0, moved!);
    emit('update:modelValue', [sourceItems.value, arr]);
    emit('reorder', { originalEvent: event, value: arr, fromIndex, toIndex });
  }
  dragFromIdx.value = -1;
}

function onDragEnd(): void {
  dragFromIdx.value = -1;
}

// ---------------------------------------------------------------------------
// 同步外部 v-model
// ---------------------------------------------------------------------------

watch(
  () => props.modelValue,
  (val) => {
    // 从已选 value 中清除不再存在的项（过滤后的列表）
    const srcKeys = new Set((val?.[0] ?? []).map((it) => getItemKey(it)));
    const tgtKeys = new Set((val?.[1] ?? []).map((it) => getItemKey(it)));
    leftChecked.value = new Set([...leftChecked.value].filter((k) => srcKeys.has(k)));
    rightChecked.value = new Set([...rightChecked.value].filter((k) => tgtKeys.has(k)));
  },
  { deep: true },
);

// ---------------------------------------------------------------------------
// 响应式布局 class
// ---------------------------------------------------------------------------

const layoutClass = computed(() =>
  props.responsive ? 'flex flex-col md:flex-row' : 'flex flex-row',
);

const panelClass = computed(() =>
  props.responsive ? 'w-full md:flex-1' : 'flex-1',
);

function isSourceChecked(item: unknown): boolean {
  return leftChecked.value.has(getItemKey(item));
}

function isTargetChecked(item: unknown): boolean {
  return rightChecked.value.has(getItemKey(item));
}
</script>

<template>
  <div
    :class="
      cn(
        'yd-picklist rounded-lg border border-neutral-200 bg-white dark:border-neutral-700',
        props.class,
      )
    "
    role="group"
    aria-label="双栏穿梭列表"
  >
    <!-- ===== 主布局区域 ===== -->
    <div :class="layoutClass" class="gap-2 p-2">
      <!-- === 左侧：Source 面板 === -->
      <div :class="[panelClass, props.sourceClass]" class="flex min-w-0 flex-col overflow-hidden">
        <!-- Header -->
        <div class="flex items-center justify-between border-b border-neutral-200 px-3 py-2 dark:border-neutral-700">
          <span class="text-sm font-medium text-neutral-800 dark:text-neutral-200">
            {{ props.sourceHeader ?? t('pickList.sourceHeader') }}
          </span>
          <span class="text-xs text-neutral-500">
            {{ leftChecked.size }}/{{ filteredSource.length }}
          </span>
        </div>

        <!-- Filter -->
        <div
          v-if="props.filter"
          class="flex items-center gap-1.5 border-b border-neutral-200 px-3 py-2 dark:border-neutral-700"
        >
          <Search class="size-3.5 shrink-0 text-neutral-400" aria-hidden="true" />
          <input
            v-model="leftQuery"
            type="text"
            :placeholder="t('pickList.filterPlaceholder')"
            class="w-full bg-transparent text-sm text-neutral-800 outline-none placeholder:text-neutral-400 dark:text-neutral-200"
          />
        </div>

        <!-- Items -->
        <ul
          class="max-h-80 flex-1 overflow-y-auto py-1"
          role="listbox"
          aria-multiselectable="true"
          :aria-label="props.sourceHeader ?? t('pickList.sourceHeader')"
        >
          <li
            v-for="(item, index) in filteredSource"
            :key="String(getItemKey(item))"
            :class="
              cn(
                'mx-1 flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm transition-colors',
                'hover:bg-neutral-100 dark:hover:bg-neutral-800',
                isSourceChecked(item) && 'bg-primary/10 text-primary-700 dark:text-primary-300',
                props.striped && index % 2 === 1 && 'bg-neutral-50 dark:bg-neutral-900/40',
              )
            "
            :aria-selected="isSourceChecked(item)"
            :aria-label="getItemLabel(item)"
            :draggable="props.dragdrop"
            role="option"
            @click="onSourceItemClick($event, item, index)"
            @dblclick="onSourceDblClick(item)"
            @dragstart="onDragStart($event, index)"
            @dragover="onDragOver($event, index)"
            @drop="onDrop($event, index, 'source')"
            @dragend="onDragEnd"
          >
            <GripVertical
              v-if="props.dragdrop"
              class="size-3.5 shrink-0 text-neutral-400"
              aria-hidden="true"
            />
            <span class="truncate">{{ getItemLabel(item) }}</span>
          </li>
          <li
            v-if="filteredSource.length === 0"
            class="px-3 py-6 text-center text-sm text-neutral-400"
          >
            —
          </li>
        </ul>
      </div>

      <!-- === 中间控制按钮栏 === -->
      <div
        :class="
          cn(
            'flex shrink-0 items-center justify-center gap-1',
            props.responsive ? 'flex-row md:flex-col' : 'flex-col',
          )
        "
      >
        <button
          type="button"
          :disabled="leftChecked.size === 0"
          :title="t('pickList.moveToTarget')"
          :aria-label="t('pickList.moveToTarget')"
          class="ctrl-btn"
          @click="moveToTarget"
        >
          <ChevronRight class="size-3.5" aria-hidden="true" />
        </button>
        <button
          type="button"
          :disabled="rightChecked.size === 0"
          :title="t('pickList.moveToSource')"
          :aria-label="t('pickList.moveToSource')"
          class="ctrl-btn"
          @click="moveToSource"
        >
          <ChevronLeft class="size-3.5" aria-hidden="true" />
        </button>
        <button
          type="button"
          :disabled="sourceItems.length === 0"
          :title="t('pickList.moveAllToTarget')"
          :aria-label="t('pickList.moveAllToTarget')"
          class="ctrl-btn"
          @click="moveAllToTarget"
        >
          <ChevronsRight class="size-3.5" aria-hidden="true" />
        </button>
        <button
          type="button"
          :disabled="targetItems.length === 0"
          :title="t('pickList.moveAllToSource')"
          :aria-label="t('pickList.moveAllToSource')"
          class="ctrl-btn"
          @click="moveAllToSource"
        >
          <ChevronsLeft class="size-3.5" aria-hidden="true" />
        </button>
      </div>

      <!-- === 右侧：Target 面板 === -->
      <div :class="[panelClass, props.targetClass]" class="flex min-w-0 flex-col overflow-hidden">
        <!-- Header -->
        <div class="flex items-center justify-between border-b border-neutral-200 px-3 py-2 dark:border-neutral-700">
          <span class="text-sm font-medium text-neutral-800 dark:text-neutral-200">
            {{ props.targetHeader ?? t('pickList.targetHeader') }}
          </span>
          <span class="text-xs text-neutral-500">
            {{ rightChecked.size }}/{{ filteredTarget.length }}
          </span>
        </div>

        <!-- Filter -->
        <div
          v-if="props.filter"
          class="flex items-center gap-1.5 border-b border-neutral-200 px-3 py-2 dark:border-neutral-700"
        >
          <Search class="size-3.5 shrink-0 text-neutral-400" aria-hidden="true" />
          <input
            v-model="rightQuery"
            type="text"
            :placeholder="t('pickList.filterPlaceholder')"
            class="w-full bg-transparent text-sm text-neutral-800 outline-none placeholder:text-neutral-400 dark:text-neutral-200"
          />
        </div>

        <!-- Items -->
        <ul
          class="max-h-80 flex-1 overflow-y-auto py-1"
          role="listbox"
          aria-multiselectable="true"
          :aria-label="props.targetHeader ?? t('pickList.targetHeader')"
        >
          <li
            v-for="(item, index) in filteredTarget"
            :key="String(getItemKey(item))"
            :class="
              cn(
                'mx-1 flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm transition-colors',
                'hover:bg-neutral-100 dark:hover:bg-neutral-800',
                isTargetChecked(item) && 'bg-primary/10 text-primary-700 dark:text-primary-300',
                props.striped && index % 2 === 1 && 'bg-neutral-50 dark:bg-neutral-900/40',
              )
            "
            :aria-selected="isTargetChecked(item)"
            :aria-label="getItemLabel(item)"
            :draggable="props.dragdrop"
            role="option"
            @click="onTargetItemClick($event, item, index)"
            @dblclick="onTargetDblClick(item)"
            @dragstart="onDragStart($event, index)"
            @dragover="onDragOver($event, index)"
            @drop="onDrop($event, index, 'target')"
            @dragend="onDragEnd"
          >
            <GripVertical
              v-if="props.dragdrop"
              class="size-3.5 shrink-0 text-neutral-400"
              aria-hidden="true"
            />
            <span class="truncate">{{ getItemLabel(item) }}</span>
          </li>
          <li
            v-if="filteredTarget.length === 0"
            class="px-3 py-6 text-center text-sm text-neutral-400"
          >
            —
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<style scoped>
.yd-picklist {
  display: flex;
  flex-direction: column;
}

.ctrl-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 9999px;
  background-color: #404040;
  /* neutral-700 */
  color: #ffffff;
  font-size: 0;
  transition: background-color 150ms ease, opacity 150ms ease;
  flex-shrink: 0;
}

.ctrl-btn:hover:not(:disabled) {
  background-color: #262626;
  /* neutral-800 */
}

.ctrl-btn:active:not(:disabled) {
  background-color: #171717;
  /* neutral-900 */
}

.ctrl-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
</style>
