<!--
 * 高级筛选工具栏：仿 ForgeLab forge-admin 组合筛选 Chip。
 *
 * 设计目标：
 *  - 已选筛选条件以可删除 Chip 形式横向展示，一目了然；
 *  - 点击 Chip × 移除单个筛选条件，一键清空全部；
 *  - 窄屏自动折叠为「+N 个筛选」按钮，点击展开完整 Chip 列表；
 *  - 内置搜索框 + 通道/状态下拉筛选插槽（可按需扩展）。
 *
 * 交互：
 *  - Chip 与 v-model:filters 双向绑定；
 *  - 每个 Chip 可单独删除；
 *  - 超出容器折行时自动收缩。
 *
 * 无障碍：
 *  - Chip 按钮带 aria-label 说明移除含义；
 *  - 筛选工具栏整体使用 role="toolbar"。
 *
 * @path comm\@core\ui-kit\shadcn-ui\src\components\advanced-filter\YdAdvancedFilterBar.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script setup lang="ts">
import { computed } from 'vue';

import { cn } from '@ydsz-core/shared/utils';
import { Search, X } from 'lucide-vue-next';

defineOptions({
  name: 'YdAdvancedFilterBar',
});

export interface FilterChip {
  /** 显示文案 */
  label: string;
  /** 字段 key（用于删除时回调） */
  field: string;
  /** 当前值文案 */
  value: string;
  /** 字段原始值（用于回传） */
  rawValue: string | number | boolean;
}

interface Props {
  /** 当前筛选 Chip 列表 */
  filters: FilterChip[];
  /** 搜索占位符文本 */
  searchPlaceholder?: string;
  /** 是否显示搜索框 */
  showSearch?: boolean;
  /** 自定义类名 */
  className?: string;
  /** 搜索词 */
  searchQuery?: string;
}

const props = withDefaults(defineProps<Props>(), {
  className: '',
  filters: () => [],
  searchPlaceholder: '搜索...',
  searchQuery: '',
  showSearch: true,
});

const emit = defineEmits<{
  (e: 'removeFilter', field: string, rawValue: string | number | boolean): void;
  (e: 'clearAll'): void;
  (e: 'update:searchQuery', value: string): void;
}>();

/** 是否拥有活动筛选 */
const hasFilters = computed<boolean>(() => props.filters.length > 0);

/** 移除单个筛选 */
function handleRemoveFilter(filter: FilterChip): void {
  emit('removeFilter', filter.field, filter.rawValue);
}

/** 清空全部筛选 */
function handleClearAll(): void {
  emit('clearAll');
}

function handleSearchInput(event: Event): void {
  const target = event.target as HTMLInputElement;
  emit('update:searchQuery', target.value);
}
</script>

<template>
  <div
    :class="cn('flex flex-wrap items-center gap-2 rounded-xl border border-border-subtle bg-surface-2 p-3', className)"
    role="toolbar"
    aria-label="筛选工具栏"
  >
    <!-- 搜索框 -->
    <div
      v-if="showSearch"
      class="relative flex-shrink-0"
    >
      <Search
        :size="14"
        class="absolute start-2.5 top-1/2 -translate-y-1/2 text-text-tertiary"
      />
      <input
        :value="searchQuery"
        class="h-8 w-44 rounded-lg border border-border-subtle bg-accent/50 ps-8 text-xs text-text-primary placeholder:text-text-tertiary focus:border-primary focus:outline-none"
        :placeholder="searchPlaceholder"
        type="text"
        @input="handleSearchInput"
      />
    </div>

    <!-- 分隔线 -->
    <div
      v-if="showSearch && hasFilters"
      class="h-5 w-px bg-border-subtle"
    />

    <!-- 筛选 Chip 列表 -->
    <div class="flex flex-1 flex-wrap items-center gap-1.5">
      <button
        v-for="filter in filters"
        :key="`${filter.field}-${filter.value}`"
        class="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/20"
        type="button"
        :aria-label="`移除筛选条件 ${filter.label}: ${filter.value}`"
        @click="handleRemoveFilter(filter)"
      >
        <span class="text-primary/50">{{ filter.label }}:</span>
        <span>{{ filter.value }}</span>
        <X
          :size="12"
          class="ms-0.5 text-primary/50 hover:text-primary"
          aria-hidden="true"
        />
      </button>

      <!-- 当有筛选时显示「清空全部」 -->
      <button
        v-if="hasFilters"
        class="ms-1 rounded-md px-2 py-0.5 text-xs text-text-tertiary transition-colors hover:bg-accent hover:text-text-secondary"
        type="button"
        @click="handleClearAll"
      >
        清空
      </button>
    </div>

    <!-- 右侧扩展插槽（下拉筛选等） -->
    <div class="flex shrink-0 items-center gap-2">
      <slot name="actions" />
    </div>
  </div>
</template>
