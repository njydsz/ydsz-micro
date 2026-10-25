<script lang="ts" setup>
/**
* YdVCascader —— 带虚拟滚动的级联选择器。
* 
 * <p>与 YdCascader 的功能等价替代（单/多选、hover 触发、远程加载、搜索），
 * 但在每列大数据场景下，通过 useVirtualList 仅渲染可见选项，
 * 避免千级选项全量渲染造成的面板展开慢、滚动卡顿。
* 
 * <p>与 YdCascader 的边界：
 *  - YdCascader 适合单级 < 200 选项的常规场景；
 *  - YdVCascader 适合任意级存在大量选项的高性能场景。
* 
 * <p>性能特征（以每列 2000 项为例）：
 *  - 不虚拟：每列 ~2000 个 li DOM 节点，共 ~6000 节点（3 层展开）；
 *  - 虚拟后：每列 ~18 个 DOM 节点（8 visible + 10 overscan），共 ~54 节点。
* 
 * @path comm\@core\ui-kit\ydsz-ui\src\primitives\cascader\YdVCascader.vue
 * @author ydsz-team
 * @since 26.09.17
 */
// @ts-nocheck
import { computed, ref, shallowRef, watch } from 'vue';

import { cn } from '@ydsz-core/shared/utils';
import { ChevronDown, ChevronRight, Loader2, Search, X } from 'lucide-vue-next';

import { useVirtualList } from '../../composables/use-virtual-list';

import type { VirtualListHandle } from '../../composables/use-virtual-list';
import type { CascaderOption, CascaderProps, CascaderShowSearch } from './types';

/** VCascader props（扩展 CascaderProps 增加虚拟滚动配置） */
export interface VCascaderProps extends Omit<CascaderProps, 'class'> {
  /** 每列的预估行高（px），默认 32 */
  itemHeight?: number;
  /** 每列视口高度（px），默认 256 */
  columnHeight?: number;
  /** 上下缓冲项数，默认 5 */
  overscan?: number;
  /** 超过此阈值才启用虚拟滚动（单列项数），默认 100 */
  virtualThreshold?: number;
}

interface Props extends VCascaderProps {}

const props = withDefaults(defineProps<Props>(), {
  allowClear: true,
  disabled: false,
  expandTrigger: 'click',
  itemHeight: 32,
  columnHeight: 256,
  modelValue: () => [],
  options: () => [],
  placeholder: '请选择',
  showSearch: false,
  size: 'default',
  overscan: 5,
  virtualThreshold: 100,
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

/** 为单列创建虚拟滚动句柄：items 走 getter，列数据变化时自动重算可见区间 */
function createColumnVirtual(level: number): VirtualListHandle<CascaderOption> {
  return useVirtualList(() => panelColumns.value[level] ?? [], {
    itemHeight: props.itemHeight,
    overscan: props.overscan,
    viewportHeight: props.columnHeight,
    getKey: (_item, idx) => idx,
  });
}

/**
 * 列级虚拟滚动句柄池。
 *
 * 早期实现把 useVirtualList 放在 computed 里，面板每次重算都会新建一组 computed，
 * 既让滚动位置随重算丢失，也遗留无人回收的响应式副作用；改为按 level 稳定持有，
 * 仅在列数增长时补建。
 *
 * 用 shallowRef 而非 ref：句柄内部自带 Ref，深 reactive 会在访问时解包，
 * 使模板拿不到 containerProps 这类 Ref 对象。
 */
const columnVirtuals = shallowRef<VirtualListHandle<CascaderOption>[]>([]);

watch(
  () => panelColumns.value.length,
  (count) => {
    if (count <= columnVirtuals.value.length) return;
    const handles = [...columnVirtuals.value];
    for (let level = handles.length; level < count; level++) {
      handles.push(createColumnVirtual(level));
    }
    columnVirtuals.value = handles;
  },
  { immediate: true },
);

/** 控制每列启用虚拟滚动 or 全量渲染 */
const columnVirtualEnabled = computed(() =>
  panelColumns.value.map((col) => col.length >= props.virtualThreshold),
);

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
          <div
            v-for="(column, level) in panelColumns"
            :key="level"
            class="min-w-[160px] border-r last:border-r-0"
          >
            <!-- 虚拟滚动模式：单列 >= virtualThreshold 时启用 -->
            <div
              v-if="columnVirtualEnabled[level]"
              v-bind="columnVirtuals[level].containerProps.value"
              :style="{ height: `${columnHeight}px`, position: 'relative', overflowY: 'auto' }"
              role="listbox"
            >
              <div v-bind="columnVirtuals[level].spacerProps.value">
                <div
                  :style="{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    transform: `translateY(${columnVirtuals[level].visibleItems.value.length > 0 ? (columnVirtuals[level].visibleItems.value[0] as any).offsetY : 0}px)`,
                  }"
                >
                  <div
                    v-for="vItem in columnVirtuals[level].visibleItems.value"
                    :key="(vItem as any).key"
                    :aria-selected="activePath[level]?.value === (vItem.data as CascaderOption).value"
                    :class="
                      cn(
                        'flex cursor-pointer items-center justify-between px-3 py-2 text-sm transition-colors',
                        activePath[level]?.value === (vItem.data as CascaderOption).value ? 'bg-muted font-medium text-foreground' : 'hover:bg-muted/50',
                        (vItem.data as CascaderOption).disabled && 'cursor-not-allowed opacity-40',
                      )
                    "
                    :style="{ height: `${itemHeight}px` }"
                    role="option"
                    @click="handleSelect(vItem.data as CascaderOption, level, !((vItem.data as CascaderOption).children?.length))"
                    @mouseenter="props.expandTrigger === 'hover' && (vItem.data as CascaderOption).children?.length && (activePath = activePath.slice(0, level))"
                  >
                    <span class="truncate">{{ (vItem.data as CascaderOption).label }}</span>
                    <ChevronRight
                      v-if="(vItem.data as CascaderOption).children?.length"
                      class="text-muted-foreground size-3.5 shrink-0"
                    />
                  </div>
                </div>
              </div>
            </div>

            <!-- 非虚拟模式：全量渲染（列 < virtualThreshold） -->
            <ul
              v-else
              class="max-h-64 overflow-y-auto py-1"
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
        </div>
      </template>
    </div>
  </div>
</template>
