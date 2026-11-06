<script setup lang="ts" generic="V extends string | number = string">
/**
 * YdSelectSmart —— options 驱动的开箱选择器（单选 / 多选 / 搜索 / 虚拟滚动 / 远程搜索 / tag 创建）。
 *
 * <p>本组件是选择器家族里唯一面向业务的「数据驱动」入口（表单、YdProTable 搜索栏都用它）。
 * 此前它只是 headless radix Select 的薄封装，因此缺少竞品标配能力：
 *  - radix Select 结构上不支持多选，`multiple` 无从谈起；
 *  - 大数据量下拉没有虚拟滚动，1000+ 选项一次性挂载 DOM；
 *  - styled 层没有任何 `@keydown` 实现，键盘用户无法在选项间移动。
 *
 * <p>5.7.0 起改为 Popover + Listbox 实现（与 Ant Design Vue / Element Plus 的多选 Select 同构）：
 *  - 选择语义取自 @see useSelectHeadless（纯逻辑层，已有独立测试）；
 *  - 键盘导航取自 @see useListboxKeyboard（ArrowUp/Down/Home/End/Enter/Space/Escape + 单字符搜索）；
 *  - 超长列表用 @see useVirtualList 只渲染可见窗口，并用 scrollToIndex 保证键盘可达；
 *  - ARIA 走 combobox + listbox + option 的 APG 组合框模式，活动项用 aria-activedescendant 播报。
 *
 * <p>新增能力：
 *  - `allowCreate`：输入不匹配时创建新选项（tag 模式）；
 *  - `remote` + `remoteMethod`：远程搜索，结果去重缓存；
 *  - `filterOption`：自定义匹配函数。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\components\select\YdSelectSmart.vue
 * @author ydsz-team
 * @since 5.6.0（5.7.0 重写：多选 / 搜索 / 虚拟滚动 / 键盘导航）
 */
import { computed, nextTick, ref, useId, useTemplateRef, watch } from 'vue';

import { cn } from '@ydsz-core/shared/utils';

import { Check, ChevronDown, CircleX } from '@ydsz-core/icons';

import { useListboxKeyboard } from '../../composables/use-listbox-keyboard';
import { useVirtualScrollItems } from '../../composables/use-virtual-scroll-items';
import { useVirtualList } from '../../composables/use-virtual-list';
import { useSelectHeadless } from '../../headless/use-select-headless';
import { useLocale } from '../../locale/useLocale';
import { YdPopover, YdPopoverContent, YdPopoverTrigger } from '../popover';

/**
 * 选择项。
 */
export interface SelectSmartOption<V = string | number> {
  /** 是否禁用（禁用项不可选中，键盘导航跳过） */
  disabled?: boolean;
  /** 显示文本 */
  label: string;
  /** 选项值 */
  value: V;
}

/** v-model 值类型：单选为标量，多选为数组 */
type SelectModelValue<V> = V[] | V | undefined;

/** 渲染用的选项包装：保留其在过滤后列表中的真实索引 */
interface RenderedOption<V> {
  data: SelectSmartOption<V>;
  index: number;
}

interface Props<V extends string | number = string> {
  /** 选项数据 */
  options?: SelectSmartOption<V>[];
  /** 占位文本，缺省取词典 select.placeholder */
  placeholder?: string;
  /** 是否允许清除 */
  allowClear?: boolean;
  /** 是否多选 */
  multiple?: boolean;
  /** 是否显示搜索框（输入即按 label 过滤） */
  search?: boolean;
  /**
   * 是否允许创建新选项（输入转选项 / tag 模式）
   *
   * 仅在 search + multiple 场景下生效。用户输入不匹配任何选项时，
   * 可创建一个以输入文本为 label 与 value 的新选项。
   * @default false
   */
  allowCreate?: boolean;
  /**
   * 是否远程搜索
   *
   * 开启后，输入关键字会调用 `remoteMethod` 获取远端选项，
   * 而非本地过滤 `options`。结果自动去重缓存。
   * @default false
   */
  remote?: boolean;
  /**
   * 远程搜索方法（remote=true 时必传）
   *
   * @param query - 搜索关键字
   * @returns 远端选项数组
   */
  remoteMethod?: (query: string) => Promise<SelectSmartOption<V>[]> | SelectSmartOption<V>[];
  /** 远程搜索防抖时长（毫秒） @default 300 */
  remoteDebounce?: number;
  /**
   * 自定义过滤函数
   *
   * 不传时默认用 label 包含匹配（不区分大小写）。
   */
  filterOption?: (input: string, option: SelectSmartOption<V>) => boolean;
  /** 多选时触发区内最多展示的标签数，超出折叠为 +N */
  maxTagCount?: number;
  /** 是否禁用 */
  disabled?: boolean;
  /** 是否加载中 */
  loading?: boolean;
  /** 强制开/关虚拟滚动；缺省时按 virtualThreshold 自动判断 */
  virtual?: boolean;
  /** 虚拟滚动可视区高度（像素） */
  virtualHeight?: number;
  /** 单项高度（像素），虚拟滚动据此估算偏移 */
  itemHeight?: number;
  /** 启用虚拟滚动的选项数阈值 */
  virtualThreshold?: number;
  /** 触发器类名 */
  class?: string;
}

const props = withDefaults(defineProps<Props<V>>(), {
  allowClear: false,
  allowCreate: false,
  class: '',
  disabled: false,
  filterOption: undefined,
  itemHeight: 32,
  loading: false,
  maxTagCount: undefined,
  multiple: false,
  options: () => [],
  placeholder: undefined,
  remote: false,
  remoteDebounce: 300,
  remoteMethod: undefined,
  search: false,
  virtual: undefined,
  virtualHeight: 256,
  virtualThreshold: 100,
});

const emit = defineEmits<{
  /** 选项变化（单选回传标量，多选回传数组） */
  change: [value: SelectModelValue<V>];
  /** 创建新选项 */
  create: [option: SelectSmartOption<V>];
}>();

const modelValue = defineModel<SelectModelValue<V>>({ default: undefined });

const { t } = useLocale();

const uid = useId();
/** listbox 元素 id，供 aria-controls 与 aria-activedescendant 引用 */
const listboxId = `${uid}-listbox`;

const isOpen = ref(false);
const query = ref('');
const scrollElementRef = useTemplateRef<HTMLElement>('scrollElement');
const searchInputRef = useTemplateRef<HTMLInputElement>('searchInput');

/** 选中判定与值切换复用已测试的 headless 逻辑层 */
const selection = useSelectHeadless<Record<string, unknown>>({
  getLabel: (item) => String(item.label ?? ''),
  getKey: (item) => item.value as string | number,
  getValue: (item) => item.value as string | number,
  items: () => props.options as unknown as Record<string, unknown>[],
});

/* ============================================================ */
/* 远程搜索                                                       */
/* ============================================================ */

/** 远程搜索缓存：key = 关键字，value = 选项数组 */
const remoteCache = ref<Map<string, SelectSmartOption<V>[]>>(new Map());
/** 远程搜索加载态 */
const remoteLoading = ref(false);
/** 远程搜索结果 */
const remoteOptions = ref<SelectSmartOption<V>[]>([]);
/** 防抖计时器 */
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * 执行远程搜索（带防抖）。
 *
 * @param keyword - 搜索关键字
 * @returns 无
 */
function doRemoteSearch(keyword: string): void {
  if (!props.remote || !props.remoteMethod) return;
  const trimmed = keyword.trim();

  // 命中缓存直接复用
  const cached = remoteCache.value.get(trimmed);
  if (cached) {
    remoteOptions.value = cached;
    return;
  }

  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(async () => {
    remoteLoading.value = true;
    try {
      const result = await props.remoteMethod!(trimmed);
      // 去重合并到缓存
      const existing = remoteCache.value.get(trimmed) ?? [];
      const merged = [...existing];
      const seen = new Set(merged.map((o) => o.value));
      result.forEach((o) => {
        if (!seen.has(o.value)) merged.push(o);
      });
      remoteCache.value.set(trimmed, merged);
      remoteOptions.value = merged;
    } finally {
      remoteLoading.value = false;
    }
  }, props.remoteDebounce);
}

/* ============================================================ */
/* 过滤 + 创建                                                   */
/* ============================================================ */

/** 本地选项（含远程结果） */
const mergedOptions = computed<SelectSmartOption<V>[]>(() => {
  if (!props.remote) return props.options;
  // 远程模式：合并远端结果，去重
  const seen = new Set<V>();
  const result: SelectSmartOption<V>[] = [];
  [...props.options, ...remoteOptions.value].forEach((o) => {
    if (!seen.has(o.value)) {
      seen.add(o.value);
      result.push(o);
    }
  });
  return result;
});

/** 是否允许创建（需 search + multiple） */
const canCreate = computed(() => props.allowCreate && props.multiple && props.search);

/** 默认过滤函数 */
function defaultFilter(input: string, option: SelectSmartOption<V>): boolean {
  return option.label.toLowerCase().includes(input.toLowerCase());
}

/** 过滤后的候选项 */
const filteredOptions = computed<SelectSmartOption<V>[]>(() => {
  const keyword = query.value.trim();
  if (!keyword) return mergedOptions.value;
  const filter = props.filterOption ?? defaultFilter;
  return mergedOptions.value.filter((item) => filter(keyword, item));
});

/** 可创建的新选项（输入不匹配时） */
const creatableOption = computed<SelectSmartOption<V> | null>(() => {
  if (!canCreate.value) return null;
  const keyword = query.value.trim();
  if (!keyword) return null;
  // 已有同 label 选项时不显示创建入口
  const exists = mergedOptions.value.some((o) => o.label.toLowerCase() === keyword.toLowerCase());
  if (exists) return null;
  return { label: keyword, value: keyword as V };
});

/**
 * 是否处于虚拟滚动模式。
 */
const { enableVirtual: virtualItemsActive } = useVirtualScrollItems(() => filteredOptions.value, {
  threshold: props.virtualThreshold,
});

const isVirtualActive = computed(() => {
  if (props.virtual !== undefined) return props.virtual && filteredOptions.value.length > 0;
  return virtualItemsActive.value;
});

const virtualList = useVirtualList<SelectSmartOption<V>>(() => filteredOptions.value, {
  getScrollElement: () => scrollElementRef.value,
  getKey: (item) => item.value,
  itemHeight: props.itemHeight,
  overscan: 6,
  viewportHeight: props.virtualHeight,
});

/** 实际渲染的选项：虚拟模式取可见窗口，否则全量 */
const renderedOptions = computed<RenderedOption<V>[]>(() => {
  if (!isVirtualActive.value) {
    return filteredOptions.value.map((data, index) => ({ data, index }));
  }
  return virtualList.visibleItems.value.map((item) => ({ data: item.data, index: item.index }));
});

/** 多选时已选值数组（单选归一为长度 0/1 的数组） */
const selectedValueList = computed(() => {
  const value = modelValue.value;
  if (Array.isArray(value)) return value;
  return value === undefined || value === null ? [] : [value];
});

/**
 * 第 index 个选项的元素 id。
 */
function optionIdOf(index: number): string {
  return `${listboxId}-opt-${index}`;
}

/**
 * 把活动项滚入视口。
 */
function revealActive(index: number): void {
  if (!isOpen.value) return;
  if (isVirtualActive.value) {
    virtualList.scrollToIndex(index);
    return;
  }
  document.getElementById(optionIdOf(index))?.scrollIntoView({ block: 'nearest' });
}

/**
 * 判断选项是否已选中。
 */
function isOptionSelected(option: SelectSmartOption<V>): boolean {
  return selection.isSelected(
    modelValue.value as string | number | (string | number)[],
    option.value,
    props.multiple,
  );
}

/**
 * 选项行类名。
 */
function optionClass(index: number, option: SelectSmartOption<V>): string {
  return cn(
    'flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none',
    'hover:bg-accent/60',
    keyboard.activeIndex.value === index && 'bg-accent',
    isOptionSelected(option) && 'text-primary font-medium',
    option.disabled && 'pointer-events-none opacity-50',
  );
}

/** 多选标签文本（受 maxTagCount 截断） */
const visibleTags = computed(() => {
  const labels = selectedValueList.value.map((value) =>
    selection.getLabelByValue(value as string | number),
  );
  if (props.maxTagCount === undefined) return labels;
  return labels.slice(0, props.maxTagCount);
});

/** 被折叠掉的多选标签数量 */
const hiddenTagCount = computed(() => {
  if (props.maxTagCount === undefined) return 0;
  return Math.max(0, selectedValueList.value.length - props.maxTagCount);
});

/** 单选时触发区显示的文本 */
const displayLabel = computed(() => {
  const first = selectedValueList.value[0];
  return first === undefined ? '' : selection.getLabelByValue(first as string | number);
});

/** 是否已有选中值（控制清除按钮显隐） */
const hasValue = computed(() => selectedValueList.value.length > 0);

const keyboard = useListboxKeyboard({
  items: () => filteredOptions.value,
  onActiveChange: revealActive,
  onSelect: (index) => {
    const option = filteredOptions.value[index];
    if (option) selectOption(option);
  },
  onClose: () => {
    isOpen.value = false;
  },
});

/** 关闭后清活动态与关键字；打开且有搜索框时把焦点交给输入框 */
watch(isOpen, async (open) => {
  if (!open) {
    keyboard.resetActive();
    query.value = '';
    remoteOptions.value = [];
    return;
  }
  if (props.search) {
    await nextTick();
    searchInputRef.value?.focus();
  }
});

/** 远程搜索联动 */
watch(query, (value) => {
  if (props.remote) doRemoteSearch(value);
});

/**
 * 选中/取消一个选项。
 */
function selectOption(option: SelectSmartOption<V>): void {
  if (option.disabled) return;
  const next = selection.toggleItem(
    modelValue.value as string | number | (string | number)[],
    option.value,
    props.multiple,
  ) as SelectModelValue<V>;
  modelValue.value = next;
  emit('change', next);
  if (!props.multiple) isOpen.value = false;
}

/**
 * 创建并选中新选项。
 */
function handleCreate(): void {
  const option = creatableOption.value;
  if (!option) return;
  // 加入远程/本地选项集（通过 options 不可变，用 cache 承载）
  if (props.remote) {
    const key = query.value.trim();
    const existing = remoteCache.value.get(key) ?? [];
    remoteCache.value.set(key, [...existing, option]);
    remoteOptions.value = [...remoteOptions.value, option];
  }
  selectOption(option);
  emit('create', option);
  query.value = '';
}

/**
 * 移除一个多选标签。
 */
function removeTag(value: V): void {
  const next = selectedValueList.value.filter((item) => item !== value);
  modelValue.value = next;
  emit('change', next);
}

/** 清空选择 */
function handleClear(): void {
  const next = selection.clearValue(props.multiple) as SelectModelValue<V>;
  modelValue.value = next;
  emit('change', next);
}

/**
 * 面板键盘入口：搜索框内的可打印字符交给输入框本身，避免被单字符搜索重复消费。
 */
function handlePanelKeydown(event: KeyboardEvent): void {
  const isSearchInput = (event.target as HTMLElement | null)?.tagName === 'INPUT';
  if (isSearchInput && event.key.length === 1 && event.key !== ' ') return;
  // Enter 且有创建入口时优先创建
  if (event.key === 'Enter' && creatableOption.value) {
    event.preventDefault();
    handleCreate();
    return;
  }
  keyboard.handleKeydown(event);
}

/**
 * 触发器键盘入口：折叠态下 Enter / Space / ArrowDown 展开面板。
 */
function handleTriggerKeydown(event: KeyboardEvent): void {
  if (props.disabled) return;
  if (['Enter', ' ', 'ArrowDown'].includes(event.key)) {
    event.preventDefault();
    isOpen.value = true;
  }
}

/**
 * 悬停同步活动项，让鼠标与键盘共用同一个高亮来源。
 */
function hoverOption(index: number): void {
  if (filteredOptions.value[index]?.disabled) return;
  keyboard.setActiveIndex(index);
}

/** aria-activedescendant 目标 */
const activeDescendant = computed(() =>
  keyboard.activeIndex.value >= 0 ? optionIdOf(keyboard.activeIndex.value) : undefined,
);
</script>

<template>
  <YdPopover v-model:open="isOpen">
    <YdPopoverTrigger as-child>
      <div
        role="combobox"
        tabindex="0"
        aria-haspopup="listbox"
        :aria-expanded="isOpen"
        :aria-controls="listboxId"
        :aria-activedescendant="activeDescendant"
        :aria-disabled="props.disabled ? true : undefined"
        :class="
          cn(
            'border-input flex w-full items-center justify-between gap-2 rounded-md border bg-transparent px-3 py-2 text-sm shadow-sm',
            'focus-visible:ring-primary/50 focus:outline-none focus-visible:ring-1',
            props.disabled && 'cursor-not-allowed opacity-50',
            props.class,
          )
        "
        data-testid="select-trigger"
        @keydown="handleTriggerKeydown"
      >
        <!-- 多选：标签 + 折叠计数 -->
        <span v-if="props.multiple" class="flex min-w-0 flex-1 flex-wrap items-center gap-1">
          <span
            v-for="(label, tagIdx) in visibleTags"
            :key="`${uid}-tag-${tagIdx}`"
            class="bg-muted inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs"
          >
            <span class="max-w-32 truncate">{{ label }}</span>
            <button
              type="button"
              class="cursor-pointer opacity-60 hover:opacity-100"
              :aria-label="`${t('select.removeTag')} ${label}`"
              data-testid="tag-remove"
              @click.stop.prevent="removeTag(selectedValueList[tagIdx] as V)"
            >
              <CircleX :size="12" aria-hidden="true" />
            </button>
          </span>
          <span v-if="hiddenTagCount > 0" class="text-muted-foreground text-xs">
            +{{ hiddenTagCount }}
          </span>
          <span v-if="!hasValue" class="text-muted-foreground truncate">
            {{ props.placeholder ?? t('select.placeholder') }}
          </span>
        </span>

        <!-- 单选：直接显示文本 -->
        <span v-else class="flex-1 truncate text-left">
          <span v-if="displayLabel">{{ displayLabel }}</span>
          <span v-else class="text-muted-foreground">
            {{ props.placeholder ?? t('select.placeholder') }}
          </span>
        </span>

        <button
          v-if="props.allowClear && hasValue && !props.disabled"
          type="button"
          class="shrink-0 cursor-pointer opacity-50 transition-opacity hover:opacity-100"
          :aria-label="t('select.clear')"
          data-testid="clear-button"
          @click.stop.prevent="handleClear"
        >
          <CircleX :size="14" aria-hidden="true" />
        </button>

        <ChevronDown
          :size="16"
          aria-hidden="true"
          :class="cn('shrink-0 opacity-50 transition-transform', isOpen && 'rotate-180')"
        />
      </div>
    </YdPopoverTrigger>

    <YdPopoverContent
      align="start"
      :class="cn('w-auto min-w-[var(--radix-popover-trigger-width)] p-1')"
      @keydown="handlePanelKeydown"
    >
      <input
        v-if="props.search"
        ref="searchInput"
        v-model="query"
        type="text"
        class="border-input focus-visible:ring-primary/50 mb-1 w-full rounded border bg-transparent px-2 py-1 text-sm outline-none focus-visible:ring-1"
        role="combobox"
        :aria-expanded="isOpen"
        :aria-controls="listboxId"
        :aria-activedescendant="activeDescendant"
        :aria-label="t('select.search')"
        :placeholder="t('select.search')"
        data-testid="select-search"
      />

      <div
        v-if="props.loading || remoteLoading"
        class="text-muted-foreground flex items-center justify-center gap-2 py-6 text-sm"
        role="status"
        aria-live="polite"
      >
        <span class="yd-select-loading-spinner" aria-hidden="true" />
        {{ t('select.loading') }}
      </div>

      <div
        v-else
        :id="listboxId"
        ref="scrollElement"
        role="listbox"
        :aria-multiselectable="props.multiple ? true : undefined"
        :aria-label="t('select.placeholder')"
        :class="cn('overflow-y-auto', !isVirtualActive && 'max-h-64')"
        :style="isVirtualActive ? { height: `${props.virtualHeight}px` } : undefined"
        data-testid="select-listbox"
        @scroll="virtualList.onScroll"
      >
        <p
          v-if="filteredOptions.length === 0 && !creatableOption"
          class="text-muted-foreground py-6 text-center text-sm"
        >
          {{ t('select.empty') }}
        </p>

        <!-- 创建入口 -->
        <div
          v-if="creatableOption"
          role="option"
          :aria-selected="false"
          class="text-primary hover:bg-accent/60 flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none"
          data-testid="select-create"
          @click="handleCreate"
        >
          <span class="min-w-0 flex-1 truncate">+ {{ creatableOption.label }}</span>
        </div>

        <!-- 虚拟滚动：spacer 撑出总高度，可见项绝对定位 -->
        <div
          v-if="filteredOptions.length > 0 && isVirtualActive"
          :style="{ height: `${virtualList.totalHeight.value}px`, position: 'relative' }"
        >
          <div
            v-for="item in renderedOptions"
            :id="optionIdOf(item.index)"
            :key="item.data.value"
            role="option"
            :aria-selected="isOptionSelected(item.data)"
            :aria-disabled="item.data.disabled ? true : undefined"
            :class="optionClass(item.index, item.data)"
            :style="{
              height: `${props.itemHeight}px`,
              position: 'absolute',
              top: `${virtualList.offsetOf(item.index)}px`,
              left: 0,
              right: 0,
            }"
            @click="selectOption(item.data)"
            @mouseenter="hoverOption(item.index)"
          >
            <span class="min-w-0 flex-1 truncate">{{ item.data.label }}</span>
            <Check v-if="isOptionSelected(item.data)" :size="14" aria-hidden="true" />
          </div>
        </div>

        <!-- 普通模式：全量渲染 -->
        <template v-else-if="filteredOptions.length > 0">
          <div
            v-for="item in renderedOptions"
            :id="optionIdOf(item.index)"
            :key="item.data.value"
            role="option"
            :aria-selected="isOptionSelected(item.data)"
            :aria-disabled="item.data.disabled ? true : undefined"
            :class="optionClass(item.index, item.data)"
            @click="selectOption(item.data)"
            @mouseenter="hoverOption(item.index)"
          >
            <span class="min-w-0 flex-1 truncate">{{ item.data.label }}</span>
            <Check v-if="isOptionSelected(item.data)" :size="14" aria-hidden="true" />
          </div>
        </template>
      </div>
    </YdPopoverContent>
  </YdPopover>
</template>

<style scoped>
.yd-select-loading-spinner {
  width: 14px;
  height: 14px;
  border: 2px solid hsl(var(--primary) / 30%);
  border-top-color: hsl(var(--primary));
  border-radius: 50%;
  animation: yd-select-spin 0.8s linear infinite;
}

@keyframes yd-select-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
