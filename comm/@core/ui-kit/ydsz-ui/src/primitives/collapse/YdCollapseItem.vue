<!--
 * Collapse 折叠面板子项。
 *
 * 从父级 Collapse 通过 inject 获取 toggle 与 isActive 方法，
 * 保持子项零 prop（除了 key），灵活组合。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\primitives\collapse\YdCollapseItem.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
// @ts-nocheck
import { inject, ref, watch, withDefaults } from 'vue';

import { cn } from '@ydsz-core/shared/utils';
import { ChevronDown } from 'lucide-vue-next';

export interface CollapseItemInstance {
  /** 展开/收起切换 */
  toggle: (key: string) => void;
  /** 当前是否展开 */
  isActive: (key: string) => boolean;
}

const collapseContext = inject<CollapseItemInstance | null>('ydsz-collapse', null);

interface Props {
  /** 自定义类名 */
  class?: any;
  /** 展开内容（默认 slot） */
  key: string;
  /** 标题 */
  title: string;
  /** 是否禁用 */
  disabled?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
});

const isExpanded = ref(collapseContext?.isActive(props.key) ?? false);
const contentRef = ref<HTMLElement | null>(null);

watch(
  () => collapseContext?.isActive(props.key),
  (val) => {
    isExpanded.value = val ?? false;
  },
);

function handleToggle(): void {
  if (props.disabled || !collapseContext) return;
  collapseContext.toggle(props.key);
}

/** 动画高度过渡：height 0 → auto 使用 grid 动画技巧 */
const contentStyle = {
  display: 'grid',
  gridTemplateRows: isExpanded.value ? '1fr' : '0fr',
  transition: 'grid-template-rows 0.25s ease',
};
</script>

<template>
  <div :class="cn('group collapse-item', props.class)">
    <!-- 触发器 -->
    <button
      :aria-expanded="isExpanded"
      :class="
        cn(
          'flex w-full items-center justify-between gap-2 px-4 py-3 text-left text-sm font-medium transition-colors',
          props.disabled ? 'cursor-not-allowed text-muted-foreground opacity-50' : 'hover:bg-muted/50',
        )
      "
      type="button"
      @click="handleToggle"
    >
      <slot name="title">
        <span>{{ props.title }}</span>
      </slot>
      <ChevronDown
        :class="cn('size-4 text-muted-foreground transition-transform duration-250', isExpanded && 'rotate-180')"
        aria-hidden="true"
      />
    </button>
    <!-- 内容区 -->
    <div :style="contentStyle" aria-hidden="true">
      <div class="overflow-hidden">
        <div ref="contentRef" class="px-4 pb-4 text-sm text-muted-foreground">
          <slot></slot>
        </div>
      </div>
    </div>
  </div>
</template>
