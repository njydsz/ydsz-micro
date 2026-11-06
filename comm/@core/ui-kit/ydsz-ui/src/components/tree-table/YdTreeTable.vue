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

import type { YdTreeTableEmits, YdTreeTableProps, YdTreeTableRef } from './types';
</script>

<script lang="ts" setup generic="T extends Record<string, unknown>">
import { useLocale } from '../../locale/useLocale';
import { useTreeTableCore } from './use-tree-table-core';

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
/* Core Logic（提取到 useTreeTableCore）                          */
/* ============================================================ */

const {
  alignClass,
  collapseAll,
  collapseNode,
  expandAll,
  expandNode,
  flatRows,
  formatCellValue,
  fromIndex,
  getCellValue,
  getCheckedNodes,
  getHalfCheckedNodes,
  handleToggleExpand,
  hasAncestorSibling,
  indentStyle,
  internalExpandedKeys,
  isChecked,
  isDragging,
  isHalfChecked,
  isNodeLoading,
  onCellPointerDown,
  renderColumns,
  toIndex,
  toggleExpand,
  toggleCheckbox,
} = useTreeTableCore<T>({ emit, props });

/* ============================================================ */
/* Expose                                                         */
/* ============================================================ */

defineExpose<YdTreeTableRef<T>>({
  collapseAll,
  collapseNode,
  expandAll,
  expandNode,
  getCheckedNodes,
  getHalfCheckedNodes,
  toggleExpand,
});
</script>

<template>
  <div
    :class="['yd-treetable relative w-full overflow-x-auto rounded-md border', props.class]"
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
              class="yd-treetable-expand-all text-muted-foreground hover:text-text-primary inline-flex items-center justify-center rounded px-1 text-xs focus:outline-none"
              :aria-label="t('tree.expandAll')"
              @click="expandAll"
            >
              +
            </button>
            <button
              type="button"
              class="yd-treetable-collapse-all text-muted-foreground hover:text-text-primary ml-1 inline-flex items-center justify-center rounded px-1 text-xs focus:outline-none"
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
            class="text-muted-foreground py-12 text-center"
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
          :data-dragging="props.draggable && isDragging() && fromIndex() === idx ? true : undefined"
          :data-drag-over="
            props.draggable && isDragging() && toIndex() === idx && fromIndex() !== idx
              ? true
              : undefined
          "
          :class="[
            'hover:bg-muted/25 border-b transition-colors',
            props.draggable && isDragging() && fromIndex() === idx ? 'bg-muted/10' : '',
          ]"
        >
          <!-- === 第一列：展开/折叠 + 树形缩进 + 连接线 === -->
          <YdTableCell class="px-2 py-0">
            <span
              class="yd-treetable-indent-wrapper inline-flex items-center"
              :style="indentStyle(fRow)"
            >
              <!-- 连接线 (vertical lines for ancestors) -->
              <span v-if="props.showLine && fRow.depth > 0" class="yd-treetable-lines inline-flex">
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
                class="yd-treetable-toggle hover:text-primary flex size-4 shrink-0 items-center justify-center text-xs transition-colors focus:outline-none"
                :class="{
                  'cursor-pointer': fRow.hasChildren,
                  'cursor-default': !fRow.hasChildren,
                }"
                :aria-expanded="internalExpandedKeys.has(fRow.key)"
                :aria-label="
                  internalExpandedKeys.has(fRow.key) ? t('tree.collapseAll') : t('tree.expandAll')
                "
                @click="handleToggleExpand(fRow)"
              >
                <span
                  v-if="isNodeLoading(fRow.key)"
                  class="border-muted-foreground block size-3 animate-spin rounded-full border-2 border-t-transparent"
                />
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
              class="border-muted-foreground accent-primary size-4 rounded"
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
  background-color: hsl(var(--ydsz-surface-1, 0 0% 100%) / 60%);
}

[data-drag-over='true'] {
  border-top: 2px solid hsl(var(--ydsz-comp-bg, 220 90% 56%));
}

/* 行 hover 时连接线加深 */
.yd-treetable:hover .yd-treetable-vline-bar {
  background-color: hsl(var(--ydsz-border-hover, 215 20% 75%));
}
</style>
