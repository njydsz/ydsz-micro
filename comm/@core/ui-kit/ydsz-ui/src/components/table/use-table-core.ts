/**
 * useTableCore —— YdTable 脚本核心逻辑（列注册 / 排序 / 样式 / 虚拟滚动 / 列宽拖拽）。
 *
 * <p>从 {@link YdTable.vue} 提取：
 * <ul>
 *   <li>列注册表（columnMap / orderedColumns / ColumnRegistry provide 给子级 YdTableColumn）</li>
 *   <li>列排序状态机（handleSort / getSortIcon / sort-change 事件）</li>
 *   <li>样式计算（sizeClass / alignClass / wrapperStyle / borderClass / displayEmptyText）</li>
 *   <li>虚拟滚动装配（isVirtualActive / effectiveViewportHeight / useVirtualList 句柄）</li>
 *   <li>列宽拖拽（useColumnResize + startColumnResize 全局事件绑定）</li>
 *   <li>列数与显隐判定（columnCount / hasColumns / dataHasItems）</li>
 * </ul>
 *
 * <p>组件侧只保留：props / emits 声明、i18n、模板渲染，
 * 行为契约（props / emits / slots / expose）完全不变。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\components\table\use-table-core.ts
 * @author ydsz-team
 * @since 5.7.0
 */

import type { CSSProperties, ComputedRef } from 'vue';

import { computed, provide, shallowRef } from 'vue';

import type { ColumnDef } from './ColumnDef';
import type { ColumnRegistry } from './injectionKeys';
import { YD_TABLE_COLUMN_REGISTRY } from './injectionKeys';
import { useVirtualList } from '../../composables/use-virtual-list';
import { useColumnResize } from './useColumnResize';
import { useLocale } from '../../locale/useLocale';

/* ============================================================ */
/* 类型定义                                                        */
/* ============================================================ */

/** 排序方向 */
export type SortOrder = 'asc' | 'desc' | null;

/** useTableCore 配置 */
export interface UseTableCoreOptions {
  /** 组件 props（响应式，已含 withDefaults 默认值） */
  props: TableCoreProps;
  /** 组件 emits 触发器 */
  emit: TableCoreEmits;
}

/** Table 对外 emit 事件签名（与 SFC 声明保持一致） */
export interface TableCoreEmits {
  (e: 'sort-change', prop: string, order: SortOrder): void;
}

/**
 * 已解析默认值的 Props（组件内 withDefaults 后的等价类型）。
 *
 * <p>composable 接收的是 withDefaults 处理后的 props，
 * 可选字段已有默认值，此处收窄为必填以便内部安全访问。
 */
export interface TableCoreProps {
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
  sortOrder?: SortOrder;
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

/** useTableCore 返回句柄 */
export interface UseTableCoreReturn {
  /* ----- 列注册表 ----- */
  /** 可见列（按注册顺序，已过滤 isHidden） */
  orderedColumns: ComputedRef<ColumnDef[]>;
  /** 列总数（用于空数据行 colspan） */
  columnCount: ComputedRef<number>;
  /** 是否已注册列（决定是否走列驱动渲染） */
  hasColumns: ComputedRef<boolean>;

  /* ----- 列排序 ----- */
  /** 表头点击排序 */
  handleSort: (col: ColumnDef) => void;
  /** 排序指示器图标 */
  getSortIcon: (col: ColumnDef) => string;

  /* ----- 样式 ----- */
  /** 尺寸 class */
  sizeClass: ComputedRef<string>;
  /** 边框 class */
  borderClass: ComputedRef<string>;
  /** 外层容器 maxHeight style */
  wrapperStyle: ComputedRef<CSSProperties | undefined>;
  /** 空数据展示文本 */
  displayEmptyText: ComputedRef<string>;
  /** 数据是否有内容 */
  dataHasItems: ComputedRef<boolean>;

  /* ----- 虚拟滚动 ----- */
  /** 虚拟滚动是否激活 */
  isVirtualActive: ComputedRef<boolean>;
  /** 真实滚动视口高度 */
  effectiveViewportHeight: ComputedRef<number>;
  /** 虚拟列表句柄 */
  virtualList: ReturnType<typeof useVirtualList<Record<string, unknown>>>;

  /* ----- 列宽拖拽 ----- */
  /** 列宽拖拽句柄 */
  columnResize: ReturnType<typeof useColumnResize>;
  /** 启动列宽拖拽 */
  startColumnResize: (prop: string, event: PointerEvent) => void;
}

/* ============================================================ */
/* 纯函数                                                          */
/* ============================================================ */

/**
 * 列对齐 class。
 *
 * @param align - 列对齐方式
 */
export function alignClass(align?: string): string {
  switch (align) {
    case 'center': return 'text-center';
    case 'right': return 'text-right';
    default: return 'text-left';
  }
}

/* ============================================================ */
/* 主入口                                                          */
/* ============================================================ */

/**
 * 装配 YdTable 的核心逻辑。
 *
 * @param options - props / emit
 * @returns 表格核心句柄
 */
export function useTableCore(options: UseTableCoreOptions): UseTableCoreReturn {
  const { emit, props } = options;

  const { t } = useLocale();

  /* ---------------------------------------------------------- */
  /* 列注册表（provide 给子级 YdTableColumn 注册）                */
  /* ---------------------------------------------------------- */

  const columnMap = shallowRef(new Map<string, ColumnDef>());

  /** 可见列（过滤 isHidden） */
  const orderedColumns = computed(() => {
    return Array.from(columnMap.value.values()).filter((col) => !col.isHidden);
  });

  const registry: ColumnRegistry = {
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

  /* ---------------------------------------------------------- */
  /* 样式 class                                                  */
  /* ---------------------------------------------------------- */

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

  const borderClass = computed(() => (props.border ? 'border border-collapse' : ''));

  /* ---------------------------------------------------------- */
  /* 列排序处理                                                   */
  /* ---------------------------------------------------------- */

  function handleSort(col: ColumnDef): void {
    if (!col.isSortable || !col.prop) return;

    let nextOrder: SortOrder;
    if (props.sortProp !== col.prop) {
      // 切换到新列 -> asc
      nextOrder = 'asc';
    } else {
      // 当前列：asc -> desc -> null -> asc
      if (props.sortOrder === 'asc') {
        nextOrder = 'desc';
      } else if (props.sortOrder === 'desc') {
        nextOrder = null;
      } else {
        nextOrder = 'asc';
      }
    }
    emit('sort-change', col.prop, nextOrder);
  }

  /**
   * 表头文本与排序指示器。
   */
  function getSortIcon(col: ColumnDef): string {
    if (!col.isSortable || props.sortProp !== col.prop) {
      return '↕';
    }
    if (props.sortOrder === 'asc') return '↑';
    if (props.sortOrder === 'desc') return '↓';
    return '↕';
  }

  /* ---------------------------------------------------------- */
  /* 列数与显隐判定                                               */
  /* ---------------------------------------------------------- */

  const columnCount = computed(() => orderedColumns.value.length);
  const hasColumns = computed(() => columnCount.value > 0);
  const dataHasItems = computed(() => (props.data?.length ?? 0) > 0);

  /* ---------------------------------------------------------- */
  /* 外层容器样式                                                 */
  /* ---------------------------------------------------------- */

  const wrapperStyle = computed<CSSProperties | undefined>(() => {
    if (props.maxHeight != null) {
      return { maxHeight: typeof props.maxHeight === 'number' ? `${props.maxHeight}px` : props.maxHeight };
    }
    return undefined;
  });

  const displayEmptyText = computed(() => props.emptyTextCompat ?? props.emptyText ?? t('empty.default'));

  /* ---------------------------------------------------------- */
  /* 虚拟滚动                                                     */
  /* ---------------------------------------------------------- */

  /**
   * 虚拟滚动生效条件：virtual=true 且存在数据行。
   *
   * <p>仅在列驱动模式下启用；语义插槽模式下不激活。
   */
  const isVirtualActive = computed<boolean>(() => !!(props.virtual && hasColumns.value && dataHasItems.value));

  /**
   * 真实滚动视口高度：优先取 maxHeight prop，否则回退到 viewportHeight。
   *
   * <p>与 wrapperStyle.maxHeight 对齐——保证虚拟列表计算出的可见行数与实际可视区域匹配。
   */
  const effectiveViewportHeight = computed<number>(() => {
    if (props.maxHeight != null) {
      return typeof props.maxHeight === 'number' ? props.maxHeight : Number.parseInt(String(props.maxHeight), 10) || props.viewportHeight || 400;
    }
    return props.viewportHeight || 400;
  });

  /**
   * 虚拟列表句柄：驱动可见行切片与滚动容器。
   *
   * <p>包裹 getter 以让 composable 响应 props.data 变更。
   */
  const virtualList = useVirtualList<Record<string, unknown>>(
    () => props.data ?? [],
    {
      itemHeight: props.itemHeight,
      overscan: props.overscan,
      viewportHeight: effectiveViewportHeight.value,
      getKey: (row, index) => (props.rowKey ? String((row as Record<string, unknown>)[props.rowKey] ?? index) : String(index)),
    },
  );

  /* ---------------------------------------------------------- */
  /* 列宽拖拽调整                                                 */
  /* ---------------------------------------------------------- */

  /**
   * 列宽拖拽句柄。
   *
   * <p>仅在 columnResizable=true 时启用；通过 document 级 pointermove/pointerup 监听，
   * 保证快速拖拽脱离表头区域后仍能继续。
   */
  const columnResize = useColumnResize({ defaultMinWidth: 60 });

  /**
   * 启动列宽拖拽 —— 绑定全局 pointermove / pointerup。
   */
  function startColumnResize(prop: string, event: PointerEvent): void {
    if (!props.columnResizable) return;
    columnResize.onResizeStart(prop, event);
    const moveHandler = (e: PointerEvent) => columnResize.onResizeMove(e);
    const upHandler = () => {
      columnResize.onResizeEnd();
      document.removeEventListener('pointermove', moveHandler);
      document.removeEventListener('pointerup', upHandler);
    };
    document.addEventListener('pointermove', moveHandler);
    document.addEventListener('pointerup', upHandler, { once: true });
  }

  return {
    borderClass,
    columnCount,
    columnResize,
    dataHasItems,
    displayEmptyText,
    effectiveViewportHeight,
    getSortIcon,
    handleSort,
    hasColumns,
    isVirtualActive,
    orderedColumns,
    sizeClass,
    startColumnResize,
    virtualList,
    wrapperStyle,
  };
}
