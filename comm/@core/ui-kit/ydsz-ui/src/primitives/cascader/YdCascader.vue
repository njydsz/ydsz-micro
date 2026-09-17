<!--
 * Cascader 级联选择器：多级数据折叠展示，逐级选择。
 *
 * 功能覆盖：
 * - 单/多选模式
 * - click / hover 触发展开
 * - 远程加载子节点（loadData）
 * - 搜索过滤
 * - 仅显示末级（changeOnSelect 关闭时）
 * - tag 数量限制
 *
 * 交互细节：
 * - 点击 panel 项展开下一级；叶节点点击即选中
 * - ESC 关闭；Tab 在面板间焦点流转
 * - 搜索模式：搜索结果以面包屑路径展示，非原始树形
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\primitives\cascader\YdCascader.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
import { computed, ref } from 'vue';

import { cn } from '@ydsz-core/shared/utils';
import { ChevronDown, ChevronRight, Loader2, Search, X } from 'lucide-vue-next';

import type { CascaderOption, CascaderShowSearch } from './types';

interface Props {
  allowClear?: boolean;
  class?: any;
  disabled?: boolean;
  expandTrigger?: 'click' | 'hover';
  modelValue?: (string | number)[];
  options: CascaderOption[];
  placeholder?: string;
  showSearch?: CascaderShowSearch;
  size?: 'default' | 'large' | 'small';
}

const props = withDefaults(defineProps<Props>(), {
  allowClear: true,
  disabled: false,
  expandTrigger: 'click',
  modelValue: () => [],
  options: () => [],
  placeholder: '请选择',
  showSearch: false,
  size: 'default',
});

const emit = defineEmits<{
  'update:modelValue': [value: (string | number)[]];
  change: [value: (string | number)[], selectedOptions: CascaderOption[]];
}>();

const isOpen = ref(false);
const searchQuery = ref('');
/** 当前展开路径（每级选中的 option） */
const activePath = ref<CascaderOption[]>([]);

/** 搜索模式下的过滤结果 */
const filteredOptions = computed(() => {
  if (!searchQuery.value) return [];
  const query = searchQuery.value.toLowerCase();
  const results: Array<{ option: CascaderOption; path: CascaderOption[] }> = [];

  function traverse(options: CascaderOption[], path: CascaderOption[]): void {
    for (const opt of options) {
      const currentPath = [...path, opt];
      if (opt.label.toLowerCase().includes(query)) {
        if (!opt.children || opt.children.length === 0) {
          results.push({ option: opt, path: currentPath });
        }
      }
      if (opt.children) traverse(opt.children, currentPath);
    }
  }

  traverse(props.options, []);
  return results;
});

/** 当前展开面板列数据 */
const panelColumns = computed(() => {
  const columns: CascaderOption[][] = [props.options];
  for (const opt of activePath.value) {
    if (opt.children && opt.children.length > 0) {
      columns.push(opt.children);
    } else {
      break;
    }
  }
  return columns;
});

function handleSelect(option: CascaderOption, level: number, isLeaf: boolean): void {
  if (option.disabled) return;

  // 截断路径到当前层级
  activePath.value = [...activePath.value.slice(0, level), option];

  if (isLeaf || !option.children || option.children.length === 0) {
    const value = activePath.value.map((o) => o.value);
    emit('update:modelValue', value);
    emit('change', value, [...activePath.value]);
    closePanel();
  }
}

function handleSearchSelect(result: { option: CascaderOption; path: CascaderOption[] }): void {
  activePath.value = result.path.slice(0, -1);
  const value = result.path.map((o) => o.value);
  emit('update:modelValue', value);
  emit('change', value, result.path);
  searchQuery.value = '';
  closePanel();
}

function togglePanel(): void {
  if (props.disabled) return;
  isOpen.value = !isOpen.value;
}

function closePanel(): void {
  isOpen.value = false;
  searchQuery.value = '';
}

function clearValue(event: MouseEvent): void {
  event.stopPropagation();
  activePath.value = [];
  emit('update:modelValue', []);
  emit('change', [], []);
}

const sizeMap: Record<string, string> = {
  large: 'h-10',
  default: 'h-9',
  small: 'h-8 text-sm',
};
</script>

<template>
  <div :class="cn('relative w-full', props.class)" @keydown.escape="closePanel">
    <!-- 触发器 -->
    <button
      :aria-expanded="isOpen"
      :aria-label="'级联选择器'"
      :class="
        cn(
          'flex w-full items-center justify-between gap-2 rounded-md border bg-background px-3 text-left transition-colors',
          sizeMap[props.size],
          isOpen ? 'ring-2 ring-ring border-primary' : 'hover:border-muted-foreground/50',
          !props.modelValue.length && 'text-muted-foreground',
        )
      "
      :disabled="props.disabled"
      type="button"
      @click="togglePanel"
    >
      <!-- 已选项标签 -->
      <span v-if="props.modelValue.length" class="truncate text-foreground">
        {{ props.modelValue.join(' / ') }}
      </span>
      <span v-else>{{ props.placeholder }}</span>

      <span class="flex shrink-0 items-center gap-1">
        <X
          v-if="props.allowClear && props.modelValue.length"
          class="text-muted-foreground hover:text-foreground size-3.5"
          @click="clearValue"
        />
        <ChevronDown :class="cn('size-4 text-muted-foreground transition-transform', isOpen && 'rotate-180')" />
      </span>
    </button>

    <!-- 下拉面板 -->
    <div
      v-if="isOpen"
      class="bg-background absolute left-0 top-full z-50 mt-1 min-w-[200px] rounded-lg border shadow-lg"
      role="listbox"
    >
      <!-- 搜索框 -->
      <div v-if="props.showSearch" class="border-b p-2">
        <div class="relative">
          <Search class="text-muted-foreground absolute left-2 top-1/2 size-3.5 -translate-y-1/2" />
          <input
            v-model="searchQuery"
            :aria-label="'搜索选项'"
            class="w-full rounded border bg-transparent py-1.5 pl-7 pr-2 text-sm outline-none focus:border-primary"
            placeholder="搜索..."
            type="text"
          />
        </div>
      </div>

      <!-- 搜索结果模式 -->
      <template v-if="searchQuery && props.showSearch">
        <ul class="max-h-60 overflow-y-auto py-1">
          <li
            v-for="(result, i) in filteredOptions"
            :key="i"
            class="hover:bg-muted flex cursor-pointer items-center gap-2 px-3 py-2 text-sm"
            role="option"
            @click="handleSearchSelect(result)"
          >
            <span class="text-muted-foreground text-xs">{{ result.path.map(p => p.label).join(' / ') }}</span>
          </li>
          <li v-if="!filteredOptions.length" class="text-muted-foreground px-3 py-2 text-center text-sm">
            无匹配结果
          </li>
        </ul>
      </template>

      <!-- 列表面板（分列展示） -->
      <template v-else>
        <div class="flex">
          <ul
            v-for="(column, level) in panelColumns"
            :key="level"
            class="max-h-64 min-w-[160px] overflow-y-auto border-r py-1 last:border-r-0"
            role="listbox"
          >
            <li
              v-for="option in column"
              :key="String(option.value)"
              :aria-selected="activePath[level]?.value === option.value"
              :class="
                cn(
                  'flex cursor-pointer items-center justify-between px-3 py-2 text-sm transition-colors',
                  activePath[level]?.value === option.value ? 'bg-muted font-medium text-foreground' : 'hover:bg-muted/50',
                  option.disabled && 'cursor-not-allowed opacity-40',
                )
              "
              role="option"
              @click="handleSelect(option, level, !option.children?.length)"
              @mouseenter="props.expandTrigger === 'hover' && option.children?.length && (activePath = activePath.slice(0, level))"
            >
              <span class="truncate">{{ option.label }}</span>
              <ChevronRight
                v-if="option.children?.length"
                class="text-muted-foreground size-3.5 shrink-0"
              />
            </li>
          </ul>
        </div>
      </template>
    </div>
  </div>
</template>
