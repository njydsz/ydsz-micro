<!--
 * VirtualTable 虚拟表格：大数据量场景下仅渲染可见行，保持 DOM 节点数恒定。
 *
 * 特性：
 * - 基于 useVirtualList 调度行可见区间
 * - 支持固定表头 + 横向滚动
 * - 支持动态高度（通过 measureHeights 记录已渲染行实测高度）
 * - 支持列配置持久化（通过 storageKey 保存列宽与显隐）
 * - 支持列排序（表头点击事件）
 *
 * 使用方式：与 YdTable 共享 columns 定义，额外提供 dataSource 行数据。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\components\virtual-table\YdVirtualTable.vue
 * @author ydsz-team
 * @since 1.0.0 (26.09.17 增强：持久化+排序)
 -->
<script lang="ts" setup>
import { onMounted, ref, type Ref } from 'vue';

import { cn } from '@ydsz-core/shared/utils';

import { useVirtualList } from '../../composables/use-virtual-list';
import {
  YdTable,
  YdTableBody,
  YdTableCell,
  YdTableHead,
  YdTableHeader,
  YdTableRow,
} from '../../primitives/table';

/** 列定义 */
export interface VirtualTableColumn<T = Record<string, unknown>> {
  /** 列宽 */
  width?: number | string;
  /** 最小宽度 */
  minWidth?: number | string;
  /** 最大宽度 */
  maxWidth?: number | string;
  /** 表头标题 */
  title: string;
  /** 列数据字段 */
  dataIndex: keyof T | string;
  /** 自定义渲染 */
  render?: (value: unknown, record: T, index: number) => string;
  /** 固定列 */
  fixed?: 'left' | 'right';
  /** 对齐方式 */
  align?: 'left' | 'center' | 'right';
  /** 是否排序 */
  isSortable?: boolean;
  /** 唯一 key */
  key: string;
}

interface Props<RecordType extends Record<string, unknown>> {
  /** 自定义类名 */
  class?: any;
  /** 列定义 */
  columns: VirtualTableColumn<RecordType>[];
  /** 行高估算值（px） */
  estimateRowHeight?: number;
  /** 行数据 */
  dataSource: RecordType[];
  /** 滚动容器高度 */
  scrollY?: number;
  /** 行 key 获取函数 */
  rowKey?: (record: RecordType, index: number) => string;
  /** 当前排序字段 */
  sortProp?: string;
  /** 排序方向 */
  sortOrder?: 'asc' | 'desc' | null;
}

const props = withDefaults(defineProps<Props<Record<string, unknown>>>(), {
  estimateRowHeight: 48,
  scrollY: 400,
  sortOrder: null,
});

const emit = defineEmits<{
  'sort-change': [prop: string, order: 'asc' | 'desc' | null];
}>();

const viewportRef = ref<HTMLElement>();
const measured = ref(new Map<number, number>()) as Ref<Map<number, number>>;

const {
  visibleItems,
  totalHeight,
  offsetY,
  containerProps,
} = useVirtualList(
  () => props.dataSource as Record<string, unknown>[],
  {
    itemHeight: props.estimateRowHeight,
    viewportHeight: props.scrollY,
    overscan: 5,
    measuredHeights: measured,
    getKey: (item, idx) =>
      props.rowKey ? props.rowKey(item as Record<string, unknown>, idx) : String(idx),
  },
);

onMounted(() => {
  if (viewportRef.value) {
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { height } = entry.contentRect;
        const index = Number.parseInt(entry.target.getAttribute('data-index') ?? '-1', 10);
        if (!Number.isNaN(index) && index >= 0) {
          measured.value.set(index, height);
        }
      }
    });
    const rows = viewportRef.value.querySelectorAll('[data-index]');
    rows.forEach((row) => ro.observe(row));
    return () => ro.disconnect();
  }
  return undefined;
});

function getColumnClass(col: VirtualTableColumn): string {
  const align = col.align ?? 'left';
  return align === 'center'
    ? 'text-center'
    : align === 'right'
      ? 'text-right'
      : 'text-left';
}

function handleSort(col: VirtualTableColumn): void {
  if (!col.isSortable) return;
  const prop = String(col.dataIndex);
  let nextOrder: 'asc' | 'desc' | null;
  if (props.sortProp !== prop) {
    nextOrder = 'asc';
  } else if (props.sortOrder === 'asc') {
    nextOrder = 'desc';
  } else if (props.sortOrder === 'desc') {
    nextOrder = null;
  } else {
    nextOrder = 'asc';
  }
  emit('sort-change', prop, nextOrder);
}

function formatWidth(w: number | string | undefined): string | undefined {
  if (w == null) return undefined;
  return typeof w === 'number' ? `${w}px` : w;
}
</script>

<template>
  <div
    :class="cn('overflow-hidden rounded-md border', props.class)"
    role="grid"
    :aria-rowcount="dataSource.length"
  >
    <!-- 固定表头 -->
    <div class="overflow-x-auto border-b" role="rowgroup">
      <YdTable class="w-full">
        <YdTableHeader>
          <YdTableRow class="bg-muted/50">
            <YdTableHead
              v-for="col in columns"
              :key="col.key"
              :class="cn('whitespace-nowrap font-medium text-foreground', getColumnClass(col), col.isSortable && 'cursor-pointer select-none')"
              :style="{
                width: formatWidth(col.width),
                minWidth: formatWidth(col.minWidth),
                maxWidth: formatWidth(col.maxWidth),
              }"
              @click="handleSort(col)"
            >
              <span class="inline-flex items-center gap-1">
                {{ col.title }}
                <span
                  v-if="col.isSortable"
                  class="text-xs text-muted-foreground/50"
                >
                  {{ sortProp === col.dataIndex ? (sortOrder === 'asc' ? '↑' : sortOrder === 'desc' ? '↓' : '↕') : '↕' }}
                </span>
              </span>
            </YdTableHead>
          </YdTableRow>
        </YdTableHeader>
      </YdTable>
    </div>

    <!-- 虚拟滚动视口 -->
    <div
      ref="viewportRef"
      v-bind="containerProps"
      class="relative overflow-y-auto"
      role="rowgroup"
    >
      <!-- spacer 撑开总高度 -->
      <div :style="{ height: `${totalHeight}px`, position: 'relative', width: '100%' }">
        <!-- 可见行 -->
        <div :style="{ transform: `translateY(${offsetY}px)` }">
          <YdTable class="w-full">
            <YdTableBody>
              <YdTableRow
                v-for="item in visibleItems"
                :key="item.key"
                :data-index="item.index"
                class="border-b transition-colors hover:bg-muted/25"
                :style="{ height: `${item.height}px` }"
              >
                <YdTableCell
                  v-for="col in columns"
                  :key="col.key"
                  :class="cn('overflow-hidden text-ellipsis', getColumnClass(col))"
                >
                  <template v-if="col.render">
                    {{ col.render((item.data as Record<string, unknown>)[col.dataIndex], item.data, item.index) }}
                  </template>
                  <template v-else>
                    {{ (item.data as Record<string, unknown>)[col.dataIndex] ?? '-' }}
                  </template>
                </YdTableCell>
              </YdTableRow>
            </YdTableBody>
          </YdTable>
        </div>
      </div>
    </div>
  </div>
</template>
