<script setup lang="ts">
/**
* YdTree —— 业务级树组件。
* 
 * <p>对标 Naive UI 的 Tree 组件，基于 ydz-vue 的 TreeRoot / TreeItem 无头原语：
 * - 通过 slot 注入自定义节点渲染（勾选框 + 图标 + 标题 + 展开箭头）；
 * - 通过拦截 onToggle 注入懒加载逻辑（loadData）；
 * - 通过双向绑定桥接 checkedKeys / expandedKeys / selectedKeys；
 * - 连接线、搜索高亮、默认展开在顶层处理并透传。
* 
 * @path comm\@core\ui-kit\ydsz-ui\src\ui\tree\tree.vue
 * @author ydsz-team
 * @since 26.10.11
 */
import type { Component, Slots, VNode } from 'vue';

import { computed, h, ref, watch } from 'vue';
import type { Ref } from 'vue';

import { TreeItem, TreeRoot } from '@ydsz-core/ydsz-vue';
import type { TreeRootEmits, TreeRootProps } from '@ydsz-core/ydsz-vue';

import { CheckboxRoot } from '@ydsz-core/ydsz-vue';

import type { TreeNodeData, TreeExpandTrigger, YdTreeEmits, YdTreeProps } from './tree-types';
import {
  computeExpandKeysOnSearch,
  defaultFilterMethod,
  fallbackKey,
  readExpandedKeysFromStorage,
  writeExpandedKeysToStorage,
} from './tree-utils';

defineOptions({ name: 'YdTree' });

const props = withDefaults(defineProps<YdTreeProps>(), {
  cancelable: false,
  checkStrictly: false,
  checkable: false,
  defaultExpandAll: false,
  expandTrigger: 'click',
  itemHeight: 32,
  multiple: true,
  showLine: false,
  virtualScrollThreshold: 500,
});

const emit = defineEmits<YdTreeEmits>();

/**
 * 规范化 getKey：优先使用 props.getKey，否则走内置兜底。
 * ydz-vue 的 props.getKey 签名是 (val: T) => string，类型参数 T 与 items 项类型对应。
 */
const resolveKey = (node: TreeNodeData, index: number): string => {
  if (props.getKey) {
    return String(props.getKey(node));
  }
  return fallbackKey(node, index);
};

/** 获取函数：返回节点的子节点数组 */
const getChildren = (node: TreeNodeData): TreeNodeData[] | undefined => {
  return node.children;
};

/**
 * 内部 items ref：支持异步加载时动态注入子节点。
 *
 * 当 loadData 返回子节点后，直接将子节点数组合并到对应树的节点上。
 * 为做到对象引用稳定（不破坏 Vue 响应式），通过原地修改实现。
 */
const innerData = ref<TreeNodeData[]>(props.data ?? []) as Ref<TreeNodeData[]>;

// 响应外部 data 变化
watch(
  () => props.data,
  (newData) => {
    innerData.value = newData ?? [];
  },
  { deep: false },
);

/**
 * 受控展开键：来自 props.expandedKeys，或由搜索驱动的内部扩展。
 */
const expandedKeys = ref<(string | number)[]>(props.expandedKeys ?? []);

// 初始化：如果有 storageKey，优先从 localStorage 恢复
if (props.expandedStorageKey) {
  const stored = readExpandedKeysFromStorage(props.expandedStorageKey);
  if (stored) {
    expandedKeys.value = stored;
  } else if (props.defaultExpandAll) {
    expandedKeys.value = collectAllKeys(innerData.value, getChildren, (node) => resolveKey(node, 0));
  }
} else if (props.defaultExpandAll && expandedKeys.value.length === 0) {
  expandedKeys.value = collectAllKeys(innerData.value, getChildren, (node) => resolveKey(node, 0));
}

/** 同步 props.expandedKeys → 内部状态 */
watch(
  () => props.expandedKeys,
  (val) => {
    if (val !== undefined) {
      expandedKeys.value = val;
    }
  },
);

/** 搜索关键字变化时，展开所有匹配节点以露出命中路径 */
const searchExpandKeys = ref<Set<string | number>>(new Set());
watch(
  () => props.searchValue,
  (keyword) => {
    const fn = props.filterMethod ?? defaultFilterMethod;
    const newExpandSet = computeExpandKeysOnSearch(
      innerData.value,
      keyword ?? '',
      (node) => resolveKey(node, 0),
      fn,
      getChildren,
    );
    searchExpandKeys.value = newExpandSet;
    // 搜索驱动的展开状态：不写入 localStorage，仅临时展示
    if (newExpandSet.size > 0) {
      const merged = new Set(expandedKeys.value);
      newExpandSet.forEach((k) => merged.add(k));
      expandedKeys.value = Array.from(merged);
    }
  },
);

/// 受控勾选键
const checkedKeysRef = ref<(string | number)[]>(props.checkedKeys ?? []);
watch(
  () => props.checkedKeys,
  (val) => {
    if (val !== undefined) {
      checkedKeysRef.value = val;
    }
  },
);

/// 受控选中键（单选场景）
const selectedKeysRef = ref<(string | number)[]>(props.selectedKeys ?? []);
watch(
  () => props.selectedKeys,
  (val) => {
    if (val !== undefined) {
      selectedKeysRef.value = val;
    }
  },
);

/** ydz-vue TreeRoot 需要的 items：把 TreeNodeData[] 直接传入即可 */
const treeItems = computed(() => innerData.value);

/** 暴露给 TreeRoot 的选中态桥接 */
const modelValueForTree = computed(() => {
  if (props.checkable) {
    return checkedKeysRef.value;
  }
  return selectedKeysRef.value;
});

/**
 * 折叠键来源 = 用户手动控制的 + 搜索驱动临时展开的。
 *
 * ydz-vue 的 expanded 参数要求 string[]，故做类型强转。
 */
const flattenedExpandedKeys = computed((): string[] => {
  return expandedKeys.value.map(String);
});

/** 节点总数（决定是否启用虚拟滚动） */
const totalNodeCount = computed(() => countNodes(innerData.value, getChildren));
const isVirtualEnabled = computed(() => totalNodeCount.value > props.virtualScrollThreshold);

/**
 * 异步加载：拦截展开事件。
 *
 * 当节点无子节点、isLeaf=false、存在 loadData 且未在加载中时触发 loadData。
 * 加载完成后把返回子节点写入对应节点的 children 数组。
 *
 * @param node 被展开的节点
 */
async function handleAsyncLoad(node: TreeNodeData): Promise<void> {
  const shouldLoad = !node.children?.length && !node.isLeaf && !!props.loadData && !node.loading;
  if (!shouldLoad) {
    return;
  }
  node.loading = true;
  try {
    const children = await props.loadData!(node);
    if (children && Array.isArray(children)) {
      node.children = children;
      // 强制触发响应式更新
      innerData.value = [...innerData.value];
    }
    emit('load', node);
  } finally {
    node.loading = false;
  }
}

/**
 * 节点展开/折叠处理。
 *
 * 提供给 TreeRoot 的 onToggle 回调；在切换展开状态的前后：
 * - 写入 storageKey（如果配置）；
 * - 触发异步加载（如果配置）；
 * - 向上冒泡 update:expandedKeys 事件。
 */
function handleToggle(node: TreeNodeData): void {
  const key = resolveKey(node, 0);
  const isCurrentlyExpanded = expandedKeys.value.includes(key);

  if (isCurrentlyExpanded) {
    // 折叠
    expandedKeys.value = expandedKeys.value.filter((k) => k !== key);
    emit('update:expandedKeys', expandedKeys.value);
    emit('collapse', node);
  } else {
    // 展开
    expandedKeys.value = [...expandedKeys.value, key];
    emit('update:expandedKeys', expandedKeys.value);
    emit('expand', node);
    // 异步加载
    handleAsyncLoad(node);
  }

  // 持久化
  if (props.expandedStorageKey) {
    writeExpandedKeysToStorage(props.expandedStorageKey, expandedKeys.value);
  }
}

/**
 * 勾选节点的处理。
 *
 * 从 ydz-vue 的 onSelect 桥接到 checkedKeys / selectedKeys。
 * 父子级联动由 ydz-vue 内置的 propagateSelect 处理（无 checkStrictly 配置时）。
 */
function handleCheck(node: TreeNodeData): void {
  const key = resolveKey(node, 0);
  const current = props.checkable ? checkedKeysRef.value : selectedKeysRef.value;
  const isSelected = current.includes(key);

  let newKeys: (string | number)[];
  if (props.checkable) {
    if (isSelected) {
      newKeys = current.filter((k) => k !== key);
    } else {
      newKeys = [...current, key];
    }
    checkedKeysRef.value = newKeys;
    emit('update:checkedKeys', newKeys);
  } else {
    // 单选场景：选中当前，取消其他
    if (props.multiple) {
      newKeys = isSelected ? current.filter((k) => k !== key) : [...current, key];
    } else {
      newKeys = isSelected ? [] : [key];
    }
    selectedKeysRef.value = newKeys;
    emit('update:selectedKeys', newKeys);
  }
}

/**
 * Row click 事件 —— 决定行为由 expandTrigger 决定。
 */
function handleRowClick(node: TreeNodeData, event: MouseEvent): void {
  emit('click', node, event);

  if (props.expandTrigger === 'click') {
    if (node.children?.length || node.isLeaf === false) {
      handleToggle(node);
    }
  }

  // 检查节点是否可选
  if (node.selectable !== false) {
    handleCheck(node);
  }
}

/**
 * 搜索高亮：将关键字包裹为 <mark> 标签。
 */
function highlightTitle(title: string, keyword: string | undefined): (string | VNode)[] {
  if (!keyword || !title) {
    return [title ?? ''];
  }
  const lowerTitle = title.toLowerCase();
  const lowerKeyword = keyword.toLowerCase();
  const idx = lowerTitle.indexOf(lowerKeyword);
  if (idx === -1) {
    return [title];
  }
  const before = title.slice(0, idx);
  const hit = title.slice(idx, idx + keyword.length);
  const after = title.slice(idx + keyword.length);
  const result: (string | VNode)[] = [];
  if (before) {
    result.push(before);
  }
  result.push(h('mark', { class: 'yd-tree-node__highlight', style: { color: 'inherit', backgroundColor: 'rgba(24,144,255,0.18)', padding: '0 2px', borderRadius: '2px' } }, hit));
  if (after) {
    result.push(...highlightTitle(after, keyword));
  }
  return result;
}

/**
 * 递归收集所有键（用于 defaultExpandAll）。
 */
function collectAllKeys(
  nodes: TreeNodeData[],
  getCh: (n: TreeNodeData) => TreeNodeData[] | undefined,
  getKeyFn: (n: TreeNodeData) => string,
): (string | number)[] {
  const keys: (string | number)[] = [];
  function walk(list: TreeNodeData[]) {
    for (const n of list) {
      keys.push(getKeyFn(n));
      const ch = getCh(n);
      if (ch && ch.length > 0) {
        walk(ch);
      }
    }
  }
  walk(nodes);
  return keys;
}

/**
 * 递归计数节点总数。
 */
function countNodes(
  nodes: TreeNodeData[],
  getCh: (n: TreeNodeData) => TreeNodeData[] | undefined,
): number {
  let count = 0;
  function walk(list: TreeNodeData[]) {
    for (const n of list) {
      count += 1;
      const ch = getCh(n);
      if (ch && ch.length > 0) {
        walk(ch);
      }
    }
  }
  walk(nodes);
  return count;
}

defineSlots<{
  default: (props: {
    node: TreeNodeData;
    level: number;
    isExpanded: boolean;
    isSelected: boolean;
    isChecked: boolean;
    isIndeterminate: boolean;
    isLoading: boolean;
    onToggle: () => void;
    onSelect: () => void;
  }) => unknown;
}>();

/** 暴露外部引用：编程式展开 / 折叠 / 加载子节点 */
defineExpose({
  /** 展开指定 key 的节点 */
  expand: (key: string | number) => {
    if (!expandedKeys.value.includes(key)) {
      expandedKeys.value = [...expandedKeys.value, key];
      emit('update:expandedKeys', expandedKeys.value);
    }
  },
  /** 折叠指定 key 的节点 */
  collapse: (key: string | number) => {
    expandedKeys.value = expandedKeys.value.filter((k) => k !== key);
    emit('update:expandedKeys', expandedKeys.value);
  },
  /** 展开全部 */
  expandAll: () => {
    expandedKeys.value = collectAllKeys(innerData.value, getChildren, (node) => resolveKey(node, 0));
    emit('update:expandedKeys', expandedKeys.value);
  },
  /** 折叠全部 */
  collapseAll: () => {
    expandedKeys.value = [];
    emit('update:expandedKeys', expandedKeys.value);
  },
});
</script>

<template>
  <TreeRoot
    :items="treeItems"
    :expanded="flattenedExpandedKeys"
    :model-value="(modelValueForTree as any)"
    :disabled="false"
    :multiple="props.multiple"
    :get-key="(node: any) => resolveKey(node as TreeNodeData, 0)"
    :get-children="(node: any) => (node as TreeNodeData).children"
    :propagate-select="!props.checkStrictly"
    :class="[
      'yd-tree',
      {
        'yd-tree--show-line': props.showLine,
        'yd-tree--checkable': props.checkable,
        'yd-tree--virtual': isVirtualEnabled,
      },
      props.class,
    ]"
    role="tree"
    @update:expanded="(val: string[]) => {
      expandedKeys.value = val;
      emit('update:expandedKeys', val);
      if (props.expandedStorageKey) {
        writeExpandedKeysToStorage(props.expandedStorageKey, val);
      }
    }"
  >
    <template #default="{ flattenItems }: { flattenItems: any[] }">
      <TreeItem
        v-for="item in flattenItems"
        :key="item._id"
        :value="item.value"
        :level="item.level"
        class="yd-tree-node"
      >
        <template #default="{ isExpanded, isSelected }: { isExpanded: boolean; isSelected: boolean }">
          <div
            class="yd-tree-node__row"
            :class="{
              'yd-tree-node__row--selected': isSelected,
              'yd-tree-node__row--disabled': item.value.disabled,
            }"
            role="treeitem"
            :aria-expanded="item.value.children?.length ? isExpanded : undefined"
            :aria-selected="isSelected"
            @click="(e: MouseEvent) => handleRowClick(item.value, e)"
            @dblclick="() => {
              if (props.expandTrigger === 'double') {
                handleToggle(item.value);
              }
            }"
          >
            <!-- 缩进占位 + 连接线 -->
            <span
              v-for="i in item.level - 1"
              :key="i"
              class="yd-tree-node__indent"
              aria-hidden="true"
            >
              <span v-if="props.showLine" class="yd-tree-node__line" />
            </span>

            <!-- 展开/折叠箭头 -->
            <button
              type="button"
              class="yd-tree-node__expand-arrow"
              :class="{ 'yd-tree-node__expand-arrow--expanded': isExpanded }"
              :disabled="item.value.isLeaf === true && !item.value.children?.length"
              tabindex="-1"
              :aria-label="isExpanded ? '折叠当前节点' : '展开当前节点'"
              @click.stop="handleToggle(item.value)"
            >
              <template v-if="item.value.loading">
                <!-- loading spinner 占位：由 spin 组件渲染 -->
                <span class="yd-tree-node__loading-icon" aria-hidden="true">
                  <svg viewBox="0 0 16 16" width="12" height="12" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="8" cy="8" r="6" stroke="currentColor" stroke-opacity="0.25" stroke-width="2" />
                    <path d="M8 2a6 6 0 0 1 6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
                  </svg>
                </span>
              </template>
              <template v-else>
                <svg
                  v-if="(item.value.children?.length || item.value.isLeaf === false)"
                  viewBox="0 0 16 16"
                  width="12"
                  height="12"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M6 4l4 4-4 4V4z" />
                </svg>
                <span v-else class="yd-tree-node__leaf-dot" aria-hidden="true" />
              </template>
            </button>

            <!-- 勾选框（仅当 checkable=true） -->
            <template v-if="props.checkable">
              <CheckboxRoot
                class="yd-tree-node__checkbox"
                :checked="checkedKeysRef.includes(resolveKey(item.value, 0))"
                :disabled="item.value.checkboxDisabled || item.value.disabled"
                @update:checked="(_val: boolean) => handleCheck(item.value)"
                @click.stop
              />
            </template>

            <!-- 节点图标（自定义或默认） -->
            <span v-if="item.value.icon" class="yd-tree-node__icon" aria-hidden="true">
              <component :is="item.value.icon" v-if="typeof item.value.icon !== 'string'" />
              <span v-else>{{ item.value.icon }}</span>
            </span>

            <!-- 节点标题 -->
            <span class="yd-tree-node__title">
              <template v-for="(part, idx) in highlightTitle(String(item.value.title ?? ''), props.searchValue)" :key="idx">
                <component :is="part as any" v-if="typeof part !== 'string' && part !== ''" />
                <template v-else>{{ part }}</template>
              </template>
            </span>
          </div>
        </template>
      </TreeItem>
    </template>
  </TreeRoot>
</template>

<style scoped>
.yd-tree {
  font-size: 14px;
  line-height: 1.5;
}

.yd-tree--show-line .yd-tree-node__indent {
  position: relative;
}

.yd-tree-node {
  list-style: none;
}

.yd-tree-node__row {
  display: flex;
  align-items: center;
  min-height: 32px;
  padding: 0 4px;
  border-radius: 4px;
  cursor: pointer;
  user-select: none;
  transition: background-color 0.2s;
}

.yd-tree-node__row:hover {
  background-color: var(--yd-color-bg-hover, rgba(0, 0, 0, 0.04));
}

.yd-tree-node__row--selected {
  background-color: var(--yd-color-primary-bg-subtle, rgba(24, 144, 255, 0.12));
}

.yd-tree-node__row--disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.yd-tree-node__indent {
  display: inline-flex;
  width: 20px;
  height: 100%;
  flex-shrink: 0;
}

.yd-tree-node__line {
  position: absolute;
  left: 9px;
  top: 0;
  bottom: 0;
  width: 1px;
  background-color: var(--yd-color-border, #e5e7eb);
}

.yd-tree-node__expand-arrow {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  margin: 0 2px;
  padding: 0;
  border: none;
  background: transparent;
  cursor: pointer;
  border-radius: 2px;
  transition: transform 0.2s;
  flex-shrink: 0;
}

.yd-tree-node__expand-arrow:hover {
  background-color: var(--yd-color-bg-hover, rgba(0, 0, 0, 0.06));
}

.yd-tree-node__expand-arrow--expanded {
  transform: rotate(90deg);
}

.yd-tree-node__loading-icon {
  display: inline-flex;
  animation: yd-tree-spin 0.8s linear infinite;
}

@keyframes yd-tree-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.yd-tree-node__leaf-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: var(--yd-color-text-tertiary, #c0c4cc);
}

.yd-tree-node__checkbox {
  display: inline-flex;
  margin-right: 4px;
  flex-shrink: 0;
}

.yd-tree-node__icon {
  display: inline-flex;
  margin-right: 4px;
  color: var(--yd-color-text-secondary, #606266);
  flex-shrink: 0;
}

.yd-tree-node__title {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

mark.yd-tree-node__highlight {
  background-color: rgba(24, 144, 255, 0.18);
  color: inherit;
  padding: 0 2px;
  border-radius: 2px;
}
</style>
