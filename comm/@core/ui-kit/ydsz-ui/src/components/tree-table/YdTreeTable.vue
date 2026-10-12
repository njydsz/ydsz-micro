<script lang="ts">
/**
 * YdTreeTable —— 树形表格复合组件，封装树形展开/收起、懒加载、勾选级联、拖拽排序等能力。
 *
 * <p>与 YdDataTable 的 treeConfig 模式相比，本组件提供：
 * <ul>
 *   <li>更简洁的 API —— 无需手动处理树形扁平化</li>
 *   <li>受控 / 非受控展开态</li>
 *   <li>父子级联勾选（支持 checkStrictly 独立模式）</li>
 *   <li>懒加载（lazy + loadData）</li>
 *   <li>行内拖拽排序</li>
 *   <li>连接线视觉辅助</li>
 * </ul>
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\components\tree-table\YdTreeTable.vue
 * @author ydsz-team
 * @since 26.10.17
 */

import type {
  TreeFlatRow,
  YdTreeTableColumnDef,
  YdTreeTableEmits,
  YdTreeTableProps,
  YdTreeTableRef,
} from './types';

import type { CSSProperties } from 'vue';

import { computed, ref, watch } from 'vue';

import {
  YdTable,
  YdTableBody,
  YdTableCell,
  YdTableHead,
  YdTableHeader,
  YdTableRow,
} from '../../primitives/table';

import { useDragSort } from '../../composables/use-drag-sort';
</script>

<script lang="ts" setup generic="T extends Record<string, unknown>">
import { useLocale } from '../../locale/useLocale';

defineOptions({ name: 'YdTreeTable' });

/* ============================================================ */
/* Props / Emits                                                  */
/* ============================================================ */

const props = withDefaults(defineProps<YdTreeTableProps<T>>(), {
  childrenKey: 'children',
  checkStrictly: false,
  checkable: false,
  class: '',
  defaultCheckedKeys: () => [],
  defaultExpandedKeys: () => [],
  draggable: false,
  indentSize: 24,
  lazy: false,
  loadingKeys: () => [],
  rowKey: 'id',
  showLine: true,
  treeColumnIndex: 0,
});

const emit = defineEmits<YdTreeTableEmits>();

const { t } = useLocale();

/* ============================================================ */
/* Internal State                                                 */
/* ============================================================ */

/** 展开 keys（非受控模式内部状态） */
const internalExpandedKeys = ref<Set<string>>(new Set(props.defaultExpandedKeys));

/** 勾选 keys 集合 */
const checkedKeys = ref<Set<string>>(new Set(props.defaultCheckedKeys));

/** 半选 keys 集合（子节点部分选中） */
const halfCheckedKeys = ref<Set<string>>(new Set());

/** 懒加载内部 loading key 集合 */
const internalLoadingKeys = ref<Set<string>>(new Set());

/** 懒加载后追加的子节点（key -> children） */
const lazyChildrenMap = ref<Record<string, T[]>>({});

/** 响应 props.defaultExpandedKeys 变化 */
watch(
  () => props.defaultExpandedKeys,
  (keys) => {
    internalExpandedKeys.value = new Set(keys);
  },
);

/** 响应 props.defaultCheckedKeys 变化 */
watch(
  () => props.defaultCheckedKeys,
  (keys) => {
    checkedKeys.value = new Set(keys);
    halfCheckedKeys.value = new Set();
    recomputeHalfChecked();
  },
);

/* ============================================================ */
/* 节点查找映射                                                   */
/* ============================================================ */

/** 通过 key 快速查找节点 */
function buildNodeMap(
  data: T[],
  childrenKey: string,
  rowKeyField: string,
): Map<string, T> {
  const map = new Map<string, T>();
  function traverse(list: T[]): void {
    for (const item of list) {
      const key = String((item as Record<string, unknown>)[rowKeyField]);
      map.set(key, item);
      const children = (item as Record<string, unknown>)[childrenKey] as T[] | undefined;
      if (Array.isArray(children) && children.length > 0) {
        traverse(children);
      }
      // 懒加载追加的子节点
      const lazy = lazyChildrenMap.value[key];
      if (lazy) traverse(lazy);
    }
  }
  traverse(data);
  return map;
}

const nodeMap = computed<Map<string, T>>(() =>
  buildNodeMap(props.dataSource, props.childrenKey, props.rowKey),
);

/* ============================================================ */
/* 树形扁平化                                                     */
/* ============================================================ */

/** 获取节点的有效子节点（含懒加载追加的） */
function getEffectiveChildren(row: T, key: string): T[] {
  const raw = (row as Record<string, unknown>)[props.childrenKey] as T[] | undefined;
  const base = Array.isArray(raw) ? raw : [];
  const lazy = lazyChildrenMap.value[key];
  return lazy ? [...base, ...lazy] : base;
}

/** 递归扁平化 */
function flattenTree(
  list: T[],
  depth: number,
  parentKey: string | null,
  ancestorKeys: string[],
  expandedSet: Set<string>,
): TreeFlatRow<T>[] {
  const result: TreeFlatRow<T>[] = [];
  for (const row of list) {
    const key = String((row as Record<string, unknown>)[props.rowKey]);
    const children = getEffectiveChildren(row, key);
    const hasChildren = children.length > 0;
    result.push({
      ancestorKeys,
      depth,
      hasChildren,
      key,
      parentKey,
      row,
    });
    if (hasChildren && expandedSet.has(key)) {
      result.push(
        ...flattenTree(
          children,
          depth + 1,
          key,
          [...ancestorKeys, key],
          expandedSet,
        ),
      );
    }
  }
  return result;
}

/** 当前可见扁平行 */
const flatRows = computed<TreeFlatRow<T>[]>(() =>
  flattenTree(
    props.dataSource,
    0,
    null,
    [],
    internalExpandedKeys.value,
  ),
);

/* ============================================================ */
/* Expand / Collapse                                              */
/* ============================================================ */

function expandKey(key: string): void {
  if (internalExpandedKeys.value.has(key)) return;
  const next = new Set(internalExpandedKeys.value);
  next.add(key);
  internalExpandedKeys.value = next;
  emit('update:expandedKeys', Array.from(next));
  const node = nodeMap.value.get(key);
  if (node) emit('expand', key, node);
}

function collapseKey(key: string): void {
  if (!internalExpandedKeys.value.has(key)) return;
  const next = new Set(internalExpandedKeys.value);
  next.delete(key);
  internalExpandedKeys.value = next;
  emit('update:expandedKeys', Array.from(next));
  const node = nodeMap.value.get(key);
  if (node) emit('collapse', key, node);
}

function toggleExpand(key: string): void {
  if (internalExpandedKeys.value.has(key)) {
    collapseKey(key);
  } else {
    expandKey(key);
  }
}

function expandAll(): void {
  const allKeys = new Set<string>();
  function collect(list: T[]): void {
    for (const row of list) {
      const key = String((row as Record<string, unknown>)[props.rowKey]);
      const children = getEffectiveChildren(row, key);
      if (children.length > 0) {
        allKeys.add(key);
        collect(children);
      }
    }
  }
  collect(props.dataSource);
  internalExpandedKeys.value = allKeys;
  emit('update:expandedKeys', Array.from(allKeys));
}

function collapseAll(): void {
  internalExpandedKeys.value = new Set();
  emit('update:expandedKeys', []);
}

function expandNode(key: string): void {
  expandKey(key);
}

function collapseNode(key: string): void {
  collapseKey(key);
}

/* ============================================================ */
/* Lazy Load                                                      */
/* ============================================================ */

async function handleLazyLoad(key: string): Promise<void> {
  if (!props.lazy || !props.loadData) return;
  const node = nodeMap.value.get(key);
  if (!node) return;

  // 已有有效子节点 → 直接展开，不再加载
  const children = getEffectiveChildren(node, key);
  if (children.length > 0) {
    expandKey(key);
    return;
  }

  // 开始加载
  internalLoadingKeys.value = new Set(internalLoadingKeys.value).add(key);
  try {
    const loaded = await props.loadData(node);
    if (Array.isArray(loaded) && loaded.length > 0) {
      lazyChildrenMap.value = {
        ...lazyChildrenMap.value,
        [key]: [...(lazyChildrenMap.value[key] ?? []), ...loaded],
      };
      emit('load-success', key, loaded);
    }
    expandKey(key);
  } finally {
    const nextLoading = new Set(internalLoadingKeys.value);
    nextLoading.delete(key);
    internalLoadingKeys.value = nextLoading;
  }
}

/* ============================================================ */
/* Checkbox / Cascade                                             */
/* ============================================================ */

/** 获取节点的所有子孙 key */
function getDescendantKeys(row: T, key: string): string[] {
  const result: string[] = [];
  function collect(children: T[]): void {
    for (const child of children) {
      const ck = String((child as Record<string, unknown>)[props.rowKey]);
      result.push(ck);
      const grandChildren = getEffectiveChildren(child, ck);
      if (grandChildren.length > 0) collect(grandChildren);
    }
  }
  const directChildren = getEffectiveChildren(row, key);
  collect(directChildren);
  return result;
}

/** 获取节点的所有祖先 key */
function getAncestorKeys(flatRow: TreeFlatRow<T>): string[] {
  return flatRow.ancestorKeys;
}

/** 重新计算半选状态 */
function recomputeHalfChecked(): void {
  if (props.checkStrictly) {
    halfCheckedKeys.value = new Set();
    return;
  }
  const newHalf = new Set<string>();
  const currentChecked = checkedKeys.value;

  // 从每个叶子往上检查
  for (const row of flatRows.value) {
    if (!row.hasChildren) continue;
    const children = getEffectiveChildren(row.row, row.key);
    const childKeys = children.map(
      (c) => String((c as Record<string, unknown>)[props.rowKey]),
    );
    const checkedCount = childKeys.filter((k) => currentChecked.has(k)).length;
    if (checkedCount > 0 && checkedCount < childKeys.length) {
      newHalf.add(row.key);
    }
    if (checkedCount === childKeys.length && !currentChecked.has(row.key)) {
      // 所有子节点被选中但本节点未选中
      newHalf.add(row.key);
    }
  }

  halfCheckedKeys.value = newHalf;
}

function toggleCheckbox(flatRow: TreeFlatRow<T>): void {
  const key = flatRow.key;
  const isChecked = checkedKeys.value.has(key);
  const nextChecked = new Set(checkedKeys.value);

  if (isChecked) {
    nextChecked.delete(key);
  } else {
    nextChecked.add(key);
  }

  if (!props.checkStrictly) {
    // 级联子孙
    const descKeys = getDescendantKeys(flatRow.row, key);
    if (isChecked) {
      descKeys.forEach((k) => nextChecked.delete(k));
    } else {
      descKeys.forEach((k) => nextChecked.add(k));
    }

    // 级联祖先
    const ancestors = getAncestorKeys(flatRow);
    for (let i = ancestors.length - 1; i >= 0; i--) {
      const ancestorKey = ancestors[i]!;
      // 获取祖先节点
      const ancestorRow = flatRows.value.find((r) => r.key === ancestorKey);
      if (!ancestorRow) continue;
      const siblingChildren = getEffectiveChildren(ancestorRow.row, ancestorKey);
      const siblingKeys = siblingChildren.map(
        (c) => String((c as Record<string, unknown>)[props.rowKey]),
      );
      const allChecked = siblingKeys.every((k) => nextChecked.has(k));
      if (allChecked) {
        nextChecked.add(ancestorKey);
      } else {
        nextChecked.delete(ancestorKey);
      }
    }
  }

  checkedKeys.value = nextChecked;
  recomputeHalfChecked();
  emit('check-change', Array.from(nextChecked), Array.from(halfCheckedKeys.value));
}

function isChecked(key: string): boolean {
  return checkedKeys.value.has(key);
}

function isHalfChecked(key: string): boolean {
  return halfCheckedKeys.value.has(key);
}

function isNodeLoading(key: string): boolean {
  return (
    internalLoadingKeys.value.has(key) ||
    (props.loadingKeys ?? []).includes(key)
  );
}

/* ============================================================ */
/* Drag Sort                                                      */
/* ============================================================ */

const dragApi = useDragSort({
  items: () => flatRows.value,
  direction: 'vertical',
  threshold: 5,
  canDrag: (index) => {
    if (!props.draggable) return false;
    // 仅允许同层拖拽：限制 depth=0 才可拖拽
    return flatRows.value[index]?.depth === 0;
  },
  onReorder: ({ from, to }) => {
    emit('drag-end', from, to);
  },
});

/* ============================================================ */
/* Table Column 渲染辅助                                          */
/* ============================================================ */

/** 列的 YdTreeTableColumnDef 视图 */
function toRenderColumns(): Array<{
  key: string;
  label?: string;
  width?: number | string;
  align?: string;
  formatter?: YdTreeTableColumnDef<T>['formatter'];
}> {
  return props.columns.map((col) => ({
    align: col.align,
    formatter: col.formatter,
    key: col.key,
    label: col.label ?? col.key,
    width: col.width,
  }));
}

const renderColumns = computed(() => toRenderColumns());

/* ============================================================ */
/* Column 对齐 class                                              */
/* ============================================================ */

function alignClass(align?: string): string {
  switch (align) {
    case 'center': return 'text-center';
    case 'right': return 'text-right';
    default: return 'text-left';
  }
}

/* ============================================================ */
/* 渲染辅助：缩进 / 连接线 / 单元格取值                            */
/* ============================================================ */

/** 缩进 style：根据 depth 计算 paddingLeft */
function indentStyle(flatRow: TreeFlatRow<T>): CSSProperties {
  const baseIndent = flatRow.depth * props.indentSize;
  return {
    paddingLeft: `${baseIndent}px`,
  };
}

/** 判断某一层祖先是否还有后续兄弟（决定是否画竖线） */
function hasAncestorSibling(flatRow: TreeFlatRow<T>, depthLevel: number): boolean {
  if (depthLevel <= 0 || depthLevel > flatRow.ancestorKeys.length) return false;
  // 找到该层祖先节点
  const ancestorKey = flatRow.ancestorKeys[depthLevel - 1]!;
  const ancestorRow = flatRows.value.find((r) => r.key === ancestorKey);
  if (!ancestorRow) return false;
  // 祖先的父节点
  const grandParentKey = ancestorRow.parentKey;
  const siblings = grandParentKey
    ? getEffectiveChildren(
        flatRows.value.find((r) => r.key === grandParentKey)!.row,
        grandParentKey,
      )
    : props.dataSource;
  // 找到祖先在同辈中的位置
  const idx = siblings.findIndex(
    (s) => String((s as Record<string, unknown>)[props.rowKey]) === ancestorKey,
  );
  // 若祖先不是最后一个兄弟，则本层需画竖线
  return idx >= 0 && idx < siblings.length - 1;
}

/** 点击展开/折叠图标（含懒加载） */
function handleToggleExpand(flatRow: TreeFlatRow<T>): void {
  if (!flatRow.hasChildren && props.lazy) {
    handleLazyLoad(flatRow.key);
    return;
  }
  if (internalExpandedKeys.value.has(flatRow.key)) {
    collapseKey(flatRow.key);
  } else {
    expandKey(flatRow.key);
  }
}

/** 单元格 pointerdown —— 仅在 root 行第一列开启拖拽 */
function onCellPointerDown(event: PointerEvent, index: number): void {
  if (!props.draggable) return;
  const fRow = flatRows.value[index];
  if (!fRow || fRow.depth !== 0) return;
  if (dragApi.dragState.value.isDragging) return;
  handleRowDragDown(event, index);
}

/** 行拖拽（仅 root 行） */
function handleRowDragDown(event: PointerEvent, index: number): void {
  const itemProps = dragApi.getItemProps(index) as { onPointerdown?: (e: PointerEvent) => void };
  if (typeof itemProps.onPointerdown === 'function') {
    itemProps.onPointerdown(event);
  }
}

/** 获取单元格值（优先使用 formatter） */
function getCellValue(row: T, col: { key: string; formatter?: YdTreeTableColumnDef<T>['formatter'] }): unknown {
  if (col.formatter) {
    const raw = (row as Record<string, unknown>)[col.key];
    return col.formatter(row, { key: col.key } as YdTreeTableColumnDef<T>, raw, 0);
  }
  return (row as Record<string, unknown>)[col.key];
}

/** 格式化单元格显示文本 */
function formatCellValue(row: T, col: { key: string; formatter?: YdTreeTableColumnDef<T>['formatter'] }): string {
  const value = getCellValue(row, col);
  return value === null || value === undefined ? '' : String(value);
}

/* ============================================================ */
/* Expose                                                         */
/* ============================================================ */

defineExpose<YdTreeTableRef<T>>({
  collapseAll,
  collapseNode,
  expandAll,
  expandNode,
  getCheckedNodes: () => {
    return Array.from(checkedKeys.value)
      .map((k) => nodeMap.value.get(k))
      .filter((n): n is T => n !== undefined);
  },
  getHalfCheckedNodes: () => {
    return Array.from(halfCheckedKeys.value)
      .map((k) => nodeMap.value.get(k))
      .filter((n): n is T => n !== undefined);
  },
  toggleExpand,
});
</script>

<template>
  <div
    :class="[
      'yd-treetable relative w-full overflow-x-auto rounded-md border',
      props.class,
    ]"
    role="grid"
  >
    <YdTable class="w-full border-collapse">
      <!-- =============================================== -->
      <!-- 表头                                            -->
      <!-- =============================================== -->
      <YdTableHeader>
        <YdTableRow class="bg-muted/50 border-b">
          <!-- 展开/折叠列 -->
          <YdTableHead class="w-10 px-2 text-center font-medium">
            <button
              type="button"
              class="yd-treetable-expand-all inline-flex items-center justify-center rounded px-1 text-xs text-muted-foreground hover:text-text-primary focus:outline-none"
              :aria-label="t('tree.expandAll')"
              @click="expandAll"
            >
              +
            </button>
            <button
              type="button"
              class="yd-treetable-collapse-all ml-1 inline-flex items-center justify-center rounded px-1 text-xs text-muted-foreground hover:text-text-primary focus:outline-none"
              :aria-label="t('tree.collapseAll')"
              @click="collapseAll"
            >
              -
            </button>
          </YdTableHead>

          <!-- 可选 checkbox 列 -->
          <YdTableHead class="w-10 px-2" />

          <!-- 数据列头 -->
          <YdTableHead
            v-for="col in renderColumns"
            :key="col.key"
            :class="alignClass(col.align)"
            class="whitespace-nowrap font-medium"
          >
            {{ col.label }}
          </YdTableHead>
        </YdTableRow>
      </YdTableHeader>

      <!-- =============================================== -->
      <!-- 表体                                            -->
      <!-- =============================================== -->
      <YdTableBody>
        <!-- 空数据行 -->
        <YdTableRow v-if="flatRows.length === 0">
          <YdTableCell
            :colspan="renderColumns.length + (props.checkable ? 2 : 1)"
            class="py-12 text-center text-muted-foreground"
          >
            {{ t('tree.empty') }}
          </YdTableCell>
        </YdTableRow>

        <!-- 数据行 -->
        <!-- @vue-ignore YdTableRow 透传 data-* 拖拽钩子属性 -->
        <YdTableRow
          v-for="(fRow, idx) in flatRows"
          :key="fRow.key"
          :data-drag-sort-item="props.draggable && fRow.depth === 0 ? '' : undefined"
          :data-dragging="props.draggable && dragApi.dragState.value.isDragging && dragApi.dragState.value.fromIndex === idx ? true : undefined"
          :data-drag-over="props.draggable && dragApi.dragState.value.isDragging && dragApi.dragState.value.toIndex === idx && dragApi.dragState.value.fromIndex !== idx ? true : undefined"
          :class="['border-b transition-colors hover:bg-muted/25', props.draggable && dragApi.dragState.value.isDragging && dragApi.dragState.value.fromIndex === idx ? 'bg-muted/10' : '']"
        >
          <!-- === 第一列：展开/折叠 + 树形缩进 + 连接线 === -->
          <YdTableCell class="px-2 py-0">
            <span
              class="yd-treetable-indent-wrapper inline-flex items-center"
              :style="indentStyle(fRow)"
            >
              <!-- 连接线 (vertical lines for ancestors) -->
              <span
                v-if="props.showLine && fRow.depth > 0"
                class="yd-treetable-lines inline-flex"
              >
                <span
                  v-for="lineIdx in fRow.depth"
                  :key="lineIdx"
                  class="yd-treetable-vline inline-block"
                  :style="{
                    width: `${props.indentSize}px`,
                    marginLeft: lineIdx === fRow.depth ? '0' : '0',
                  }"
                >
                  <span
                    v-if="hasAncestorSibling(fRow, lineIdx)"
                    class="yd-treetable-vline-bar block h-full"
                  />
                </span>
              </span>

              <!-- Expand/Collapse icon -->
              <button
                type="button"
                class="yd-treetable-toggle size-4 flex shrink-0 items-center justify-center text-xs transition-colors hover:text-primary focus:outline-none"
                :class="{
                  'cursor-pointer': fRow.hasChildren,
                  'cursor-default': !fRow.hasChildren,
                }"
                :aria-expanded="internalExpandedKeys.has(fRow.key)"
                :aria-label="internalExpandedKeys.has(fRow.key) ? t('tree.collapseAll') : t('tree.expandAll')"
                @click="handleToggleExpand(fRow)"
              >
                <span v-if="isNodeLoading(fRow.key)" class="block size-3 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
                <span v-else-if="fRow.hasChildren">
                  {{ internalExpandedKeys.has(fRow.key) ? '\u25BC' : '\u25B6' }}
                </span>
                <span v-else class="size-4" />
              </button>
            </span>
          </YdTableCell>

          <!-- === 可选 checkbox 列 === -->
          <YdTableCell v-if="props.checkable" class="px-2">
            <input
              type="checkbox"
              :checked="isChecked(fRow.key)"
              :indeterminate="isHalfChecked(fRow.key)"
              class="size-4 rounded border-muted-foreground accent-primary"
              :aria-label="t('tree.checkedAll')"
              @change="toggleCheckbox(fRow)"
            />
          </YdTableCell>

          <!-- === 数据列（第一列在 treeColumnIndex=0 时显示展开列后面的内容） === -->
          <YdTableCell
            v-for="col in renderColumns"
            :key="col.key"
            :class="alignClass(col.align)"
            class="px-2 py-2 align-middle"
            @pointerdown="onCellPointerDown($event, idx)"
          >
            <slot
              :name="`cell-${col.key}`"
              :row="fRow.row"
              :column="col"
              :value="getCellValue(fRow.row, col)"
              :flat-row="fRow"
              :index="idx"
            >
              {{ formatCellValue(fRow.row, col) }}
            </slot>
          </YdTableCell>
        </YdTableRow>
      </YdTableBody>
    </YdTable>
  </div>
</template>

<style scoped>
/* ============================================================ */
/* 缩进 & 连接线                                                  */
/* ============================================================ */

.yd-treetable-indent-wrapper {
  height: 100%;
  min-height: 2.5rem;
}

/* 垂直连接线伪元素 */
.yd-treetable-vline {
  position: relative;
  height: 100%;
  min-height: 2.5rem;
  flex-shrink: 0;
}

.yd-treetable-vline-bar {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 50%;
  width: 1px;
  background-color: hsl(var(--ydsz-border-default, 215 20% 85%));
}

/* 展开/收起按钮 */
.yd-treetable-toggle {
  background: transparent;
  border: none;
  padding: 0;
  line-height: 1;
  color: hsl(var(--ydsz-text-secondary, 215 15% 45%));
}

.yd-treetable-toggle:hover {
  color: hsl(var(--ydsz-comp-bg, 220 90% 56%));
}

/* 全展开 / 全收起按钮 */
.yd-treetable-expand-all,
.yd-treetable-collapse-all {
  border: none;
  background: transparent;
  padding: 0;
  line-height: 1;
  font-weight: 600;
  transition: color 0.15s;
}

/* 拖拽态 */
[data-dragging='true'] {
  opacity: 0.7;
  background-color: hsl(var(--ydsz-surface-1, 0 0% 100%) / 0.6);
}

[data-drag-over='true'] {
  border-top: 2px solid hsl(var(--ydsz-comp-bg, 220 90% 56%));
}

/* 行 hover 时连接线加深 */
.yd-treetable:hover .yd-treetable-vline-bar {
  background-color: hsl(var(--ydsz-border-hover, 215 20% 75%));
}
</style>
