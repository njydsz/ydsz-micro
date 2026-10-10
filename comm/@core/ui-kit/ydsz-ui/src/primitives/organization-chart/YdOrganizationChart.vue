<!-- YdOrganizationChart.vue —— 组织架构图主组件。
     对标 PrimeVue OrganizationChart。使用 defineProps 接收 root 数据、options 配置。
     内置递归渲染（OrgNode）与 CSS 树形连线。

     @path comm\@core\ui-kit\ydsz-ui\src\primitives\organization-chart\YdOrganizationChart.vue
     @author ydsz-team
     @since 26.09.24
-->
<script setup lang="ts">
import { computed, type Ref, type VNode } from 'vue';

import OrgNode from './OrgNode.vue';
import {
  isBranchNode,
  useOrganizationChart,
} from './use-organization-chart';
import type {
  OrgChartOptions,
  OrgNode as OrgNodeType,
} from './use-organization-chart';

interface Props {
  /** 根节点数据
   * @required
   */
  root: OrgNodeType;
  /** 是否水平布局（默认垂直自上而下）
   * @default false
   */
  horizontal?: boolean;
  /** 是否允许折叠（默认 true）
   * @default true
   */
  collapsible?: boolean;
  /** 选择模式：single / multiple / null（禁用选择）
   * @default null
   */
  selectionMode?: 'single' | 'multiple' | null;
  /**
   * 自定义节点渲染模板。
   * @default undefined
   */
  template?: (node: OrgNodeType) => VNode | string;
  /** 是否显示节点的类型徽标
   * @default true
   */
  showTypeBadge?: boolean;
  /** 组件容器的额外类名 */
  class?: string;
}

const props = withDefaults(defineProps<Props>(), {
  collapsible: true,
  horizontal: null as unknown as undefined,
  selectionMode: null,
  showTypeBadge: true,
  template: undefined,
});

const emit = defineEmits<{
  (e: 'nodeSelect', node: OrgNodeType): void;
  (e: 'nodeUnselect', node: OrgNodeType): void;
  (e: 'nodeExpand', node: OrgNodeType): void;
  (e: 'nodeCollapse', node: OrgNodeType): void;
}>();

/** 构建 options 对象传递给 composable */
const chartOptions = computed<OrgChartOptions>(() => ({
  collapsible: props.collapsible,
  horizontal: props.horizontal ?? false,
  selectionMode: props.selectionMode,
  template: props.template,
}));

/** Composable 句柄 */
const chart = useOrganizationChart(
  computed(() => props.root) as Ref<OrgNodeType>,
  chartOptions.value,
);

/**
 * 处理节点展开/折叠事件（冒泡）。
 *
 * @param id 节点 ID
 */
function handleToggleExpand(id: string): void {
  const node = chart.findNode(id);
  if (!node) {
    return;
  }
  const wasExpanded = chart.isExpanded(id);
  chart.toggleExpand(id);
  if (wasExpanded) {
    emit('nodeCollapse', node);
  } else {
    emit('nodeExpand', node);
  }
}

/**
 * 处理节点选择事件（冒泡）。
 *
 * @param id 节点 ID
 */
function handleToggleSelect(id: string): void {
  const node = chart.findNode(id);
  if (!node) {
    return;
  }
  const wasSelected = chart.isSelected(id);
  chart.toggleSelect(id);
  if (wasSelected) {
    emit('nodeUnselect', node);
  } else {
    emit('nodeSelect', node);
  }
}

/** 是否启用选择（用于下发给子节点） */
const isSelectable = computed(() => props.selectionMode !== null);
</script>

<template>
  <div
    :class="[
      'organization-chart relative',
      horizontal ? 'flex flex-row items-start overflow-x-auto' : 'flex flex-col items-center',
      props.class,
    ]"
    role="tree"
    :aria-label="root.label || '组织架构'"
    aria-orientation="vertical"
  >
    <!-- 根节点 -->
    <OrgNode
      :node="root"
      :depth="0"
      :horizontal="horizontal ?? false"
      :collapsible="collapsible"
      :selectable="isSelectable"
      :is-selected="chart.isSelected(root.id)"
      :is-expanded="isBranchNode(root) ? chart.isExpanded(root.id) : undefined"
      :is-last="true"
      @toggle-expand="handleToggleExpand"
      @toggle-select="handleToggleSelect"
    />
  </div>
</template>
