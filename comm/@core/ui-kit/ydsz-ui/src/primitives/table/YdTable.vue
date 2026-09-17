<!--
 * 数据表格组件：语义 HTML 容器 + 列驱动渲染。
 *
 * <p>两种使用方式：
 * <ol>
 *   <li><b>列驱动</b>（推荐）：&lt;YdTable :data="rows"&gt; + &lt;YdTableColumn&gt; 子组件，
 *   父级自动渲染 thead/tbody，配合 border/stripe/size/max-height/loading 等属性。</li>
 *   <li><b>语义插槽</b>：直接使用 YdTableHeader/YdTableBody/YdTableRow/YdTableCell 等子组件填充，
 *   此时 YdTable 仅提供 overflow 容器。</li>
 * </ol>
 *
 * a11y：使用原生 &lt;table&gt; 语义，屏幕阅读器自动识别行列关系。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\ui\table\YdTable.vue
 * @author ydsz-team
 * @since 1.0.0 (4.2.0 新增列驱动)
 */
import { computed, provide, shallowRef, useSlots } from 'vue';

import { cn } from '@ydsz-core/shared/utils';

import { YD_TABLE_COLUMN_REGISTRY } from './injectionKeys';

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
  /** 奇偶行反转（新增） */
  isHidden?: boolean;
  /** 行数据的唯一 key 字段，用于 :key 绑定 */
  rowKey?: string;
  /** 空数据文本，同 empty-text（兼容 EP 习惯拼写） */
  emptyTextCompat?: string;
}

const props = withDefaults(defineProps<Props>(), {
  width: '100%',
  border: false,
  stripe: false,
  size: 'default',
  loading: false,
});

const slots = useSlots();

// ========== 列注册表（provide 给子级 YdTableColumn 注册） ==========
const columnMap = shallowRef(new Map<string, ColumnDef>());

const orderedColumns = computed(() => {
  const visible = Array.from(columnMap.value.values()).filter((col) => !col.isHidden);
  return visible;
});

const registry = {
  addColumn(id: string, column: ColumnDef) {
    columnMap.value.set(id, column);
    // 触发响应式（shallow ref 的 Map 替换为同一引用不触发更新）
    columnMap.value = new Map(columnMap.value);
  },
  removeColumn(id: string) {
    columnMap.value.delete(id);
    columnMap.value = new Map(columnMap.value);
  },
};

provide(YD_TABLE_COLUMN_REGISTRY, registry);

// ========== 样式 class ==========
const sizeClass = computed(() => {
  switch (props.size) {
    case 'small':
      return '[&_td]:py-1 [&_td]:px-2 [&_th]:py-1 [&_th]:px-2 text-xs';
    case 'large':
      return '[&_td]:py-3 [&_td]:px-4 [&_th]:py-3 [&_th]:px-4 text-base';
    default:
      return '';
  }
});

const alignClass = (align?: string) => {
  switch (align) {
    case 'center':
      return 'text-center';
    case 'right':
      return 'text-right';
    default:
      return 'text-left';
  }
};

// ========== 单元格值提取 ==========
function getCellValue(row: Record<string, unknown>, col: ColumnDef): unknown {
  if (col.formatter) return col.formatter(row, col, row[col.prop ?? ''], 0);
  if (col.type === 'index') return undefined;
  return col.prop ? row[col.prop] : undefined;
}

// ========== 计算最大列数（用于空数据行 colspan） ==========
const columnCount = computed(() => orderedColumns.value.length);

// ========== 判断是否有列注册（决定是否走列驱动渲染） ==========
const hasColumns = computed(() => columnCount.value > 0);

// ========== 表格外层容器样式 ==========
const wrapperStyle = computed(() => {
  if (props.maxHeight != null) {
    return { maxHeight: typeof props.maxHeight === 'number' ? `${props.maxHeight}px` : props.maxHeight };
  }
  return undefined;
});

const borderClass = computed(() => (props.border ? 'border border-collapse' : ''));

// ========== 获取实例引用中 YdTableColumn 的默认插槽函数 ==========
// 通过 uid 找到对应列的自定义渲染内容（从 slots 获取对应列 uid 的上下文）
function getColumnSlot(_uid?: number, _prop?: string) {
  // 简化：默认插槽通过 table slot 内提供列上下文；
  // 实际上 YdTableColumn 的逻辑通过 _uid 实现
  return undefined;
}

const dataHasItems = computed(() => (props.data?.length ?? 0) > 0);
const displayEmptyText = computed(() => props.emptyTextCompat ?? props.emptyText ?? '暂无数据');

defineExpose({
  /** 当前注册的列定义（调试 / 高级用法） */
  columns: orderedColumns,
});
</script>

<template>
  <div class="relative w-full overflow-auto" :style="wrapperStyle">
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
            }"
          />
        </colgroup>

        <!-- 表头 -->
        <thead class="[&_tr]:border-b">
          <tr class="border-b transition-colors hover:bg-muted/50">
            <th
              v-for="(col, idx) in orderedColumns"
              :key="`th-${idx}`"
              :class="
                cn(
                  'h-10 px-2 align-middle font-medium text-muted-foreground',
                  alignClass(col.align),
                  col.fixed === 'left' && 'sticky left-0 z-10 bg-muted/50',
                  col.fixed === 'right' && 'sticky right-0 z-10 bg-muted/50',
                )
              "
              :style="{
                width: col.width,
                minWidth: col.minWidth,
              }"
              scope="col"
            >
              <slot :name="`header-${col.prop ?? col.label ?? idx}`">
                {{ col.label ?? '' }}
              </slot>
            </th>
          </tr>
        </thead>

        <!-- 表体 -->
        <tbody class="[&_tr:last-child]:border-0">
          <!-- 有数据行 -->
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
              <template v-else-if="$slots[`col-${col.prop}`]">
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
                  :title="col.formatter ? col.formatter(row, col, col.prop ? row[col.prop] : undefined, rowIdx) : col.prop ? String(row[col.prop] ?? '') : ''"
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
      </table>
    </template>
  </div>
</template>
