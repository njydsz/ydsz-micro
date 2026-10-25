<script setup lang="ts">
/**
 * YdTreeSelect —— 树形下拉选择器（层级展示 / 搜索 / 多选 / 键盘导航 / 虚拟滚动）。
 *
 * <p>此前它是「把整棵树拍平成一层」的简化实现：没有缩进、没有展开态、
 * 深层节点与父级关系丢失，键盘用户无法在树里移动，且整段被 @ts-nocheck 屏蔽。
 *
 * <p>现在按竞品（Ant Design TreeSelect / Element Plus el-tree-select）的语义重写，
 * 逻辑全部复用已测试的分层：
 *  - @see useTreeHeadless 负责扁平化与展开集合；
 *  - @see useTreeVirtual 负责「祖先已展开才可见」过滤 + 视口切片 + scrollToIndex；
 *  - @see useListboxKeyboard 负责 ↑↓/Home/End/Enter/Space/Escape 与单字符搜索；
 *  - 本组件只补树特有的 ←→（折叠/展开/回到父级）与 ARIA tree 语义。
 *
 * <p>数据契约保持不变（业务侧仍传 { label, value, children } 数组）：
 * defaultExpandLevel 缺省为「全部展开」，与原扁平展示看到的节点集合一致，
 * 传 1/2 可折叠深层节点。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\components\tree-select\YdTreeSelect.vue
 * @author ydsz-team
 * @since 1.0.0（5.7.0 重写：真实层级 / 键盘导航 / 虚拟滚动 / 多选标签）
 */
import { computed, nextTick, ref, useId, useTemplateRef, watch } from 'vue';

import { cn } from '@ydsz-core/shared/utils';

import { Check, ChevronDown, ChevronRight, CircleX } from '@ydsz-core/icons';

import { useListboxKeyboard } from '../../composables/use-listbox-keyboard';
import { useTreeVirtual } from '../../composables/use-tree-virtual';
import type { TreeFlatNode } from '../../headless/use-tree-headless';
import { useTreeHeadless } from '../../headless/use-tree-headless';
import { useLocale } from '../../locale/useLocale';
import { YdPopover, YdPopoverContent, YdPopoverTrigger } from '../popover';

/**
 * 树选择器节点。
 *
 * <p>用 type 而非 interface：headless 层的 TreeNodeLike 带索引签名，
 * interface 不会获得隐式索引签名，接入 vue-tsc 后会直接报类型不兼容。
 */
export type TreeSelectNode = {
  /** 子节点 */
  children?: TreeSelectNode[];
  /** 是否禁用（禁用项不可选中，键盘导航跳过） */
  disabled?: boolean;
  /** 显示文本 */
  label: string;
  /** 节点值 */
  value: string | number;
};

/** v-model 值类型：单选为标量，多选为数组 */
type TreeSelectModelValue = Array<string | number> | string | number | undefined;

/** 扁平节点别名 */
type FlatNode = TreeFlatNode<TreeSelectNode>;

interface Props {
  /** 树形数据源 */
  options?: TreeSelectNode[];
  /** 占位文本，缺省取词典 select.placeholder */
  placeholder?: string;
  /** 是否禁用 */
  disabled?: boolean;
  /** 是否多选 */
  multiple?: boolean;
  /** 是否显示搜索框 */
  showSearch?: boolean;
  /** 是否以复选框方式多选（等价于 multiple，保留旧 API） */
  treeCheckable?: boolean;
  /** 打开时默认展开的层级数，Infinity 表示全部展开 */
  defaultExpandLevel?: number;
  /** 多选触发区内最多展示的标签数，超出折叠为 +N */
  maxTagCount?: number;
  /** 是否允许清除 */
  allowClear?: boolean;
  /** 面板可视区高度（像素），虚拟滚动据此切片 */
  virtualHeight?: number;
  /** 单行高度（像素） */
  itemHeight?: number;
  /** 触发器类名 */
  class?: string;
}

const props = withDefaults(defineProps<Props>(), {
  allowClear: false,
  class: '',
  defaultExpandLevel: Number.POSITIVE_INFINITY,
  disabled: false,
  itemHeight: 32,
  maxTagCount: undefined,
  multiple: false,
  options: () => [],
  placeholder: undefined,
  showSearch: false,
  treeCheckable: false,
  virtualHeight: 256,
});

const emit = defineEmits<{
  /** 选中值变化 */
  change: [value: TreeSelectModelValue];
}>();

const modelValue = defineModel<TreeSelectModelValue>({ default: undefined });

const { t } = useLocale();

const uid = useId();
/** listbox 元素 id，供 aria-controls 与 aria-activedescendant 引用 */
const treeId = `${uid}-tree`;

const isOpen = ref(false);
const query = ref('');
const triggerRef = useTemplateRef<HTMLElement>('trigger');
const scrollElementRef = useTemplateRef<HTMLElement>('scrollElement');
const searchInputRef = useTemplateRef<HTMLInputElement>('searchInput');

/** 是否处于「多选」形态：treeCheckable 是旧 API，与 multiple 同义 */
const isMultiple = computed(() => props.multiple || props.treeCheckable);

const tree = useTreeHeadless<TreeSelectNode>({
  getChildren: (node) => node.children,
  getValue: (node) => node.value,
  treeData: () => props.options,
});

/** 当前已选值数组（单选归一为长度 0/1 的数组） */
const selectedValues = computed<(string | number)[]>(() => {
  const value = modelValue.value;
  if (Array.isArray(value)) return value;
  return value === undefined || value === null ? [] : [value];
});

/**
 * 按 defaultExpandLevel 重建展开集合：只展开限定层级内的父节点。
 *
 * @returns 无
 */
function applyDefaultExpand(): void {
  const level = props.defaultExpandLevel;
  const keys = tree.flattenedNodes.value
    .filter(node => node.hasChildren && node.level < level)
    .map(node => node.value);
  tree.expandedKeys.value = new Set(keys);
}

// options 常由接口异步回填，数据到达后重新套用默认展开层级
watch(() => props.options, applyDefaultExpand, { immediate: true });

/** 关键字命中集合；搜索时抹掉 parents，让 useTreeVirtual 忽略折叠态直接展示命中项 */
const searchHits = computed<FlatNode[]>(() => {
  const keyword = query.value.trim().toLowerCase();
  if (!keyword) return [];
  return tree.flattenedNodes.value
    .filter(node => node.data.label.toLowerCase().includes(keyword))
    .map(node => ({ ...node, parents: [] }));
});

/** 喂给虚拟滚动器的节点源：搜索态用命中集，否则用全树扁平集 */
const sourceNodes = computed<FlatNode[]>(() =>
  query.value.trim() ? searchHits.value : tree.flattenedNodes.value,
);

const virtual = useTreeVirtual<TreeSelectNode>({
  expandedKeys: tree.expandedKeys,
  flattenedNodes: sourceNodes,
  getScrollElement: () => scrollElementRef.value,
  itemHeight: props.itemHeight,
  overscan: 4,
  viewportHeight: props.virtualHeight,
});

/** 当前可见（祖先已展开或搜索命中）的节点序列，键盘导航与索引一一对应 */
const visibleNodes = virtual.expandedVisibleNodes;

/**
 * 第 index 个可见节点的元素 id。
 *
 * @param index - visibleNodes 中的索引
 * @returns 元素 id
 */
function nodeIdOf(index: number): string {
  return `${treeId}-node-${index}`;
}

/**
 * 把活动节点滚入视口。
 *
 * @param index - 目标索引
 * @returns 无
 */
function revealActive(index: number): void {
  if (!isOpen.value) return;
  virtual.scrollToIndex(index);
}

/**
 * 判断节点是否已选中。
 *
 * @param value - 节点 value
 * @returns 是否选中
 */
function isChecked(value: string | number): boolean {
  return selectedValues.value.includes(value);
}

/**
 * 键盘导航项：label 用于单字符搜索，disabled 用于跳过。
 *
 * @returns 归一化后的项数组
 */
const keyboardItems = computed(() =>
  visibleNodes.value.map(node => ({
    disabled: node.data.disabled,
    label: node.data.label,
    value: node.value,
  })),
);

/**
 * 提交新的选中集合到 v-model。
 *
 * <p>modelValue 是唯一事实源：渲染读取 selectedValues，外部受控改动由 props 回流。
 *
 * @param values - 选中的 value 数组
 * @returns 无
 */
function commit(values: (string | number)[]): void {
  const next = isMultiple.value ? values : (values.at(-1) ?? undefined);
  modelValue.value = next;
  emit('change', next);
}

/**
 * 切换节点选中态：单选写值并收面板，多选追加/移除且保持展开。
 *
 * @param node - 目标节点
 * @returns 无
 */
function toggleNode(node: FlatNode | undefined): void {
  if (!node || node.data.disabled) return;
  const current = selectedValues.value;
  const next = current.includes(node.value)
    ? current.filter(value => value !== node.value)
    : [...current, node.value];
  commit(next);
  if (!isMultiple.value) isOpen.value = false;
}

/**
 * 折叠/展开当前活动节点。
 *
 * <p>活动节点自身在列表中的位置不受其子孙增删影响（子孙排在其后），
 * 因此无需回写活动索引。
 *
 * @returns 无
 */
function toggleActiveExpand(): void {
  const node = visibleNodes.value[keyboard.activeIndex.value];
  if (!node?.hasChildren) return;
  tree.toggleExpand(node.value);
}

/**
 * 把活动项移到当前节点的父节点。
 *
 * @returns 无
 */
function moveActiveToParent(): void {
  const node = visibleNodes.value[keyboard.activeIndex.value];
  const parentValue = node?.parents.at(-1);
  if (parentValue === undefined) return;
  const parentIndex = visibleNodes.value.findIndex(item => item.value === parentValue);
  if (parentIndex >= 0) keyboard.setActiveIndex(parentIndex);
}

const keyboard = useListboxKeyboard({
  items: keyboardItems,
  onActiveChange: revealActive,
  onClose: () => {
    isOpen.value = false;
  },
  onSelect: index => toggleNode(visibleNodes.value[index]),
});

/**
 * ←→ 折叠/展开，其余按键交给 listbox 键盘层。
 *
 * @param event - 原生键盘事件
 * @returns 无
 */
function handleTreeKeydown(event: KeyboardEvent): void {
  const node = visibleNodes.value[keyboard.activeIndex.value];
  const isExpanded = node ? tree.expandedKeys.value.has(node.value) : false;

  if (event.key === 'ArrowRight') {
    event.preventDefault();
    if (node?.hasChildren && !isExpanded) {
      toggleActiveExpand();
    } else {
      keyboard.handleKeydown(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    }
    return;
  }
  if (event.key === 'ArrowLeft') {
    event.preventDefault();
    if (node?.hasChildren && isExpanded) {
      toggleActiveExpand();
    } else {
      moveActiveToParent();
    }
    return;
  }
  keyboard.handleKeydown(event);
}

/**
 * 面板键盘入口：搜索框内的可打印字符交给输入框本身。
 *
 * @param event - 原生键盘事件
 * @returns 无
 */
function handlePanelKeydown(event: KeyboardEvent): void {
  const isSearchInput = (event.target as HTMLElement | null)?.tagName === 'INPUT';
  if (isSearchInput && event.key.length === 1 && event.key !== ' ') return;
  handleTreeKeydown(event);
}

/**
 * 触发器键盘入口：折叠态下 Enter / Space / ArrowDown 展开面板。
 *
 * @param event - 原生键盘事件
 * @returns 无
 */
function handleTriggerKeydown(event: KeyboardEvent): void {
  if (props.disabled) return;
  if (['ArrowDown', 'Enter', ' '].includes(event.key)) {
    event.preventDefault();
    isOpen.value = true;
  }
}

/**
 * 悬停同步活动项，让鼠标与键盘共用同一个高亮来源。
 *
 * @param index - 可见列表中的索引
 * @returns 无
 */
function hoverNode(index: number): void {
  if (visibleNodes.value[index]?.data.disabled) return;
  keyboard.setActiveIndex(index);
}

/** 多选标签文本（受 maxTagCount 截断） */
const visibleTags = computed(() => {
  const labels = selectedValues.value.map(value => labelOf(value));
  if (props.maxTagCount === undefined) return labels;
  return labels.slice(0, props.maxTagCount);
});

/** 被折叠掉的多选标签数量 */
const hiddenTagCount = computed(() => {
  if (props.maxTagCount === undefined) return 0;
  return Math.max(0, selectedValues.value.length - props.maxTagCount);
});

/**
 * 回查某个 value 的展示文本。
 *
 * @param value - 节点 value
 * @returns label，查不到时退回字符串化的 value
 */
function labelOf(value: string | number): string {
  return tree.flattenedNodes.value.find(node => node.value === value)?.data.label ?? String(value);
}

/** 单选时触发区显示的文本 */
const displayLabel = computed(() =>
  selectedValues.value.length === 0 ? '' : labelOf(selectedValues.value[0] as string | number),
);

/** 是否已有选中值（控制清除按钮显隐） */
const hasValue = computed(() => selectedValues.value.length > 0);

/** 清除全部选择 */
function handleClear(): void {
  commit([]);
}

/** 移除一个多选标签 */
function removeTag(value: string | number): void {
  commit(selectedValues.value.filter(item => item !== value));
}

/** aria-activedescendant 目标 */
const activeDescendant = computed(() =>
  keyboard.activeIndex.value >= 0 ? nodeIdOf(keyboard.activeIndex.value) : undefined,
);

/** 关闭后清活动态与关键字；打开且有搜索框时把焦点交给输入框 */
watch(isOpen, async (open) => {
  if (!open) {
    keyboard.resetActive();
    query.value = '';
    return;
  }
  if (props.showSearch) {
    await nextTick();
    searchInputRef.value?.focus();
  }
});

defineExpose({
  /** 聚焦触发器 */
  focus: () => triggerRef.value?.focus(),
  /** 清空选择 */
  clear: handleClear,
});
</script>

<template>
  <YdPopover v-model:open="isOpen">
    <YdPopoverTrigger as-child>
      <div
        ref="trigger"
        role="combobox"
        tabindex="0"
        aria-haspopup="tree"
        :aria-expanded="isOpen"
        :aria-controls="treeId"
        :aria-activedescendant="activeDescendant"
        :aria-disabled="props.disabled ? true : undefined"
        :class="cn(
          'flex w-full items-center justify-between gap-2 rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm',
          'focus:outline-none focus-visible:ring-1 focus-visible:ring-primary/50',
          props.disabled && 'cursor-not-allowed opacity-50',
          props.class,
        )"
        data-testid="tree-select-trigger"
        @keydown="handleTriggerKeydown"
      >
        <!-- 多选：标签 + 折叠计数 -->
        <span v-if="isMultiple" class="flex min-w-0 flex-1 flex-wrap items-center gap-1">
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
              @click.stop.prevent="removeTag(selectedValues[tagIdx] as string | number)"
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
      :class="cn('min-w-[var(--radix-popover-trigger-width)] w-auto p-1')"
      @keydown="handlePanelKeydown"
    >
      <input
        v-if="props.showSearch"
        ref="searchInput"
        v-model="query"
        type="text"
        class="mb-1 w-full rounded border border-input bg-transparent px-2 py-1 text-sm outline-none focus-visible:ring-1 focus-visible:ring-primary/50"
        :aria-label="t('select.search')"
        :placeholder="t('select.search')"
        data-testid="tree-select-search"
      />

      <div
        ref="scrollElement"
        :id="treeId"
        role="tree"
        :aria-multiselectable="isMultiple ? true : undefined"
        :aria-label="props.placeholder ?? t('select.placeholder')"
        :style="virtual.containerStyle.value"
        data-testid="tree-select-tree"
        @scroll="virtual.onScroll"
      >
        <p
          v-if="visibleNodes.length === 0"
          class="text-muted-foreground py-6 text-center text-sm"
        >
          {{ t('select.empty') }}
        </p>

        <div :style="virtual.spacerStyle.value">
          <div
            v-for="item in virtual.visibleSlice.value"
            :id="nodeIdOf(item.index)"
            :key="item.key"
            role="treeitem"
            :aria-level="item.data.level + 1"
            :aria-expanded="item.data.hasChildren ? tree.expandedKeys.value.has(item.data.value) : undefined"
            :aria-selected="isChecked(item.data.value)"
            :aria-disabled="item.data.data.disabled ? true : undefined"
            :class="cn(
              'flex cursor-default items-center gap-1 rounded-sm pr-2 text-sm outline-none select-none',
              'hover:bg-accent/60',
              keyboard.activeIndex.value === item.index && 'bg-accent',
              isChecked(item.data.value) && 'font-medium text-primary',
              item.data.data.disabled && 'pointer-events-none opacity-50',
            )"
            :style="{
              height: `${props.itemHeight}px`,
              left: 0,
              position: 'absolute',
              right: 0,
              top: `${item.offsetY}px`,
            }"
            :data-testid="`tree-node-${item.data.value}`"
            @click="toggleNode(item.data)"
            @mouseenter="hoverNode(item.index)"
          >
            <!-- 层级缩进 -->
            <span :style="{ width: `${item.data.level * 16}px` }" aria-hidden="true" />

            <button
              v-if="item.data.hasChildren"
              type="button"
              class="shrink-0 cursor-pointer p-0.5 opacity-60 hover:opacity-100"
              :aria-label="tree.expandedKeys.value.has(item.data.value) ? t('common.collapse') : t('common.expand')"
              data-testid="node-switcher"
              @click.stop.prevent="tree.toggleExpand(item.data.value)"
            >
              <ChevronRight
                :size="14"
                :class="cn('transition-transform', tree.expandedKeys.value.has(item.data.value) && 'rotate-90')"
              />
            </button>
            <span v-else class="w-4 shrink-0" aria-hidden="true" />

            <span class="min-w-0 flex-1 truncate">{{ item.data.data.label }}</span>

            <Check
              v-if="!isMultiple && isChecked(item.data.value)"
              :size="14"
              class="text-primary shrink-0"
              aria-hidden="true"
            />
          </div>
        </div>
      </div>
    </YdPopoverContent>
  </YdPopover>
</template>
