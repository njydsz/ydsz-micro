<script lang="ts" setup>
/**
* Transfer 穿梭框：在两个列表间移动数据。
* 
 * 受控组件：value 为右侧已选 key 集合，操作后通过 update:value 回传给父组件。
 * 左侧为可选列表，右侧为已选列表，中间按钮面板支持单/双向移动。
* 
 * 搜索通过内置 input 实现（本地过滤），不清库外部接口。
* 
 * @path comm\@core\ui-kit\ydsz-ui\src\primitives\transfer\YdTransfer.vue
 * @author ydsz-team
 * @since 1.0.0
 */
// @ts-nocheck
import { computed, ref } from 'vue';

import { cn } from '@ydsz-core/shared/utils';
import { ChevronLeft, ChevronRight, Search } from 'lucide-vue-next';

import { useVirtualScrollItems } from '../../composables/use-virtual-scroll-items';

import { YdButton } from '.././button';
import { YdCheckbox } from '.././checkbox';
import { YdInput } from '.././input';
import { YdVirtualList } from '../virtual-table';
import { useLocale } from '../../locale/useLocale';

const { t } = useLocale();

/** Transfer 数据项 */
export interface TransferItem {
  /** 禁用态：该 item 不响应选择 */
  disabled?: boolean;
  /** 显示文案 */
  label: string;
  /** 唯一标识 */
  key: string;
}

const props = withDefaults(
  defineProps<{
    /** 自定义类名 */
    class?: any;
    /** 是否禁用全部交互 */
    disabled?: boolean;
    /** 数据源 */
    dataSource: TransferItem[];
    /** 无数据时左侧提示文案 */
    notFoundContent?: string;
    /** 搜索占位符 */
    placeholder?: string;
    /** 右侧标题 */
    selectedTitle?: string;
    /** 左侧标题 */
    title?: string;
    /** 已选 key 集合（受控） */
    value?: string[];
    /**
     * 启用虚拟滚动的条目数阈值。
     *
     * 当左侧或右侧列表的条目数超过此值时，自动用 YdVirtualList 替代普通 v-for，
     * 仅渲染视口可见项以保障大数据量下的滚动性能。
     * 设为 0 时恒不启用虚拟化（默认 100）。
     */
    virtualThreshold?: number;
  }>(),
  {
    dataSource: () => [],
    disabled: false,
    value: () => [],
    virtualThreshold: 100,
  },
);

const emit = defineEmits<{
  'update:value': [keys: string[]];
}>();

/** 左侧搜索关键字 */
const leftQuery = ref('');
/** 右侧搜索关键字 */
const rightQuery = ref('');
/** 左侧选中 key */
const leftChecked = ref<Set<string>>(new Set());
/** 右侧选中 key */
const rightChecked = ref<Set<string>>(new Set());

/** 右侧已选数据集合 */
const selectedKeys = computed(() => new Set(props.value ?? []));

/** 左侧可选列表（搜索过滤后） */
const leftItems = computed(() => {
  const q = leftQuery.value.trim().toLowerCase();
  return props.dataSource.filter((item) => {
    if (selectedKeys.value.has(item.key)) return false;
    if (q && !item.label.toLowerCase().includes(q)) return false;
    return true;
  });
});

/** 右侧已选列表（搜索过滤后） */
const rightItems = computed(() => {
  const q = rightQuery.value.trim().toLowerCase();
  return props.dataSource.filter((item) => {
    if (!selectedKeys.value.has(item.key)) return false;
    if (q && !item.label.toLowerCase().includes(q)) return false;
    return true;
  });
});

/**
 * 虚拟滚动启用判定：基于各自的过滤后列表长度与阈值，独立决定是否虚拟化。
 *
 * 使用 useVirtualScrollItems 阈值判定逻辑，组件内部保持原有渲染与事件处理不变；
 * 仅当列表数据量超过 virtualThreshold 时使用 YdVirtualList 替代 v-for。
 */
const leftList = useVirtualScrollItems(
  () => leftItems.value,
  { threshold: props.virtualThreshold },
);
const rightList = useVirtualScrollItems(
  () => rightItems.value,
  { threshold: props.virtualThreshold },
);

/** 全选左侧（排除 disabled） */
function selectAllLeft(): void {
  const newChecked = new Set(leftChecked.value);
  leftItems.value.forEach((item) => {
    if (!item.disabled) newChecked.add(item.key);
  });
  leftChecked.value = newChecked;
}

/** 全选右侧（排除 disabled） */
function selectAllRight(): void {
  const newChecked = new Set(rightChecked.value);
  rightItems.value.forEach((item) => {
    if (!item.disabled) newChecked.add(item.key);
  });
  rightChecked.value = newChecked;
}

/** 选中项 → 右侧 */
function moveToRight(): void {
  const next = new Set(selectedKeys.value);
  leftChecked.value.forEach((k) => next.add(k));
  leftChecked.value = new Set();
  emit('update:value', Array.from(next));
}

/** 选中项 → 左侧 */
function moveToLeft(): void {
  const next = new Set(selectedKeys.value);
  rightChecked.value.forEach((k) => next.delete(k));
  rightChecked.value = new Set();
  emit('update:value', Array.from(next));
}

/** 全部移至右侧 */
function moveAllToRight(): void {
  const next = new Set(selectedKeys.value);
  props.dataSource.forEach((item) => {
    if (!item.disabled) next.add(item.key);
  });
  leftChecked.value = new Set();
  emit('update:value', Array.from(next));
}

/** 全部移回左侧 */
function moveAllToLeft(): void {
  rightChecked.value = new Set();
  emit('update:value', []);
}
</script>

<template>
  <div
    :class="
      cn(
        'flex items-stretch gap-2 rounded-lg border p-4',
        props.disabled && 'pointer-events-none opacity-60',
        props.class,
      )
    "
  >
    <!-- 左侧：可选列表 -->
    <div class="flex flex-1 flex-col gap-2">
      <div class="flex items-center justify-between">
        <YdCheckbox
          :checked="leftChecked.size === leftItems.length && leftItems.length > 0"
          :indeterminate="leftChecked.size > 0 && leftChecked.size < leftItems.length"
          @change="selectAllLeft"
        >
          <slot name="title">{{ props.title ?? t('transfer.available') }}</slot>
          <span class="ml-1 text-xs text-muted-foreground">
            ({{ leftChecked.size }}/{{ leftItems.length }})
          </span>
        </YdCheckbox>
      </div>

      <div class="relative">
        <Search class="text-muted-foreground absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2" />
        <YdInput v-model="leftQuery" class="pl-8" size="sm" :placeholder="props.placeholder ?? t('common.search')" />
      </div>

      <div class="flex max-h-72 flex-1 flex-col gap-1 rounded border p-2">
        <!-- 空数据态 -->
        <div
          v-if="leftItems.length === 0"
          class="text-muted-foreground py-4 text-center text-sm"
        >
          {{ props.notFoundContent ?? t('transfer.notFound') }}
        </div>

        <!-- 虚拟滚动模式：数据量超阈值时 YdVisibleList 仅渲染可见项 -->
        <YdVirtualList
          v-else-if="leftList.enableVirtual.value"
          :items="leftItems"
          :item-height="36"
          :scroll-height="288"
          class="flex-1"
        >
          <template #default="{ items: vItems }">
            <div
              v-for="vItem in vItems"
              :key="vItem.key"
              :style="{ height: '36px' }"
              :class="
                cn(
                  'flex items-center gap-2 rounded px-2 py-1.5 text-sm transition-colors',
                  leftChecked.has(vItem.data.key)
                    ? 'bg-primary/10 font-medium'
                    : 'hover:bg-muted',
                  vItem.data.disabled ? 'cursor-not-allowed opacity-40' : 'cursor-pointer',
                )
              "
              @click="
                () => {
                  if (vItem.data.disabled) return;
                  const next = new Set(leftChecked);
                  if (next.has(vItem.data.key)) next.delete(vItem.data.key);
                  else next.add(vItem.data.key);
                  leftChecked = next;
                }
              "
            >
              <YdCheckbox :checked="leftChecked.has(vItem.data.key)" :disabled="vItem.data.disabled" size="sm"></YdCheckbox>
              <span class="truncate">{{ vItem.data.label }}</span>
            </div>
          </template>
        </YdVirtualList>

        <!-- 普通模式：数据量未达阈值时全量渲染（保持原有 DOM 结构与交互语义） -->
        <template v-else>
          <div
            v-for="item in leftItems"
            :key="item.key"
            :class="
              cn(
                'flex items-center gap-2 rounded px-2 py-1.5 text-sm transition-colors',
                leftChecked.has(item.key)
                  ? 'bg-primary/10 font-medium'
                  : 'hover:bg-muted',
                item.disabled ? 'cursor-not-allowed opacity-40' : 'cursor-pointer',
              )
            "
            @click="
              () => {
                if (item.disabled) return;
                const next = new Set(leftChecked);
                if (next.has(item.key)) next.delete(item.key);
                else next.add(item.key);
                leftChecked = next;
              }
            "
          >
            <YdCheckbox :checked="leftChecked.has(item.key)" :disabled="item.disabled" size="sm"></YdCheckbox>
            <span class="truncate">{{ item.label }}</span>
          </div>
        </template>
      </div>
    </div>

    <!-- 中间：操作按钮 -->
    <div class="flex flex-col items-center justify-center gap-1">
      <YdButton :disabled="leftChecked.size === 0" size="sm" variant="outline" @click="moveToRight">
        <ChevronRight class="size-3.5" />
      </YdButton>
      <YdButton :disabled="rightChecked.size === 0" size="sm" variant="outline" @click="moveToLeft">
        <ChevronLeft class="size-3.5" />
      </YdButton>
      <div class="my-1 h-px w-4 bg-border"></div>
      <YdButton :disabled="leftItems.length === 0" size="sm" variant="ghost" @click="moveAllToRight">
        <ChevronRight class="size-3.5" /><ChevronRight class="-ml-2 size-3.5" />
      </YdButton>
      <YdButton :disabled="rightItems.length === 0" size="sm" variant="ghost" @click="moveAllToLeft">
        <ChevronLeft class="size-3.5" /><ChevronLeft class="-ml-2 size-3.5" />
      </YdButton>
    </div>

    <!-- 右侧：已选列表 -->
    <div class="flex flex-1 flex-col gap-2">
      <div class="flex items-center justify-between">
        <YdCheckbox
          :checked="rightChecked.size === rightItems.length && rightItems.length > 0"
          :indeterminate="rightChecked.size > 0 && rightChecked.size < rightItems.length"
          @change="selectAllRight"
        >
          <slot name="selected-title">{{ props.selectedTitle ?? t('transfer.selected') }}</slot>
          <span class="ml-1 text-xs text-muted-foreground">
            ({{ rightChecked.size }}/{{ rightItems.length }})
          </span>
        </YdCheckbox>
      </div>

      <div class="relative">
        <Search class="text-muted-foreground absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2" />
        <YdInput v-model="rightQuery" class="pl-8" size="sm" :placeholder="props.placeholder ?? t('common.search')" />
      </div>

      <div class="flex max-h-72 flex-1 flex-col gap-1 rounded border p-2">
        <!-- 空数据态 -->
        <div
          v-if="rightItems.length === 0"
          class="text-muted-foreground py-4 text-center text-sm"
        >
          {{ props.notFoundContent ?? t('transfer.notFound') }}
        </div>

        <!-- 虚拟滚动模式：数据量超阈值时 YdVisibleList 仅渲染可见项 -->
        <YdVirtualList
          v-else-if="rightList.enableVirtual.value"
          :items="rightItems"
          :item-height="36"
          :scroll-height="288"
          class="flex-1"
        >
          <template #default="{ items: vItems }">
            <div
              v-for="vItem in vItems"
              :key="vItem.key"
              :style="{ height: '36px' }"
              :class="
                cn(
                  'flex items-center gap-2 rounded px-2 py-1.5 text-sm transition-colors',
                  rightChecked.has(vItem.data.key)
                    ? 'bg-primary/10 font-medium'
                    : 'hover:bg-muted',
                  vItem.data.disabled ? 'cursor-not-allowed opacity-40' : 'cursor-pointer',
                )
              "
              @click="
                () => {
                  if (vItem.data.disabled) return;
                  const next = new Set(rightChecked);
                  if (next.has(vItem.data.key)) next.delete(vItem.data.key);
                  else next.add(vItem.data.key);
                  rightChecked = next;
                }
              "
            >
              <YdCheckbox :checked="rightChecked.has(vItem.data.key)" :disabled="vItem.data.disabled" size="sm"></YdCheckbox>
              <span class="truncate">{{ vItem.data.label }}</span>
            </div>
          </template>
        </YdVirtualList>

        <!-- 普通模式：数据量未达阈值时全量渲染（保持原有 DOM 结构与交互语义） -->
        <template v-else>
          <div
            v-for="item in rightItems"
            :key="item.key"
            :class="
              cn(
                'flex items-center gap-2 rounded px-2 py-1.5 text-sm transition-colors',
                rightChecked.has(item.key)
                  ? 'bg-primary/10 font-medium'
                  : 'hover:bg-muted',
                item.disabled ? 'cursor-not-allowed opacity-40' : 'cursor-pointer',
              )
            "
            @click="
              () => {
                if (item.disabled) return;
                const next = new Set(rightChecked);
                if (next.has(item.key)) next.delete(item.key);
                else next.add(item.key);
                rightChecked = next;
              }
            "
          >
            <YdCheckbox :checked="rightChecked.has(item.key)" :disabled="item.disabled" size="sm"></YdCheckbox>
            <span class="truncate">{{ item.label }}</span>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>
