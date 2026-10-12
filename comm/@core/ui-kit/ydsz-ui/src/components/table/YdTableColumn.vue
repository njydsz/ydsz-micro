<script setup lang="ts">
/**
 * 表格列声明（语义子组件，无可见渲染）。
 *
 * <p>作为 YdTable 的子组件使用：通过 provide/inject 向父级注册列定义，
 * 父级 YdTable 收集所有列后根据 data 自动渲染 thead/tbody。
 *
 * <p>接口对齐 TableColumn 常用属性，确保从传统表格组件迁移时模板
 * 改动极小（只需标签重命名 + import 路径替换）。
 *
 * <p>示例：
 * <pre>
 *   &lt;YdTable :data="rows" border&gt;
 *     &lt;YdTableColumn type="index" label="#" width="50" /&gt;
 *     &lt;YdTableColumn prop="name" label="姓名" min-width="120" is-sortable /&gt;
 *     &lt;YdTableColumn prop="status" label="状态" width="100"&gt;
 *       &lt;template #default="{ row }"&gt;
 *         &lt;YdBadge :variant="row.status ? 'default' : 'destructive'"&gt;
 *           {{ row.status ? '启用' : '禁用' }}
 *         &lt;/YdBadge&gt;
 *       &lt;/template&gt;
 *     &lt;/YdTableColumn&gt;
 *   &lt;/YdTable&gt;
 * </pre>
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\ui\table\YdTableColumn.vue
 * @author ydsz-team
 * @since 4.2.0 (26.09.17 增强：拖拽/显隐/排序)
 */
import { computed, getCurrentInstance, inject, onBeforeUnmount, onMounted } from 'vue';

import { YD_TABLE_COLUMN_REGISTRY } from './injectionKeys';

import type { ColumnRegistry } from './injectionKeys';

defineOptions({ name: 'YdTableColumn' });

interface Props {
  /** 列类型：index=序号列，selection=多选框，expand=展开行 */
  type?: 'index' | 'selection' | 'expand';
  /** 对应行数据的字段名 */
  prop?: string;
  /** 表头文本 */
  label?: string;
  /** 列宽度（CSS 值，如 '120px' 或 '10%'） */
  width?: string | number;
  /** 最小宽度（当列可伸缩时使用） */
  minWidth?: string | number;
  /** 最大宽度（可拖拽拉宽场景使用） */
  maxWidth?: string | number;
  /** 固定列位置（left/right/true 等效 left） */
  fixed?: 'left' | 'right' | boolean;
  /** 单元格对齐方式，默认 'left' */
  align?: 'left' | 'center' | 'right';
  /** 内容超长时省略号+tooltip，默认 false */
  showOverflowTooltip?: boolean;
  /** 自定义格式化函数：(row, column, cellValue, index) → displayText */
  formatter?: (row: any, column: any, cellValue: unknown, index: number) => string;
  /** 是否隐藏该列 */
  isHidden?: boolean;
  /** 是否允许用户通过列设置面板隐藏，默认 true */
  hideable?: boolean;
  /** 是否允许列拖拽排序，默认 true */
  draggable?: boolean;
  /** 是否允许通过表头点击排序 */
  isSortable?: boolean;
  /** 排序顺序权重（用于持久化恢复） */
  sort?: number;
}

const props = withDefaults(defineProps<Props>(), {
  align: 'left',
  draggable: true,
  hideable: true,
  isHidden: false,
  isSortable: false,
  showOverflowTooltip: false,
});

// 当没有显式 prop 时，用实例 uid 作为唯一 key
const instance = getCurrentInstance();
const columnId = computed(() => `${props.prop ?? ''}_${instance?.uid ?? 0}`);

const registry = inject<ColumnRegistry | null>(YD_TABLE_COLUMN_REGISTRY, null);

if (!registry) {
  // 在 YdTable 外部使用时不抛错，仅静音（避免破坏其它布局场景）
} else {
  onMounted(() => {
    registry.addColumn(columnId.value, {
      type: props.type,
      prop: props.prop,
      label: props.label,
      width: props.width != null ? `${props.width}` : undefined,
      minWidth: props.minWidth != null ? `${props.minWidth}` : undefined,
      maxWidth: props.maxWidth != null ? `${props.maxWidth}` : undefined,
      fixed: props.fixed === true ? 'left' : props.fixed === false ? undefined : props.fixed,
      align: props.align,
      showOverflowTooltip: props.showOverflowTooltip,
      formatter: props.formatter,
      isHidden: props.isHidden,
      hideable: props.hideable,
      draggable: props.draggable,
      isSortable: props.isSortable,
      sort: props.sort,
      // 通过实例 uid 拿到插槽渲染函数的引用
      _uid: instance?.uid,
    });
  });

  onBeforeUnmount(() => {
    registry.removeColumn(columnId.value);
  });
}

// YdTableColumn 是逻辑组件，模板中渲染空内容
// 实际渲染由父级 YdTable 通过 data + columns 驱动
</script>

<template>
  <!-- 无可见模板：列定义由父级 YdTable 收集后统一渲染 -->
</template>
