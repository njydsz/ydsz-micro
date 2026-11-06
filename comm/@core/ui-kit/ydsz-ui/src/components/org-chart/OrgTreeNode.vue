<script lang="ts">
/**
 * OrgTreeNode —— 递归渲染组织架构树节点的子组件。
 *
 * @remarks
 * 不对外导出，仅供 {@link YdOrgChart} 内部使用。
 * Vue SFC 不允许在 `<script setup>` 中直接递归引用自身，故独立成文件，
 * 由父组件通过 `h()` 渲染函数实现真正的递归结构。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\components\org-chart\OrgTreeNode.vue
 * @author ydsz-team
 * @since 1.0.0
 */
import type { OrgChartNode } from './org-chart-types';

import { defineComponent, h, type PropType } from 'vue';

import { safeIconHtml } from './org-chart-icon';

import { cn } from '@ydsz-core/shared/utils';
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp } from 'lucide-vue-next';

// 递归渲染组织架构树必须用渲染函数自引用（`<script setup>` 无法直接递归自身），
// 此为本仓唯一允许的 Options API 例外，勿据此处推广。
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
  // eslint-disable-next-line vue/component-api-style
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
