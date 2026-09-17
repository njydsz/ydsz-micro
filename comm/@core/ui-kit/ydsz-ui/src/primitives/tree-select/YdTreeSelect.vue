<script lang="ts" setup">
import { computed, ref } from 'vue';

import { cn } from '@ydsz-core/shared/utils';
import { ChevronDown, ChevronRight, Search } from 'lucide-vue-next';

interface TreeSelectOption {
  children?: TreeSelectOption[];
  disabled?: boolean;
  label: string;
  value: string | number;
}

interface Props {
  class?: any;
  disabled?: boolean;
  placeholder?: string;
  options: TreeSelectOption[];
  modelValue?: string | number;
  /** 默认展开层级 */
  defaultExpandLevel?: number;
  showSearch?: boolean;
  treeCheckable?: boolean;
  multiple?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  defaultExpandLevel: 1,
  disabled: false,
  modelValue: undefined,
  multiple: false,
  options: () => [],
  placeholder: '请选择',
  showSearch: false,
  treeCheckable: false,
});

const emit = defineEmits<{
  'update:modelValue': [val: string | number | undefined];
}>();

const isOpen = ref(false);
const query = ref('');
const expandedKeys = ref<Set<string | number>>(new Set());

/** 扁平化选项（用于搜索） */
const flattenOptions = computed(() => {
  const result: TreeSelectOption[] = [];
  function walk(nodes: TreeSelectOption[], level: number) {
    for (const node of nodes) {
      result.push(node);
      if (node.children) walk(node.children, level + 1);
    }
  }
  walk(props.options, 0);
  return result;
});

const filteredOptions = computed(() => {
  if (!query.value) return props.options;
  const q = query.value.toLowerCase();
  return flattenOptions.value.filter((o) => o.label.toLowerCase().includes(q));
});

function toggleExpand(val: string | number): void {
  if (expandedKeys.value.has(val)) {
    expandedKeys.value.delete(val);
  } else {
    expandedKeys.value.add(val);
  }
}

function handleSelect(option: TreeSelectOption): void {
  if (option.disabled) return;
  emit('update:modelValue', option.value);
  if (!props.multiple) isOpen.value = false;
}

function isSelected(val: string | number): boolean {
  return val === props.modelValue;
}
</script>

<template>
  <div :class="cn('relative inline-block w-full', props.class)">
    <button
      :aria-expanded="isOpen"
      :aria-label="'树选择器'"
      :class="cn('flex h-9 w-full items-center justify-between rounded-md border bg-background px-3 text-sm', isOpen && 'border-primary ring-2 ring-ring')"
      :disabled="props.disabled"
      type="button"
      @click="isOpen = !isOpen"
    >
      <span :class="cn(!props.modelValue && 'text-muted-foreground')">
        {{ String(props.modelValue ?? props.placeholder) }}
      </span>
      <ChevronDown :class="cn('size-4 text-muted-foreground transition-transform', isOpen && 'rotate-180')" />
    </button>

    <div
      v-if="isOpen"
      class="bg-background absolute left-0 top-full z-50 mt-1 max-h-64 w-full overflow-y-auto rounded-lg border shadow-xl"
      role="tree"
    >
      <div v-if="props.showSearch" class="border-b p-2">
        <div class="relative">
          <Search class="text-muted-foreground absolute left-2 top-1/2 size-3.5 -translate-y-1/2" />
          <input v-model="query" :aria-label="'搜索'" class="w-full rounded border bg-transparent py-1 pl-7 pr-2 text-sm outline-none focus:border-primary" placeholder="搜索..." type="text" />
        </div>
      </div>

      <!-- 简化树形渲染（仅 1 层） -->
      <ul class="py-1">
        <li
          v-for="opt in filteredOptions"
          :key="String(opt.value)"
          :aria-selected="isSelected(opt.value)"
          :class="cn('flex cursor-pointer items-center gap-2 px-3 py-2 text-sm transition-colors hover:bg-muted', isSelected(opt.value) && 'bg-primary/10 font-medium text-primary', opt.disabled && 'cursor-not-allowed opacity-40')"
          role="treeitem"
          @click="handleSelect(opt)"
        >
          <ChevronRight v-if="opt.children?.length" class="size-3.5 text-muted-foreground" />
          <span class="flex-1">{{ opt.label }}</span>
        </li>
        <li v-if="filteredOptions.length === 0" class="text-muted-foreground px-3 py-2 text-center text-sm">无匹配数据</li>
      </ul>
    </div>
  </div>
</template>
