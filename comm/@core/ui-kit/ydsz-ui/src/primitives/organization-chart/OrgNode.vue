<!-- OrgNode.vue —— 组织架构图单节点渲染组件。
     根据节点类型（root / branch / leaf）分发样式，含连线、选中态、展开/折叠指示器。

     @path comm\@core\ui-kit\ydsz-ui\src\primitives\organization-chart\OrgNode.vue
     @author ydsz-team
     @since 26.09.24
-->
<script setup lang="ts">
import { computed } from 'vue';

import { cn } from '@ydsz-core/shared/utils';

import type { OrgNode } from './use-organization-chart';
import {
  isBranchNode,
  resolveNodeType,
} from './use-organization-chart';

interface Props {
  /** 当前节点数据 */
  node: OrgNode;
  /** 当前层级深度（0 = 根） */
  depth?: number;
  /** 是否处于水平布局模式 */
  horizontal?: boolean;
  /** 是否允许折叠 */
  collapsible?: boolean;
  /** 是否启用选择 */
  selectable?: boolean;
  /** 是否处于选中状态 */
  isSelected?: boolean;
  /** 是否已展开（仅分支节点） */
  isExpanded?: boolean;
  /** 是否为同级最后一个节点 */
  isLast?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  collapsible: true,
  depth: 0,
  horizontal: false,
  isExpanded: true,
  isLast: false,
  isSelected: false,
  selectable: false,
});

const emit = defineEmits<{
  (e: 'toggleExpand', id: string): void;
  (e: 'toggleSelect', id: string): void;
}>();

/** 解析后的节点类型 */
const nodeType = computed(() => resolveNodeType(props.node));

/** 样式 class */
const nodeClass = computed(() =>
  cn(
    'relative flex flex-col items-center',
    props.node.className,
  ),
);

/** 卡片样式：根据类型区分视觉层级 */
const cardClass = computed(() =>
  cn(
    'relative z-10 flex min-w-[140px] flex-col rounded-lg border px-4 py-3 transition-colors duration-150',
    nodeType.value === 'root'
      ? 'border-indigo-300 bg-indigo-50 shadow-sm'
      : nodeType.value === 'branch'
        ? 'border-slate-300 bg-white shadow-sm'
        : 'border-slate-200 bg-slate-50',
    props.isSelected && 'ring-2 ring-blue-500 ring-offset-1',
    props.selectable && 'cursor-pointer hover:border-blue-300 hover:shadow-md',
  ),
);

/** 是否有子节点可展开 */
const hasChildren = computed(() => isBranchNode(props.node));

/**
 * 处理节点卡片点击：触发选择或展开折叠。
 */
function handleCardClick(): void {
  if (props.selectable) {
    emit('toggleSelect', props.node.id);
  }
}

/**
 * 处理展开/折叠按钮点击。
 */
function handleExpandClick(): void {
  if (props.collapsible && hasChildren.value) {
    emit('toggleExpand', props.node.id);
  }
}
</script>

<template>
  <div :class="nodeClass">
    <!-- 节点卡片 -->
    <div
      :class="cardClass"
      :role="selectable ? 'button' : 'treeitem'"
      :aria-selected="selectable ? isSelected : undefined"
      :aria-expanded="hasChildren ? isExpanded : undefined"
      :tabindex="selectable ? 0 : -1"
      @click="handleCardClick"
    >
      <!-- 节点标签 -->
      <span
        :class="cn(
          'text-sm font-medium',
          nodeType === 'root' ? 'text-indigo-900' : 'text-slate-800',
        )"
      >
        {{ node.label || node.id }}
      </span>

      <!-- 展开/折叠指示器（仅 branched 节点） -->
      <button
        v-if="hasChildren && collapsible"
        type="button"
        :aria-label="isExpanded ? '收起' : '展开'"
        aria-keyshortcuts="Enter"
        :class="cn(
          'absolute -bottom-3 left-1/2 z-20 flex h-6 w-6 -translate-x-1/2 items-center justify-center rounded-full border border-slate-300 bg-white text-xs font-bold text-slate-600 transition-transform hover:bg-slate-100',
          isExpanded && 'rotate-180',
        )"
        @click.stop="handleExpandClick"
      >
        <svg
          v-if="isExpanded"
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <path d="M6 9L12 15L18 9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
        <span v-else class="text-xs">{{ node.children?.length ?? 0 }}</span>
      </button>
    </div>

    <!-- 子节点区域 -->
    <div
      v-if="hasChildren && isExpanded"
      :class="cn(
        'relative',
        horizontal
          ? 'mt-0 flex flex-row items-start gap-8 ps-8 pt-0'
          : 'mt-8 flex flex-col items-center gap-6',
      )"
    >
      <!-- 纵向主干连线：垂直布局时 -->
      <div
        v-if="!horizontal"
        class="absolute start-1/2 top-0 w-px -translate-x-1/2 bg-slate-300"
        aria-hidden="true"
      />

      <!-- 横向主干连线：水平布局时 -->
      <div
        v-if="horizontal"
        class="absolute start-0 top-1/2 h-px -translate-y-1/2 bg-slate-300"
        aria-hidden="true"
      />

      <!-- 子节点渲染 -->
      <div
        v-for="(child, idx) in node.children"
        :key="child.id"
        :class="cn(
          'relative flex',
          horizontal ? 'flex-col items-start' : 'flex-col items-center',
        )"
      >
        <!-- 子节点纵向连接线：垂直布局 -->
        <div
          v-if="!horizontal"
          class="absolute start-1/2 top-0 h-4 w-px -translate-x-1/2 bg-slate-300"
          aria-hidden="true"
        />

        <!-- 子节点横向连接线：水平布局 -->
        <div
          v-if="horizontal"
          class="absolute start-0 top-1/2 h-px w-full -translate-y-1/2 bg-slate-300"
          aria-hidden="true"
        />

        <!-- 递归渲染子节点 -->
        <OrgNode
          :node="child"
          :depth="(depth ?? 0) + 1"
          :horizontal="horizontal"
          :collapsible="collapsible"
          :selectable="selectable"
          :is-selected="isSelected"
          :is-expanded="isExpanded"
          :is-last="idx === (node.children?.length ?? 0) - 1"
          @toggle-expand="emit('toggleExpand', $event)"
          @toggle-select="emit('toggleSelect', $event)"
        />
      </div>
    </div>
  </div>
</template>
