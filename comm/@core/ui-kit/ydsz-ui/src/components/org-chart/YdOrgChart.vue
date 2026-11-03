<script setup lang="ts">
/* eslint-disable vue/component-api-style -- OrgTreeNode 必须递归引用自身，<script setup> 无法表达，故保留下方第二个 script 块的 defineComponent 写法 */
/**
 * YdOrgChart 组织架构图 —— 对标 PrimeVue OrgChart。
 *
 * 功能：
 * - 纵向 / 横向树形布局
 * - 节点折叠 / 展开
 * - 单选 / 多选
 * - 过滤（按 label 搜索）
 * - 连接线使用 CSS 伪元素（border-left + border-top），不引入 SVG
 * - 插槽 #node 自定义节点模板
 *
 * @deprecated 推荐使用 YdOrganizationChart；本组件保留用于向后兼容。
 * @path comm\@core\ui-kit\ydsz-ui\src\components\org-chart\YdOrgChart.vue
 * @author ydsz-team
 * @since 1.0.0
 */
import type { OrgChartEmits, OrgChartNode, OrgChartProps } from './org-chart-types';

import { safeIconHtml } from './org-chart-icon';
import { useOrgChartCore } from './use-org-chart-core';

import { useLocale } from '../../locale/useLocale';

import { cn } from '@ydsz-core/shared/utils';
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Search } from 'lucide-vue-next';

defineOptions({
  name: 'YdOrgChart',
});

const props = withDefaults(defineProps<OrgChartProps>(), {
  class: undefined,
  collapsible: false,
  connectorStyle: 'solid',
  filter: false,
  filterBy: 'label',
  horizontal: false,
  selection: null,
  selectionMode: undefined,
});

const emit = defineEmits<OrgChartEmits>();

/** 内置词典：过滤框占位与折叠按钮 a11y 文案随当前语种取值 */
const { t } = useLocale();

// ---------------------------------------------------------------------------
// 核心状态与行为
// ---------------------------------------------------------------------------
const {
  connectorBorder,
  filterText,
  filteredNodes,
  getNodeClasses,
  hasChildren,
  isExpanded,
  isSelected,
  toggleExpand,
  toggleSelect,
} = useOrgChartCore({ emit, props });

// 将方法暴露给递归模板使用，保持引用一致
defineExpose({
  isExpanded,
  isSelected,
  toggleExpand,
  toggleSelect,
});
</script>

<template>
  <!-- 节点图标只接受 safeIconHtml 白名单内的单根 svg/i/span/em 标记，
       事件属性与危险协议已在守卫中拒绝，故下方 v-html 注入面由白名单收敛 -->
  <div :class="cn('org-chart', props.class)">
    <!-- 过滤输入框 -->
    <div v-if="props.filter" class="relative mb-4">
      <Search class="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2" />
      <input
        v-model="filterText"
        type="text"
        :placeholder="t('orgChart.search', { field: props.filterBy })"
        class="border-input focus:ring-primary/30 w-full rounded-md border bg-white py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2"
      />
    </div>

    <!-- 纵向树（默认） -->
    <div v-if="!props.horizontal" class="flex flex-col items-center">
      <!-- 递归渲染根节点 -->
      <template v-for="node in filteredNodes" :key="node.id">
        <!-- 节点本体 + 折叠按钮 -->
        <div class="relative flex flex-col items-center">
          <!-- 节点卡片 -->
          <div :class="getNodeClasses(node)" role="treeitem" @click="toggleSelect(node)">
            <slot :name="node.id" :node="node">
              <div class="flex flex-col items-center gap-1 text-center">
                <img
                  v-if="node.image"
                  :src="node.image"
                  :alt="node.label"
                  class="size-10 rounded-full object-cover"
                />
                <!-- eslint-disable-next-line vue/no-v-html -- 图标 markup 已由 safeIconHtml 白名单收敛 -->
                <div v-if="node.icon" class="text-base" v-html="safeIconHtml(node.icon)" />
                <span class="text-foreground text-sm font-semibold">{{ node.label }}</span>
                <span v-if="node.type" class="text-muted-foreground text-xs">
                  {{ node.type }}
                </span>
              </div>
            </slot>
          </div>
          <!-- 折叠按钮（节点下方居中） -->
          <button
            v-if="props.collapsible && hasChildren(node)"
            type="button"
            class="border-primary absolute -bottom-2.5 left-1/2 z-10 flex size-5 -translate-x-1/2 items-center justify-center rounded-full border-2 bg-white text-xs transition-transform hover:scale-110"
            :aria-label="isExpanded(node) ? t('common.collapse') : t('common.expand')"
            @click.stop="toggleExpand(node)"
          >
            <ChevronDown v-if="isExpanded(node)" class="size-3" />
            <ChevronRight v-else class="size-3" />
          </button>
        </div>

        <!-- 子节点层 -->
        <div
          v-if="hasChildren(node) && isExpanded(node)"
          class="relative mt-6 flex flex-col items-center"
        >
          <!-- 从节点下来的竖线 -->
          <div
            class="border-primary/20 absolute left-1/2 top-0 h-6 w-0 -translate-x-1/2 border-l-2"
            :class="connectorBorder"
          />
          <!-- 横向连接横线（连接所有子节点的水平线） -->
          <div :class="['flex items-stretch gap-0', node.children!.length > 1 ? 'relative' : '']">
            <!-- 水平连接线 -->
            <div
              v-if="node.children!.length > 1"
              class="border-primary/20 absolute top-0 h-0 w-full border-t-2"
              :class="connectorBorder"
              :style="{ left: '25%', right: '25%' }"
            />
            <!-- 各个子节点 -->
            <div
              v-for="child in node.children"
              :key="child.id"
              class="relative flex flex-col items-center px-3"
            >
              <!-- 从横线到子节点的竖线 -->
              <div class="border-primary/20 h-6 w-0 border-l-2" :class="connectorBorder" />
              <!-- 递归渲染子节点 -->
              <OrgTreeNode
                :node="child"
                :node-classes="getNodeClasses(child)"
                :horizontal="false"
                :collapsible="props.collapsible"
                :has-children="hasChildren(child)"
                :expanded="isExpanded(child)"
                :connector-border="connectorBorder"
                @toggle-expand="toggleExpand(child)"
                @toggle-select="toggleSelect(child)"
              >
                <template #node="slotProps">
                  <slot :name="child.id" :node="slotProps.node">
                    <div class="flex flex-col items-center gap-1 text-center">
                      <img
                        v-if="child.image"
                        :src="child.image"
                        :alt="child.label"
                        class="size-10 rounded-full object-cover"
                      />
                      <!-- eslint-disable-next-line vue/no-v-html -- 图标 markup 已由 safeIconHtml 白名单收敛 -->
                      <div v-if="child.icon" class="text-base" v-html="safeIconHtml(child.icon)" />
                      <span class="text-foreground text-sm font-semibold">{{ child.label }}</span>
                      <span v-if="child.type" class="text-muted-foreground text-xs">
                        {{ child.type }}
                      </span>
                    </div>
                  </slot>
                </template>
              </OrgTreeNode>
            </div>
          </div>
        </div>
      </template>
    </div>

    <!-- 横向树 -->
    <div v-else class="flex flex-row items-start">
      <template v-for="node in filteredNodes" :key="node.id">
        <div class="relative flex flex-row items-start">
          <!-- 节点卡片 -->
          <div :class="getNodeClasses(node)" role="treeitem" @click="toggleSelect(node)">
            <slot :name="node.id" :node="node">
              <div class="flex flex-col items-center gap-1 text-center">
                <img
                  v-if="node.image"
                  :src="node.image"
                  :alt="node.label"
                  class="size-10 rounded-full object-cover"
                />
                <!-- eslint-disable-next-line vue/no-v-html -- 图标 markup 已由 safeIconHtml 白名单收敛 -->
                <div v-if="node.icon" class="text-base" v-html="safeIconHtml(node.icon)" />
                <span class="text-foreground text-sm font-semibold">{{ node.label }}</span>
                <span v-if="node.type" class="text-muted-foreground text-xs">
                  {{ node.type }}
                </span>
              </div>
            </slot>
          </div>
          <!-- 折叠按钮（节点右侧） -->
          <button
            v-if="props.collapsible && hasChildren(node)"
            type="button"
            class="border-primary absolute -right-2.5 top-1/2 z-10 flex size-5 -translate-y-1/2 items-center justify-center rounded-full border-2 bg-white text-xs transition-transform hover:scale-110"
            :aria-label="isExpanded(node) ? t('common.collapse') : t('common.expand')"
            @click.stop="toggleExpand(node)"
          >
            <ChevronLeft v-if="isExpanded(node)" class="size-3" />
            <ChevronRight v-else class="size-3" />
          </button>
        </div>

        <!-- 子节点层（横向） -->
        <div
          v-if="hasChildren(node) && isExpanded(node)"
          class="relative flex flex-col items-start pl-6"
        >
          <!-- 从节点过来的横线 -->
          <div
            class="border-primary/20 absolute left-0 top-1/2 h-0 w-6 -translate-y-1/2 border-t-2"
            :class="connectorBorder"
          />
          <!-- 纵向连接竖线 -->
          <div class="relative flex flex-col items-start gap-0">
            <!-- 竖向主线 -->
            <div
              v-if="node.children!.length > 1"
              class="border-primary/20 absolute left-0 top-0 h-full w-0 border-l-2"
              :class="connectorBorder"
              style="left: -24px"
            />
            <!-- 各个子节点 -->
            <div
              v-for="child in node.children"
              :key="child.id"
              class="relative flex flex-row items-center py-3"
            >
              <!-- 从竖线到节点的横线 -->
              <div class="border-primary/20 h-0 w-6 border-t-2" :class="connectorBorder" />
              <!-- 递归渲染子节点 -->
              <OrgTreeNode
                :node="child"
                :node-classes="getNodeClasses(child)"
                :horizontal="true"
                :collapsible="props.collapsible"
                :has-children="hasChildren(child)"
                :expanded="isExpanded(child)"
                :connector-border="connectorBorder"
                @toggle-expand="toggleExpand(child)"
                @toggle-select="toggleSelect(child)"
              >
                <template #node="slotProps">
                  <slot :name="child.id" :node="slotProps.node">
                    <div class="flex flex-col items-center gap-1 text-center">
                      <img
                        v-if="child.image"
                        :src="child.image"
                        :alt="child.label"
                        class="size-10 rounded-full object-cover"
                      />
                      <!-- eslint-disable-next-line vue/no-v-html -- 图标 markup 已由 safeIconHtml 白名单收敛 -->
                      <div v-if="child.icon" class="text-base" v-html="safeIconHtml(child.icon)" />
                      <span class="text-foreground text-sm font-semibold">{{ child.label }}</span>
                      <span v-if="child.type" class="text-muted-foreground text-xs">
                        {{ child.type }}
                      </span>
                    </div>
                  </slot>
                </template>
              </OrgTreeNode>
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<!-- 
  OrgTreeNode 递归子组件 —— 使用 h() 渲染函数实现真正的递归。
  放在 <script setup> 之后作为第二个 <script> 块（无 setup）。
-->
<script lang="ts">
import type { OrgChartNode } from './org-chart-types';

import { defineComponent, h, type PropType } from 'vue';

import { safeIconHtml } from './org-chart-icon';

import { cn } from '@ydsz-core/shared/utils';
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp } from 'lucide-vue-next';

/**
 * OrgTreeNode —— 递归渲染树节点的 sub-component。
 *
 * 不对外导出，仅供 YdOrgChart 内部使用。
 * 因为 Vue SFC 不允许在 <script setup> 中直接递归引用自身，
 * 改用 h() 渲染函数 + defineComponent 实现递归结构。
 */
export default defineComponent({
  name: 'OrgTreeNode',
  props: {
    node: { type: Object as PropType<OrgChartNode>, required: true },
    nodeClasses: { type: String, required: true },
    horizontal: { type: Boolean, default: false },
    collapsible: { type: Boolean, default: false },
    hasChildren: { type: Boolean, default: false },
    expanded: { type: Boolean, default: true },
    connectorBorder: { type: String, default: 'border-solid' },
  },
  emits: ['toggle-expand', 'toggle-select'],
  setup(props, { emit }) {
    return () => {
      const { node, horizontal, connectorBorder } = props;

      const toggleIcon = horizontal
        ? props.expanded
          ? h(ChevronLeft, { class: 'size-3' })
          : h(ChevronRight, { class: 'size-3' })
        : props.expanded
          ? h(ChevronUp, { class: 'size-3' })
          : h(ChevronDown, { class: 'size-3' });

      const handleToggleExpand = (e: Event) => {
        e.stopPropagation();
        emit('toggle-expand');
      };

      const handleNodeClick = () => {
        emit('toggle-select');
      };

      // 节点卡片
      const nodeCard = h(
        'div',
        {
          class: props.nodeClasses,
          role: 'treeitem',
          onClick: handleNodeClick,
        },
        [
          h('div', { class: 'flex flex-col items-center gap-1 text-center' }, [
            node.image
              ? h('img', {
                  src: node.image,
                  alt: node.label,
                  class: 'size-10 rounded-full object-cover',
                })
              : null,
            node.icon ? h('div', { class: 'text-base', innerHTML: safeIconHtml(node.icon) }) : null,
            h('span', { class: 'text-sm font-semibold text-foreground' }, node.label),
            node.type ? h('span', { class: 'text-xs text-muted-foreground' }, node.type) : null,
          ]),
        ],
      );

      // 折叠按钮
      const toggleBtn =
        props.collapsible && props.hasChildren
          ? h(
              'button',
              {
                type: 'button',
                class: cn(
                  'border-primary absolute z-10 flex size-5 items-center justify-center rounded-full border-2 bg-white text-xs transition-transform hover:scale-110',
                  horizontal
                    ? '-right-2.5 top-1/2 -translate-y-1/2'
                    : '-bottom-2.5 left-1/2 -translate-x-1/2',
                ),
                onClick: handleToggleExpand,
                'aria-label': props.expanded ? '折叠' : '展开',
              },
              [toggleIcon],
            )
          : null;

      // 有子节点且展开时才渲染子树
      const hasChildNodes = props.hasChildren && props.expanded && (node.children?.length ?? 0) > 0;

      const childrenContainer = hasChildNodes
        ? h(
            'div',
            {
              class: cn(
                horizontal
                  ? 'relative flex flex-col items-start pl-6'
                  : 'relative mt-6 flex flex-col items-center',
              ),
            },
            [
              // 从父节点到子节点的连接线（父→子之间的主线）
              horizontal
                ? h('div', {
                    class: cn(
                      'border-primary/20 absolute left-0 top-1/2 h-0 w-6 -translate-y-1/2 border-t-2',
                      connectorBorder,
                    ),
                  })
                : h('div', {
                    class: cn(
                      'border-primary/20 absolute left-1/2 top-0 h-6 w-0 -translate-x-1/2 border-l-2',
                      connectorBorder,
                    ),
                  }),
              // 子节点列表容器
              h(
                'div',
                {
                  class: horizontal
                    ? 'relative flex flex-col items-start gap-0'
                    : cn(
                        'flex items-stretch gap-0',
                        (node.children?.length ?? 0) > 1 ? 'relative' : '',
                      ),
                },
                horizontal
                  ? // 横向模式：每个子节点占一行，左侧有一条竖线连接
                    (node.children ?? []).map((child: OrgChartNode) => {
                      return h(
                        'div',
                        {
                          key: child.id,
                          class: 'relative flex flex-row items-center py-3',
                        },
                        [
                          // 从竖线到节点的横线
                          h('div', {
                            class: cn('border-primary/20 h-0 w-6 border-t-2', connectorBorder),
                          }),
                          // 递归子节点
                          h(OrgTreeNode as any, {
                            node: child,
                            nodeClasses: props.nodeClasses,
                            horizontal,
                            collapsible: props.collapsible,
                            hasChildren: !!(child.children && child.children.length > 0),
                            expanded: true,
                            connectorBorder,
                            onToggleExpand: () => emit('toggle-expand'),
                            onToggleSelect: () => emit('toggle-select'),
                          }),
                        ],
                      );
                    })
                  : // 纵向模式：每个子节点占一列，顶部有一条横线连接
                    (node.children ?? []).map((child: OrgChartNode) => {
                      return h(
                        'div',
                        {
                          key: child.id,
                          class: 'relative flex flex-col items-center px-3',
                        },
                        [
                          // 从横线到节点的竖线
                          h('div', {
                            class: cn('border-primary/20 h-6 w-0 border-l-2', connectorBorder),
                          }),
                          // 递归子节点
                          h(OrgTreeNode as any, {
                            node: child,
                            nodeClasses: props.nodeClasses,
                            horizontal,
                            collapsible: props.collapsible,
                            hasChildren: !!(child.children && child.children.length > 0),
                            expanded: true,
                            connectorBorder,
                            onToggleExpand: () => emit('toggle-expand'),
                            onToggleSelect: () => emit('toggle-select'),
                          }),
                        ],
                      );
                    }),
              ),
            ],
          )
        : null;

      return h(
        'div',
        {
          class: cn('relative flex', horizontal ? 'flex-row items-start' : 'flex-col items-center'),
        },
        [
          // 节点本体 + 折叠按钮
          h(
            'div',
            {
              class: cn(
                'relative flex',
                horizontal ? 'flex-row items-start' : 'flex-col items-center',
              ),
            },
            [nodeCard, toggleBtn],
          ),
          // 子容器
          childrenContainer,
        ],
      );
    };
  },
});
</script>
