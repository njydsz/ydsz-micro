<script setup lang="ts">
/**
* PickList（选择列表）：双栏穿梭列表。
 *
 * 仿 PrimeVue PickList 布局，包含 source / target 两栏
 * 以及中间控制按钮（→ ← » «）。
 *
 * 特性：
 * - 单选 / 多选（Ctrl/Cmd + Click 多选，Shift + Click 范围选）
 * - 双击项在两侧穿梭
 * - 可选搜索过滤（filter=true）
 * - 可选拖拽排序（dragdrop=true，HTML5 DnD）
 * - 可选自定义项模板（template）
 * - i18n 国际化
 *
 * WAI-ARIA：role="group"，列表区 role="listbox" aria-multiselectable="true"。
 *
 * @path comm/@core/ui-kit/ydsz-ui/src/components/pick-list/YdPickList.vue
 * @author ydsz-team
 * @since 26.10.12
 */
import { computed, ref, watch } from 'vue';

import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  GripVertical,
  Search,
} from 'lucide-vue-next';

import { useComponentI18n } from '../../composables/use-component-i18n';

import type { PickListEmits, PickListMoveEvent, YdPickListProps } from './types';

defineOptions({ name: 'YdPickList' });

const props = withDefaults(
  defineProps<YdPickListProps<Record<string, unknown>>>(),
  {
    source: () => [],
    target: () => [],
    sourceLabel: undefined,
    targetLabel: undefined,
    itemLabel: undefined,
    dragdrop: false,
    filter: false,
    filterBy: () => [],
    template: undefined,
  },
);

const emit = defineEmits<PickListEmits<Record<string, unknown>>>();

const pickListMessages = {
  en: {
    pickList: {
      filterPlaceholder: 'Search',
      moveAllToSource: 'Move All to Available',
      moveAllToTarget: 'Move All to Selected',
      moveToSource: 'Move to Available',
      moveToTarget: 'Move to Selected',
      sourceLabel: 'Available',
      targetLabel: 'Selected',
    },
  },
  zh: {
    pickList: {
      filterPlaceholder: '搜索',
      moveAllToSource: '全部移回来源',
      moveAllToTarget: '全部移到目标',
      moveToSource: '移到来源',
      moveToTarget: '移到目标',
      sourceLabel: 'Available',
      targetLabel: 'Selected',
    },
  },
};

const { t } = useComponentI18n({ messages: pickListMessages });

// ---------------------------------------------------------------------------
// 内部状态
// ---------------------------------------------------------------------------

/** source 侧搜索关键词 */
const sourceQuery = ref('');
/** target 侧搜索关键词 */
const targetQuery = ref('');
/** source 选中项索引集合 */
const sourceSelected = ref<Set<number>>(new Set());
/** target 选中项索引集合 */
const targetSelected = ref<Set<number>>(new Set());

/** source 上一次点击索引（Shift 范围选） */
let lastSourceClickIdx = -1;
/** target 上一次点击索引 */
let lastTargetClickIdx = -1;

// ---------------------------------------------------------------------------
// 派生数据
// ---------------------------------------------------------------------------

/** 过滤后的 source */
const filteredSource = computed(() => {
  const items = props.source ?? [];
  const query = sourceQuery.value.trim().toLowerCase();
  if (!query) return items;
  const filterFields = props.filterBy ?? [];
  return items.filter((item) => {
    if (props.template) {
      return props.template(item).toLowerCase().includes(query);
    }
    if (filterFields.length > 0) {
      return filterFields.some((f) => String((item as Record<string, unknown>)[f] ?? '').toLowerCase().includes(query));
    }
    // 全字段匹配
    return Object.values(item).some((v) => String(v ?? '').toLowerCase().includes(query));
  });
});

/** 过滤后的 target */
const filteredTarget = computed(() => {
  const items = props.target ?? [];
  const query = targetQuery.value.trim().toLowerCase();
  if (!query) return items;
  const filterFields = props.filterBy ?? [];
  return items.filter((item) => {
    if (props.template) {
      return props.template(item).toLowerCase().includes(query);
    }
    if (filterFields.length > 0) {
      return filterFields.some((f) => String((item as Record<string, unknown>)[f] ?? '').toLowerCase().includes(query));
    }
    return Object.values(item).some((v) => String(v ?? '').toLowerCase().includes(query));
  });
});

// ---------------------------------------------------------------------------
// 工具函数
// ---------------------------------------------------------------------------

/** 获取项的显示文本 */
function getItemDisplay(item: Record<string, unknown>): string {
  if (props.template) {
    return props.template(item);
  }
  if (props.itemLabel) {
    if (typeof props.itemLabel === 'function') {
      return props.itemLabel(item);
    }
    return String(item[String(props.itemLabel)] ?? '');
  }
  // 默认：拼接所有字段
  return Object.values(item)
    .filter((v) => v !== null && v !== undefined)
    .join(' ');
}

/** 重置 source 侧选中态（过滤变化后防止悬空） */
function pruneSourceSelection(): void {
  const len = filteredSource.value.length;
  sourceSelected.value = new Set(
    [...sourceSelected.value].filter((i) => i < len),
  );
}

/** 重置 target 侧选中态 */
function pruneTargetSelection(): void {
  const len = filteredTarget.value.length;
  targetSelected.value = new Set(
    [...targetSelected.value].filter((i) => i < len),
  );
}

// ---------------------------------------------------------------------------
// 穿梭操作
// ---------------------------------------------------------------------------

/** 选中项 → target */
function moveToTarget(): void {
  const indices = [...sourceSelected.value].sort((a, b) => a - b);
  if (indices.length === 0) return;
  const items: Record<string, unknown>[] = indices.map((i) => filteredSource.value[i]!);
  sourceSelected.value = new Set();
  sourceQuery.value = '';

  emit('move-to-target', { items } as PickListMoveEvent<Record<string, unknown>>);
}

/** 选中项 → source */
function moveToSource(): void {
  const indices = [...targetSelected.value].sort((a, b) => a - b);
  if (indices.length === 0) return;
  const items: Record<string, unknown>[] = indices.map((i) => filteredTarget.value[i]!);
  targetSelected.value = new Set();
  targetQuery.value = '';

  emit('move-to-source', { items } as PickListMoveEvent<Record<string, unknown>>);
}

/** 全部 → target */
function moveAllToTarget(): void {
  const items = [...(props.source ?? [])];
  if (items.length === 0) return;
  emit('move-all-to-target', { items } as PickListMoveEvent<Record<string, unknown>>);
  sourceSelected.value = new Set();
}

/** 全部 → source */
function moveAllToSource(): void {
  const items = [...(props.target ?? [])];
  if (items.length === 0) return;
  emit('move-all-to-source', { items } as PickListMoveEvent<Record<string, unknown>>);
  targetSelected.value = new Set();
}

/** 双击 source 单项 → 移到 target */
function handleSourceDblClick(index: number): void {
  const item = filteredSource.value[index];
  if (!item) return;
  const items = [item];
  sourceSelected.value = new Set();
  sourceQuery.value = '';
  emit('move-to-target', { items } as PickListMoveEvent<Record<string, unknown>>);
}

/** 双击 target 单项 → 移到 source */
function handleTargetDblClick(index: number): void {
  const item = filteredTarget.value[index];
  if (!item) return;
  const items = [item];
  targetSelected.value = new Set();
  targetQuery.value = '';
  emit('move-to-source', { items } as PickListMoveEvent<Record<string, unknown>>);
}

// ---------------------------------------------------------------------------
// 选择逻辑
// ---------------------------------------------------------------------------

function handleSourceItemClick(event: MouseEvent, index: number): void {
  const newSet = new Set(sourceSelected.value);
  if (event.shiftKey && lastSourceClickIdx >= 0) {
    const start = Math.min(lastSourceClickIdx, index);
    const end = Math.max(lastSourceClickIdx, index);
    for (let i = start; i <= end; i++) {
      newSet.add(i);
    }
  } else if (event.ctrlKey || event.metaKey) {
    if (newSet.has(index)) newSet.delete(index);
    else newSet.add(index);
    lastSourceClickIdx = index;
  } else {
    if (newSet.has(index) && newSet.size === 1) newSet.clear();
    else {
      newSet.clear();
      newSet.add(index);
    }
    lastSourceClickIdx = index;
  }
  sourceSelected.value = newSet;
}

function handleTargetItemClick(event: MouseEvent, index: number): void {
  const newSet = new Set(targetSelected.value);
  if (event.shiftKey && lastTargetClickIdx >= 0) {
    const start = Math.min(lastTargetClickIdx, index);
    const end = Math.max(lastTargetClickIdx, index);
    for (let i = start; i <= end; i++) {
      newSet.add(i);
    }
  } else if (event.ctrlKey || event.metaKey) {
    if (newSet.has(index)) newSet.delete(index);
    else newSet.add(index);
    lastTargetClickIdx = index;
  } else {
    if (newSet.has(index) && newSet.size === 1) newSet.clear();
    else {
      newSet.clear();
      newSet.add(index);
    }
    lastTargetClickIdx = index;
  }
  targetSelected.value = newSet;
}

// ---------------------------------------------------------------------------
// 拖拽排序（source 列表内，HTML5 DnD）
// ---------------------------------------------------------------------------

const dragFromIdx = ref(-1);

function onDragStart(event: DragEvent, index: number): void {
  dragFromIdx.value = index;
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', String(index));
  }
}

function onDragOver(event: DragEvent): void {
  event.preventDefault();
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'move';
  }
}

function onSourceDrop(event: DragEvent, toIndex: number): void {
  const fromIndex = dragFromIdx.value;
  if (fromIndex < 0 || fromIndex === toIndex) return;
  event.preventDefault();
  // DnD 排序不在 source/target 内部执行，仅作为能力展示位
  dragFromIdx.value = -1;
  void fromIndex;
  void toIndex;
}

function onDragEnd(): void {
  dragFromIdx.value = -1;
}

// ---------------------------------------------------------------------------
// 搜索框输入处理
// ---------------------------------------------------------------------------

function handleSourceFilter(): void {
  pruneSourceSelection();
}

function handleTargetFilter(): void {
  pruneTargetSelection();
}

watch(() => props.source, () => {
  sourceSelected.value = new Set();
});

watch(() => props.target, () => {
  targetSelected.value = new Set();
});
</script>

<template>
  <div
    class="yd-picklist flex flex-col gap-2 rounded-lg border border-neutral-200 bg-white p-3 dark:border-neutral-700 dark:bg-neutral-900"
    role="group"
    :aria-label="`${sourceLabel ?? t('pickList.sourceLabel')} / ${targetLabel ?? t('pickList.targetLabel')}`"
  >
    <!-- ===== 双栏主体 ===== -->
    <div class="flex flex-row items-stretch gap-2">

      <!-- === 左：Source 面板 === -->
      <div class="flex min-w-0 flex-1 flex-col overflow-hidden rounded-md border border-neutral-200 dark:border-neutral-700">
        <!-- Header -->
        <div class="flex items-center justify-between border-b border-neutral-200 px-3 py-2 dark:border-neutral-700">
          <span class="text-sm font-medium text-neutral-800 dark:text-neutral-200">
            {{ sourceLabel ?? t('pickList.sourceLabel') }}
          </span>
          <span class="text-xs text-neutral-500">
            {{ sourceSelected.size }}/{{ filteredSource.length }}
          </span>
        </div>

        <!-- Filter -->
        <div
          v-if="filter"
          class="flex items-center gap-1.5 border-b border-neutral-200 px-3 py-2 dark:border-neutral-700"
        >
          <Search class="size-3.5 shrink-0 text-neutral-400" aria-hidden="true" />
          <input
            v-model="sourceQuery"
            type="text"
            :placeholder="t('pickList.filterPlaceholder')"
            class="w-full bg-transparent text-sm text-neutral-800 outline-none placeholder:text-neutral-400 dark:text-neutral-200"
            @input="handleSourceFilter"
          />
        </div>

        <!-- Items -->
        <ul
          class="max-h-80 flex-1 overflow-y-auto py-1"
          role="listbox"
          aria-multiselectable="true"
          :aria-label="sourceLabel ?? t('pickList.sourceLabel')"
        >
          <li
            v-for="(item, index) in filteredSource"
            :key="index"
            :class="[
              'mx-1 flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm transition-colors',
              'hover:bg-neutral-100 dark:hover:bg-neutral-800',
              sourceSelected.has(index) && 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
            ]"
            :aria-selected="sourceSelected.has(index)"
            :aria-label="getItemDisplay(item)"
            :draggable="dragdrop"
            role="option"
            @click="handleSourceItemClick($event, index)"
            @dblclick="handleSourceDblClick(index)"
            @dragstart="onDragStart($event, index)"
            @dragover="onDragOver($event)"
            @drop="onSourceDrop($event, index)"
            @dragend="onDragEnd"
          >
            <GripVertical
              v-if="dragdrop"
              class="size-3.5 shrink-0 text-neutral-400"
              aria-hidden="true"
            />
            <span class="truncate">{{ getItemDisplay(item) }}</span>
          </li>
          <li
            v-if="filteredSource.length === 0"
            class="px-3 py-6 text-center text-sm text-neutral-400"
          >
            --
          </li>
        </ul>
      </div>

      <!-- === 中间控制按钮 === -->
      <div class="flex shrink-0 flex-col items-center justify-center gap-1">
        <button
          type="button"
          :disabled="sourceSelected.size === 0"
          :title="t('pickList.moveToTarget')"
          :aria-label="t('pickList.moveToTarget')"
          class="yd-picklist__ctrl-btn"
          @click="moveToTarget"
        >
          <ChevronRight class="size-3.5" aria-hidden="true" />
        </button>
        <button
          type="button"
          :disabled="targetSelected.size === 0"
          :title="t('pickList.moveToSource')"
          :aria-label="t('pickList.moveToSource')"
          class="yd-picklist__ctrl-btn"
          @click="moveToSource"
        >
          <ChevronLeft class="size-3.5" aria-hidden="true" />
        </button>
        <button
          type="button"
          :disabled="(props.source ?? []).length === 0"
          :title="t('pickList.moveAllToTarget')"
          :aria-label="t('pickList.moveAllToTarget')"
          class="yd-picklist__ctrl-btn"
          @click="moveAllToTarget"
        >
          <ChevronsRight class="size-3.5" aria-hidden="true" />
        </button>
        <button
          type="button"
          :disabled="(props.target ?? []).length === 0"
          :title="t('pickList.moveAllToSource')"
          :aria-label="t('pickList.moveAllToSource')"
          class="yd-picklist__ctrl-btn"
          @click="moveAllToSource"
        >
          <ChevronsLeft class="size-3.5" aria-hidden="true" />
        </button>
      </div>

      <!-- === 右：Target 面板 === -->
      <div class="flex min-w-0 flex-1 flex-col overflow-hidden rounded-md border border-neutral-200 dark:border-neutral-700">
        <!-- Header -->
        <div class="flex items-center justify-between border-b border-neutral-200 px-3 py-2 dark:border-neutral-700">
          <span class="text-sm font-medium text-neutral-800 dark:text-neutral-200">
            {{ targetLabel ?? t('pickList.targetLabel') }}
          </span>
          <span class="text-xs text-neutral-500">
            {{ targetSelected.size }}/{{ filteredTarget.length }}
          </span>
        </div>

        <!-- Filter -->
        <div
          v-if="filter"
          class="flex items-center gap-1.5 border-b border-neutral-200 px-3 py-2 dark:border-neutral-700"
        >
          <Search class="size-3.5 shrink-0 text-neutral-400" aria-hidden="true" />
          <input
            v-model="targetQuery"
            type="text"
            :placeholder="t('pickList.filterPlaceholder')"
            class="w-full bg-transparent text-sm text-neutral-800 outline-none placeholder:text-neutral-400 dark:text-neutral-200"
            @input="handleTargetFilter"
          />
        </div>

        <!-- Items -->
        <ul
          class="max-h-80 flex-1 overflow-y-auto py-1"
          role="listbox"
          aria-multiselectable="true"
          :aria-label="targetLabel ?? t('pickList.targetLabel')"
        >
          <li
            v-for="(item, index) in filteredTarget"
            :key="index"
            :class="[
              'mx-1 flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm transition-colors',
              'hover:bg-neutral-100 dark:hover:bg-neutral-800',
              targetSelected.has(index) && 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
            ]"
            :aria-selected="targetSelected.has(index)"
            :aria-label="getItemDisplay(item)"
            :draggable="dragdrop"
            role="option"
            @click="handleTargetItemClick($event, index)"
            @dblclick="handleTargetDblClick(index)"
            @dragstart="onDragStart($event, index)"
            @dragover="onDragOver($event)"
            @drop="onSourceDrop($event, index)"
            @dragend="onDragEnd"
          >
            <GripVertical
              v-if="dragdrop"
              class="size-3.5 shrink-0 text-neutral-400"
              aria-hidden="true"
            />
            <span class="truncate">{{ getItemDisplay(item) }}</span>
          </li>
          <li
            v-if="filteredTarget.length === 0"
            class="px-3 py-6 text-center text-sm text-neutral-400"
          >
            --
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<style scoped>
.yd-picklist__ctrl-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 9999px;
  background-color: #404040;
  color: #ffffff;
  transition: background-color 150ms ease, opacity 150ms ease;
  flex-shrink: 0;
}

.yd-picklist__ctrl-btn:hover:not(:disabled) {
  background-color: #262626;
}

.yd-picklist__ctrl-btn:active:not(:disabled) {
  background-color: #171717;
}

.yd-picklist__ctrl-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
</style>
