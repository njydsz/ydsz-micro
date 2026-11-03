<script setup lang="ts">
/**
* 数据表格组件：语义 HTML 容器 + 列驱动渲染 + 排序支持。
* 
* <p>使用方式：
* <ol>
*   <li><b>列驱动</b>（推荐）：&lt;YdTable :data="rows"&gt; + &lt;YdTableColumn&gt; 子组件，
*   父级自动渲染 thead/tbody，配合 border/stripe/size/max-height/loading 等属性。</li>
*   <li><b>语义插槽</b>：直接使用 YdTableHeader/YdTableBody/YdTableRow/YdTableCell 等子组件填充，
*   此时 YdTable 仅提供 overflow 容器。</li>
* </ol>
* 
* <p>支持列排序（表头点击触发 sort-change 事件，由调用方处理排序逻辑），
* 列固定(左/右)、列显隐、列宽调整等高级特性通过 YdTableColumn 的属性配置。
* 
* a11y：使用原生 &lt;table&gt; 语义，屏幕阅读器自动识别行列关系。
* 
* <p>脚本核心逻辑（列注册 / 排序 / 样式 / 虚拟滚动 / 列宽拖拽）已提取至
* {@link useTableCore}，本组件仅保留 props / emits 声明与模板渲染。
* 
* @path comm\@core\ui-kit\ydsz-ui\src\ui\table\YdTable.vue
* @author ydsz-team
* @since 1.0.0 (4.2.0 新增列驱动，26.09.17 增强排序)
*/
import { useSlots } from 'vue';

import { cn } from '@ydsz-core/shared/utils';

import { alignClass, useTableCore } from './use-table-core';

import { useLocale } from '../../locale/useLocale';

const { t } = useLocale();

defineOptions({ name: 'YdTable' });

interface Props {
  /** 行数据数组（列驱动模式必须） */
  data?: Record<string, unknown>[];
  /** 整个表格的宽度，默认 '100%' */
  width?: string;
  /** 显示外边框与单元格边框 */
  border?: boolean;
  /** 隔行变色 */
  stripe?: boolean;
  /** 密度：default / small / large */
  size?: 'default' | 'small' | 'large';
  /** 最大高度（超出时表头固定、表体滚动） */
  maxHeight?: string | number;
  /** 加载状态（显示 loading 遮罩） */
  loading?: boolean;
  /** 空数据文本 */
  emptyText?: string;
  /** 自定义类名 */
  class?: string;
  /** 行数据的唯一 key 字段，用于 :key 绑定 */
  rowKey?: string;
  /** 空数据文本，同 empty-text（兼容 EP 习惯拼写） */
  emptyTextCompat?: string;
  /** 当前排序列的 prop */
  sortProp?: string;
  /** 当前排序方向 */
  sortOrder?: 'asc' | 'desc' | null;
  /** 开启虚拟滚动（大数据量场景） */
  virtual?: boolean;
  /** 虚拟滚动单行高度（px），默认 40 */
  itemHeight?: number;
  /** 虚拟滚动缓冲区行数，默认 5 */
  overscan?: number;
  /** 虚拟滚动视口高度（px），默认 400（也可由 maxHeight 推导） */
  viewportHeight?: number;
  /** 聚合行数据 */
  summaryData?: Record<string, unknown>;
  /** 开启列宽拖拽调整 */
  columnResizable?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  border: false,
  columnResizable: false,
  itemHeight: 40,
  loading: false,
  overscan: 5,
  size: 'default',
  sortOrder: null,
  viewportHeight: 400,
  virtual: false,
  width: '100%',
});

const emit = defineEmits<{
  /** 列排序变更事件：调用方处理后重新传入 sortProp / sortOrder */
  'sort-change': [prop: string, order: 'asc' | 'desc' | null];
}>();

const slots = useSlots();

const {
  borderClass,
  columnCount,
  columnResize,
  dataHasItems,
  displayEmptyText,
  getSortIcon,
  handleSort,
  hasColumns,
  isVirtualActive,
  orderedColumns,
  sizeClass,
  startColumnResize,
  virtualList,
  wrapperStyle,
} = useTableCore({ emit, props });

defineExpose({
  columnWidths: columnResize.columnWidths,
  columns: orderedColumns,
});
</script>

<template>
  <div
    class="relative w-full overflow-auto"
    :style="wrapperStyle"
    @scroll="isVirtualActive && virtualList.onScroll($event)"
  >
    <!-- 加载遮罩 -->
    <div
      v-if="loading"
      class="absolute inset-0 z-10 flex items-center justify-center bg-background/80 backdrop-blur-sm"
    >
      <div class="flex flex-col items-center gap-2">
        <div
          class="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"
        />
        <span class="text-sm text-muted-foreground">loading...</span>
      </div>
    </div>

    <!-- 当没有注册列时：回退到语义插槽模式（兼容原始 shadcn 用法） -->
    <template v-if="!hasColumns">
      <table
        :class="cn('w-full caption-bottom text-sm', borderClass, sizeClass, props.class)"
        :style="{ width }"
      >
        <slot />
      </table>
    </template>

    <!-- 列驱动渲染模式 -->
    <template v-else>
      <table
        :class="cn('w-full caption-bottom text-sm', borderClass, sizeClass, props.class)"
        :style="{ width }"
      >
        <!-- colgroup：各列宽度声明 -->
        <colgroup>
          <col
            v-for="(col, idx) in orderedColumns"
            :key="`col-${idx}`"
            :style="{
              width: col.width,
              minWidth: col.minWidth,
              maxWidth: col.maxWidth,
            }"
          />
        </colgroup>

        <!-- 表头 -->
        <thead :class="[isVirtualActive && 'sticky top-0 z-20 bg-background]', '[&_tr]:border-b']">
          <tr class="border-b transition-colors hover:bg-muted/50">
            <th
              v-for="(col, idx) in orderedColumns"
              :key="`th-${idx}`"
              :class="
                cn(
                  'h-10 px-2 align-middle font-medium text-muted-foreground',
                  columnResizable && 'relative',
                  alignClass(col.align),
                  col.fixed === 'left' && 'sticky left-0 z-10 bg-muted/50',
                  col.fixed === 'right' && 'sticky right-0 z-10 bg-muted/50',
                  col.isSortable && 'cursor-pointer select-none',
                )
              "
              :style="{
                width: columnResizable ? columnResize.getColumnWidthStyle(col.prop ?? String(idx)) : col.width,
                minWidth: col.minWidth,
                maxWidth: col.maxWidth,
              }"
              scope="col"
              :aria-sort="col.isSortable && sortProp === col.prop ? (sortOrder === 'asc' ? 'ascending' : sortOrder === 'desc' ? 'descending' : 'none') : undefined"
              @click="handleSort(col)"
            >
              <slot :name="`header-${col.prop ?? col.label ?? idx}`">
                <span class="inline-flex items-center gap-1">
                  {{ col.label ?? '' }}
                  <span
                    v-if="col.isSortable"
                    class="text-xs text-muted-foreground/50"
                    aria-hidden="true"
                  >
                    {{ getSortIcon(col) }}
                  </span>
                </span>
              </slot>
              <!-- 列宽拖拽手柄 -->
              <div
                v-if="columnResizable"
                class="absolute right-0 top-0 h-full w-1 cursor-col-resize select-none hover:bg-primary/30"
                :class="{ 'bg-primary/50': columnResize.resizingProp.value === (col.prop ?? String(idx)) }"
                role="separator"
                :aria-label="t('table.resizeColumn', { column: col.label || col.prop || idx })"
                @pointerdown="startColumnResize(col.prop ?? String(idx), $event)"
              />
            </th>
          </tr>
        </thead>

        <!-- 表体 -->
        <tbody class="[&_tr:last-child]:border-0">
          <!-- 虚拟滚动模式：仅渲染可见行 + spacer -->
          <template v-if="isVirtualActive">
            <!-- 顶部 spacer：偏移 -->
            <tr :style="{ height: `${virtualList.offsetY.value}px` }">
              <td :colspan="columnCount" class="border-0 p-0" />
            </tr>
            <!-- 可见行 -->
            <tr
              v-for="vItem in virtualList.visibleItems.value"
              :key="rowKey ? String(vItem.data[rowKey] ?? vItem.index) : `vrow-${vItem.index}`"
              :style="{ height: `${vItem.height}px` }"
              :class="
                cn(
                  'border-b transition-colors hover:bg-muted/50',
                  stripe && vItem.index % 2 === 1 && 'bg-muted/30',
                )
              "
            >
              <td
                v-for="(col, colIdx) in orderedColumns"
                :key="`cell-${vItem.index}-${colIdx}`"
                :class="
                  cn(
                    'px-2 py-2 align-middle',
                    alignClass(col.align),
                    col.fixed === 'left' && 'sticky left-0 bg-background',
                    col.fixed === 'right' && 'sticky right-0 bg-background',
                  )
                "
              >
                <template v-if="col.type === 'index'">
                  {{ vItem.index + 1 }}
                </template>
                <template v-else-if="slots[`col-${col.prop}`]">
                  <slot
                    :name="`col-${col.prop}`"
                    :row="vItem.data"
                    :index="vItem.index"
                    :value="col.prop ? vItem.data[col.prop] : undefined"
                  />
                </template>
                <template v-else>
                  <span
                    v-if="col.showOverflowTooltip"
                    :title="col.formatter ? String(col.formatter(vItem.data, col, col.prop ? vItem.data[col.prop] : undefined, vItem.index)) : col.prop ? String(vItem.data[col.prop] ?? '') : ''"
                    class="block truncate"
                  >
                    {{
                      col.formatter
                        ? col.formatter(vItem.data, col, col.prop ? vItem.data[col.prop] : undefined, vItem.index)
                        : col.prop ? (vItem.data[col.prop] ?? '') : ''
                    }}
                  </span>
                  <template v-else>
                    {{
                      col.formatter
                        ? col.formatter(vItem.data, col, col.prop ? vItem.data[col.prop] : undefined, vItem.index)
                        : col.prop ? (vItem.data[col.prop] ?? '') : ''
                    }}
                  </template>
                </template>
              </td>
            </tr>
            <!-- 底部 spacer：剩余高度 -->
            <tr :style="{ height: `${virtualList.totalHeight.value - virtualList.offsetY.value - (virtualList.visibleItems.value.reduce((sum, item) => sum + item.height, 0))}px` }">
              <td :colspan="columnCount" class="border-0 p-0" />
            </tr>
          </template>

          <!-- 常规模式：全量渲染 -->
          <template v-else>
            <tr
              v-for="(row, rowIdx) in data"
              v-show="dataHasItems"
              :key="rowKey ? row[rowKey] as string : `row-${rowIdx}`"
              :class="
                cn(
                  'border-b transition-colors hover:bg-muted/50',
                  stripe && rowIdx % 2 === 1 && 'bg-muted/30',
                )
              "
            >
              <td
                v-for="(col, colIdx) in orderedColumns"
                :key="`cell-${rowIdx}-${colIdx}`"
                :class="
                  cn(
                    'px-2 py-2 align-middle',
                    alignClass(col.align),
                    col.fixed === 'left' && 'sticky left-0 bg-background',
                    col.fixed === 'right' && 'sticky right-0 bg-background',
                  )
                "
              >
                <!-- 序号列 -->
                <template v-if="col.type === 'index'">
                  {{ rowIdx + 1 }}
                </template>
                <!-- 自定义插槽列 -->
                <template v-else-if="slots[`col-${col.prop}`]">
                  <slot
                    :name="`col-${col.prop}`"
                    :row="row"
                    :index="rowIdx"
                    :value="col.prop ? row[col.prop] : undefined"
                  />
                </template>
                <!-- 格式化/默认列 -->
                <template v-else>
                  <span
                    v-if="col.showOverflowTooltip"
                    :title="col.formatter ? String(col.formatter(row, col, col.prop ? row[col.prop] : undefined, rowIdx)) : col.prop ? String(row[col.prop] ?? '') : ''"
                    class="block truncate"
                  >
                    {{
                      col.formatter
                        ? col.formatter(row, col, col.prop ? row[col.prop] : undefined, rowIdx)
                        : col.prop ? (row[col.prop] ?? '') : ''
                    }}
                  </span>
                  <template v-else>
                    {{
                      col.formatter
                        ? col.formatter(row, col, col.prop ? row[col.prop] : undefined, rowIdx)
                        : col.prop ? (row[col.prop] ?? '') : ''
                    }}
                  </template>
                </template>
              </td>
            </tr>
          </template>

          <!-- 空数据占位 -->
          <tr v-if="!dataHasItems">
            <td :colspan="columnCount" class="h-24 text-center text-muted-foreground">
              <slot name="empty">
                <div class="flex flex-col items-center justify-center gap-1">
                  <span class="text-sm">{{ displayEmptyText }}</span>
                </div>
              </slot>
            </td>
          </tr>
        </tbody>

        <!-- 聚合行（summary slot） -->
        <tfoot
          v-if="summaryData && hasColumns"
          class="sticky bottom-0 bg-muted/50 font-medium [&>tr]:border-t"
        >
          <tr>
            <td
              v-for="(col, colIdx) in orderedColumns"
              :key="`summary-${colIdx}`"
              :class="cn('px-2 py-2 align-middle', alignClass(col.align))"
            >
              <slot
                :name="`summary-${col.prop ?? col.label ?? colIdx}`"
                :column="col"
                :value="col.prop ? summaryData[col.prop] : undefined"
              >
                {{ col.prop ? (summaryData[col.prop] ?? '') : '' }}
              </slot>
            </td>
          </tr>
        </tfoot>
      </table>
    </template>
  </div>
</template>
