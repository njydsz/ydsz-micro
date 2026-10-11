<!--
 * YdTreeSelect —— 树形选择器。
 *
 * <p>对标 Ant Design TreeSelect：
 * <ul>
 *   <li>下拉树形选择（单选/多选）</li>
 *   <li>虚拟滚动（大数据量）</li>
 *   <li>关键字搜索过滤</li>
 *   <li>多选标签展示</li>
 * </ul>
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\ui\tree-select\tree-select.vue
 * @author ydsz-team
 * @since 26.10.11
-->
<script setup lang="ts" generic="T">
import { computed, ref, watch } from 'vue';

import { CheckboxRoot } from '@ydsz-core/ydsz-vue';

import { useLocale } from '../../locale/useLocale';
import { useVirtualForList } from '../../composables/use-virtual-for-list';
import { ydTag } from '../tag';

import type { TreeNodeData } from '../tree/tree-types';
import {
  collectAllKeys,
  defaultFilterMethod,
  fallbackKey,
} from '../tree/tree-utils';

import type { TreeSelectEmits, TreeSelectExpose, TreeSelectProps } from './tree-select-types';

defineOptions({ name: 'YdTreeSelect' });

const props = withDefaults(defineProps<TreeSelectProps<T>>(), {
  checkStrictly: false,
  clearable: true,
  disabled: false,
  itemHeight: 32,
  multiple: false,
  onlyLeaf: false,
  searchable: true,
  showCheckAll: false,
  tagVariant: 'default',
  virtualScroll: true,
});

const emit = defineEmits<TreeSelectEmits<T>>();

const { t } = useLocale();

const innerData = ref<TreeNodeData[]>(props.data ?? []) as import('vue').Ref<TreeNodeData[]>;
const open = ref(false);
const searchKeyword = ref('');
const inputRef = ref<HTMLInputElement | null>(null);
const searchInputRef = ref<HTMLInputElement | null>(null);

// 受控值
const checkedKeys = ref<(string | number)[]>(normalizeValue(props.modelValue));

watch(
  () => props.modelValue,
  (val) => {
    checkedKeys.value = normalizeValue(val);
  },
);

watch(
  () => props.data,
  (val) => {
    innerData.value = val ?? [];
  },
);

function normalizeValue(val: T | T[] | undefined): (string | number)[] {
  if (val === undefined || val === null) {
    return [];
  }
  const arr = Array.isArray(val) ? val : [val];
  return arr.map((v) => String(v));
}

// 唯一键函数
function resolveKey(node: TreeNodeData, index: number): string {
  if (props.getKey) {
    return String(props.getKey(node));
  }
  return fallbackKey(node, index);
}

function resolveLabel(node: TreeNodeData): string {
  if (props.getLabel) {
    return String(props.getLabel(node));
  }
  return String(node.title ?? '');
}

// 过滤后的数据
const filteredData = computed((): TreeNodeData[] => {
  if (!searchKeyword.value.trim()) {
    return innerData.value;
  }
  const fn = props.searchMethod ?? defaultFilterMethod;
  const keyword = searchKeyword.value;
  function filter(nodes: TreeNodeData[]): TreeNodeData[] {
    const result: TreeNodeData[] = [];
    for (const node of nodes) {
      const children = node.children ? filter(node.children) : [];
      const selfMatched = fn(node, keyword);
      if (selfMatched || children.length > 0) {
        result.push({ ...node, children: children.length > 0 ? children : node.children });
      }
    }
    return result;
  }
  return filter(innerData.value);
});

// 虚拟滚动
const virtualHandler = useVirtualForList<TreeNodeData>({
  items: filteredData.value,
  itemHeight: props.itemHeight,
  threshold: props.virtualScroll ? 100 : Infinity,
  getKey: (item) => resolveKey(item, 0),
});

watch(
  () => filteredData.value,
  (newList) => {
    virtualHandler.raw.itemsRef.value = newList;
  },
);

// 选中状态推导
function isChecked(key: string | number): boolean {
  return checkedKeys.value.includes(key);
}

/** 计算某节点在 checkStrictly=false 时是否「半选」（部分子节点被选中） */
function isIndeterminate(node: TreeNodeData): boolean {
  if (props.checkStrictly) {
    return false;
  }
  const children = node.children;
  if (!children || children.length === 0) {
    return false;
  }
  const childKeys = collectAllKeys(children, (n) => n.children, (n) => resolveKey(n, 0));
  const checkedCount = childKeys.filter((k) => checkedKeys.value.includes(k)).length;
  return checkedCount > 0 && checkedCount < childKeys.length;
}

/** 获取选中节点对应的显示标签 */
const selectedLabels = computed((): string[] => {
  const labels: string[] = [];
  function walk(nodes: TreeNodeData[]) {
    for (const n of nodes) {
      const key = resolveKey(n, 0);
      if (checkedKeys.value.includes(key)) {
        // onlyLeaf：仅在叶子节点收集
        if (props.onlyLeaf) {
          const children = n.children;
          if (!children || children.length === 0) {
            labels.push(resolveLabel(n));
          }
        } else {
          labels.push(resolveLabel(n));
        }
      }
      if (n.children?.length) {
        walk(n.children);
      }
    }
  }
  walk(innerData.value);
  return labels;
});

// 已展示的标签数（折叠时）
const visibleTags = computed(() => {
  if (props.maxTagCount !== undefined && selectedLabels.value.length > props.maxTagCount) {
    return selectedLabels.value.slice(0, props.maxTagCount);
  }
  return selectedLabels.value;
});

const hiddenCount = computed(() => {
  if (props.maxTagCount !== undefined) {
    return Math.max(0, selectedLabels.value.length - props.maxTagCount);
  }
  return 0;
});

// 操作
function toggleOpen(): void {
  if (props.disabled) {
    return;
  }
  open.value = !open.value;
  if (open.value) {
    setTimeout(() => searchInputRef.value?.focus(), 50);
  }
}

/** 节点勾选切换 */
function toggleCheck(node: TreeNodeData): void {
  const key = resolveKey(node, 0);
  const currentIndex = checkedKeys.value.indexOf(key);
  let newKeys: (string | number)[];

  if (currentIndex >= 0) {
    // 取消勾选
    newKeys = checkedKeys.value.filter((k) => k !== key);
    // 非严格模式：同时移除所有子节点
    if (!props.checkStrictly && node.children?.length) {
      const childKeys = collectAllKeys(node.children, (n) => n.children, (n) => resolveKey(n, 0));
      newKeys = newKeys.filter((k) => !childKeys.includes(k));
    }
  } else {
    // 勾选
    if (props.multiple) {
      newKeys = [...checkedKeys.value, key];
    } else {
      newKeys = [key];
    }
    // 非严格模式：勾选父节点时同步全选子节点
    if (!props.checkStrictly && node.children?.length) {
      const childKeys = collectAllKeys(node.children, (n) => n.children, (n) => resolveKey(n, 0));
      const merged = new Set(newKeys);
      childKeys.forEach((k) => merged.add(k));
      newKeys = Array.from(merged);
    }
  }

  checkedKeys.value = newKeys;
  const result = newKeys as T[];
  emit('update:modelValue', props.multiple ? result : result[0]);
  emit('change', props.multiple ? result : result[0]);
}

/** 全选/取消全选 */
function toggleCheckAll(): void {
  const allKeys = collectAllKeys(innerData.value, (n) => n.children, (n) => resolveKey(n, 0));
  const allSelected = allKeys.every((k) => checkedKeys.value.includes(k));
  checkedKeys.value = allSelected ? [] : allKeys;
  const result = checkedKeys.value as T[];
  emit('update:modelValue', props.multiple ? result : result[0]);
  emit('change', props.multiple ? result : result[0]);
}

/** 移除某个已选项 */
function removeTag(key: string | number): void {
  checkedKeys.value = checkedKeys.value.filter((k) => k !== key);
}

/** 清空 */
function handleClear(): void {
  checkedKeys.value = [];
  emit('update:modelValue', undefined);
  emit('change', undefined);
}

/** 异步加载子节点 */
async function loadChildren(node: TreeNodeData): Promise<void> {
  if (!props.loadData || node.loading) {
    return;
  }
  node.loading = true;
  try {
    const children = await props.loadData(node);
    if (children && Array.isArray(children)) {
      node.children = children;
      innerData.value = [...innerData.value];
    }
    emit('load', node);
  } finally {
    node.loading = false;
  }
}

defineExpose<TreeSelectExpose>({
  focus: () => searchInputRef.value?.focus(),
  blur: () => searchInputRef.value?.blur(),
  clear: handleClear,
  loadChildren,
});

/** 展开节点的 key 集合（搜索时自动展开匹配节点） */
const searchExpandedKeys = ref<Set<string | number>>(new Set());
watch(
  () => searchKeyword.value,
  (keyword) => {
    if (!keyword.trim()) {
      searchExpandedKeys.value = new Set();
      return;
    }
    const keys = new Set<string | number>();
    function walk(nodes: TreeNodeData[], parentPath: TreeNodeData[] = []) {
      for (const n of nodes) {
        const selfMatched = defaultFilterMethod(n, keyword);
        const children = n.children;
        if (children && children.length > 0) {
          const childMatched = children.some((c) => collectAllKeys([c], (x) => x.children, (x) => resolveKey(x, 0)).length > 0 && defaultFilterMethod(c, keyword));
          if (selfMatched || childMatched) {
            parentPath.forEach((p) => keys.add(resolveKey(p, 0)));
            keys.add(resolveKey(n, 0));
          }
          walk(children, [...parentPath, n]);
        }
      }
    }
    walk(innerData.value);
    searchExpandedKeys.value = keys;
  },
);

// 当前所有展开键（响应式）
const expandedKeys = computed((): string[] => Array.from(searchExpandedKeys.value));

</script>

<template>
  <div
    class="yd-tree-select"
    :class="{
      'yd-tree-select--multiple': props.multiple,
      'yd-tree-select--open': open,
      'yd-tree-select--disabled': props.disabled,
    }"
  >
    <!-- 触发器 -->
    <button
      type="button"
      class="yd-tree-select__trigger"
      :class="{ 'yd-tree-select__trigger--placeholder': selectedLabels.length === 0 }"
      :disabled="props.disabled"
      @click="toggleOpen"
    >
      <!-- 已选标签 -->
      <span v-if="props.multiple && visibleTags.length > 0" class="yd-tree-select__tags">
        <slot name="tag" :labels="visibleTags">
          <ydTag
            v-for="label in visibleTags"
            :key="label"
            :variant="props.tagVariant === 'light' ? 'outline' : 'default'"
            closable
            @close="removeTag(label)"
          >
            {{ label }}
          </ydTag>
        </slot>
        <span v-if="hiddenCount > 0" class="yd-tree-select__tags-more">
          +{{ hiddenCount }}
        </span>
      </span>

      <!-- 单选展示文字 -->
      <span v-else-if="!props.multiple && selectedLabels.length > 0" class="yd-tree-select__single">
        {{ selectedLabels[0] }}
      </span>

      <!-- 占位 -->
      <span v-else class="yd-tree-select__placeholder">
        {{ props.placeholder ?? (t('placeholder') ?? '请选择') }}
      </span>

      <!-- 下拉箭头 -->
      <svg
        class="yd-tree-select__arrow"
        :class="{ 'yd-tree-select__arrow--open': open }"
        viewBox="0 0 16 16"
        width="12"
        height="12"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M4 6l4 4 4-4H4z" />
      </svg>

      <!-- 清空 -->
      <button
        v-if="props.clearable && selectedLabels.length > 0 && !props.disabled"
        type="button"
        class="yd-tree-select__clear"
        :aria-label="t('clear') ?? '清空'"
        @click.stop="handleClear"
      >
        <svg viewBox="0 0 16 16" width="12" height="12" fill="currentColor" aria-hidden="true">
          <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z" />
        </svg>
      </button>
    </button>

    <!-- 下拉面板 -->
    <Transition name="yd-tree-select-fade">
      <div v-show="open" class="yd-tree-select__dropdown" role="tree">
        <!-- 搜索框 -->
        <div v-if="props.searchable" class="yd-tree-select__search">
          <input
            ref="searchInputRef"
            v-model="searchKeyword"
            type="text"
            class="yd-tree-select__search-input"
            :placeholder="props.searchPlaceholder ?? (t('searchPlaceholder') ?? '搜索')"
            @input="emit('search', searchKeyword)"
          />
        </div>

        <!-- 全选 -->
        <div v-if="props.multiple && props.showCheckAll" class="yd-tree-select__checkall">
          <CheckboxRoot
            :checked="checkedKeys.length > 0 && checkedKeys.length === collectAllKeys(innerData, (n) => n.children, (n) => resolveKey(n, 0)).length"
            :indeterminate="checkedKeys.length > 0 && checkedKeys.length < collectAllKeys(innerData, (n) => n.children, (n) => resolveKey(n, 0)).length"
            @update:checked="toggleCheckAll"
          >
            <span>{{ t('checkAll') ?? '全选' }}</span>
          </CheckboxRoot>
        </div>

        <!-- 空数据 -->
        <div v-if="filteredData.length === 0" class="yd-tree-select__empty">
          {{ t('noData') ?? '无数据' }}
        </div>

        <!-- 树列表 -->
        <div v-else class="yd-tree-select__tree-container">
          <div
            v-for="node in filteredData"
            :key="resolveKey(node, 0)"
            class="yd-tree-select__node"
          >
            <div class="yd-tree-select__node-row" @click="toggleCheck(node)">
              <CheckboxRoot
                :checked="isChecked(resolveKey(node, 0))"
                :indeterminate="isIndeterminate(node)"
                :disabled="node.checkboxDisabled || node.disabled"
              />
              <span class="yd-tree-select__node-label">
                {{ resolveLabel(node) }}
              </span>
            </div>
            <!-- 子节点递归（仅简单两层，深层可用完整 Tree 组件替代） -->
            <div v-if="node.children?.length" class="yd-tree-select__node-children">
              <div
                v-for="child in node.children"
                :key="resolveKey(child, 0)"
                class="yd-tree-select__node-row"
                @click="toggleCheck(child)"
              >
                <CheckboxRoot
                  :checked="isChecked(resolveKey(child, 0))"
                  :indeterminate="isIndeterminate(child)"
                  :disabled="child.checkboxDisabled || child.disabled"
                />
                <span class="yd-tree-select__node-label">
                  {{ resolveLabel(child) }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.yd-tree-select {
  position: relative;
  display: inline-flex;
  width: 100%;
  font-size: 14px;
}

.yd-tree-select__trigger {
  display: flex;
  align-items: center;
  gap: 4px;
  width: 100%;
  min-height: 32px;
  padding: 0 28px 0 8px;
  border: 1px solid var(--yd-color-border, #dcdfe6);
  border-radius: 4px;
  background: var(--yd-color-bg, #fff);
  color: var(--yd-color-text-primary, #303133);
  cursor: pointer;
  transition: border-color 0.2s;
  text-align: left;
  font-size: inherit;
}

.yd-tree-select__trigger:hover {
  border-color: var(--yd-color-primary-hover, #40a9ff);
}

.yd-tree-select__trigger:focus-within {
  border-color: var(--yd-color-primary, #1890ff);
  box-shadow: 0 0 0 2px var(--yd-color-primary-bg-subtle, rgba(24, 144, 255, 0.12));
}

.yd-tree-select__trigger--placeholder {
  color: var(--yd-color-text-tertiary, #c0c4cc);
}

.yd-tree-select__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  align-items: center;
  flex: 1;
  overflow: hidden;
}

.yd-tree-select__tags-more {
  display: inline-flex;
  align-items: center;
  height: 22px;
  padding: 0 6px;
  font-size: 12px;
  background: var(--yd-color-bg-hover, #f5f7fa);
  border-radius: 4px;
  color: var(--yd-color-text-secondary, #606266);
}

.yd-tree-select__single {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.yd-tree-select__arrow {
  position: absolute;
  right: 8px;
  color: var(--yd-color-text-tertiary, #c0c4cc);
  transition: transform 0.2s;
  flex-shrink: 0;
}

.yd-tree-select__arrow--open {
  transform: rotate(180deg);
}

.yd-tree-select__clear {
  position: absolute;
  right: 22px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  padding: 0;
  border: none;
  background: transparent;
  cursor: pointer;
  color: var(--yd-color-text-tertiary, #c0c4cc);
  border-radius: 50%;
  flex-shrink: 0;
}

.yd-tree-select__clear:hover {
  color: var(--yd-color-text-secondary, #606266);
}

.yd-tree-select__dropdown {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  z-index: 100;
  width: 100%;
  max-height: 320px;
  overflow-y: auto;
  background: var(--yd-color-bg, #fff);
  border: 1px solid var(--yd-color-border, #e5e7eb);
  border-radius: 4px;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.08);
  padding: 4px 0;
}

.yd-tree-select__search {
  padding: 4px 8px;
  border-bottom: 1px solid var(--yd-color-border, #e5e7eb);
}

.yd-tree-select__search-input {
  width: 100%;
  height: 28px;
  padding: 0 8px;
  border: 1px solid var(--yd-color-border, #dcdfe6);
  border-radius: 4px;
  font-size: 13px;
  outline: none;
}

.yd-tree-select__search-input:focus {
  border-color: var(--yd-color-primary, #1890ff);
}

.yd-tree-select__checkall {
  padding: 4px 12px;
  border-bottom: 1px solid var(--yd-color-border, #e5e7eb);
}

.yd-tree-select__empty {
  padding: 12px;
  text-align: center;
  font-size: 13px;
  color: var(--yd-color-text-tertiary, #909399);
}

.yd-tree-select__tree-container {
  padding: 2px 0;
}

.yd-tree-select__node-row {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  cursor: pointer;
  transition: background-color 0.15s;
}

.yd-tree-select__node-row:hover {
  background-color: var(--yd-color-bg-hover, #f5f7fa);
}

.yd-tree-select__node-label {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 14px;
  color: var(--yd-color-text-primary, #303133);
}

.yd-tree-select__node-children .yd-tree-select__node-row {
  padding-left: 32px;
}

.yd-tree-select--disabled .yd-tree-select__trigger {
  background: var(--yd-color-bg-disabled, #f5f7fa);
  cursor: not-allowed;
}

.yd-tree-select-fade-enter-active,
.yd-tree-select-fade-leave-active {
  transition: opacity 0.2s ease, transform 0.15s ease;
}

.yd-tree-select-fade-enter-from,
.yd-tree-select-fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
