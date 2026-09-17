<!--
 * YdVSelect 触发器：封装 YdSelectTrigger + YdSelectValue，统一触发器外观与可清选择。
 *
 * 设计目标：
 *  - 与原生 YdSelectTrigger 保持一致的视觉（圆角、边框、focus ring、disabled 置灰）；
 *  - 右侧集成清除按钮，仅在已选项存在时显示；
 *  - 遵循 @see YdSelect 现有样式约定。
 *
 * 注意：Trigger 本身不持有值模型，需由父级 @see YdVSelect 显式传入 hasValue 控制清除按钮显隐。
 *
 * @path comm\@core\ui-kit\shadcn-ui\src\ui\select\YdVSelectTrigger.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script setup lang="ts">
import { cn } from '@ydsz-core/shared/utils';

import { CircleX } from '@ydsz-core/icons';
import { ChevronDown } from 'lucide-vue-next';

import {
  SelectIcon,
  YdSelectTrigger,
  YdSelectValue,
} from 'radix-vue';

import type { SelectTriggerProps } from 'radix-vue';

defineOptions({
  name: 'YdVSelectTrigger',
});

/**
 * YdVSelectTrigger 组件的 props。
 *
 * 在 SelectTriggerProps 基础上扩展清除按钮控制与 placeholder。
 */
export interface VSelectTriggerProps extends SelectTriggerProps {
  /** 是否允许清除已选项，默认 false */
  allowClear?: boolean;
  /** 当前是否有已选值（控制清除按钮显隐），默认 false */
  hasValue?: boolean;
  /** placeholder 文本 */
  placeholder?: string;
  /** 自定义类名 */
  class?: string;
}

const props = withDefaults(defineProps<VSelectTriggerProps>(), {
  allowClear: false,
  hasValue: false,
});

const emit = defineEmits<{
  (e: 'clear'): void;
}>();

/** 处理清除按钮点击：阻止事件冒泡触发打开面板 */
function handleClearClick(event: MouseEvent): void {
  event.preventDefault();
  event.stopPropagation();
  emit('clear');
}
</script>

<template>
  <YdSelectTrigger
    :class="
      cn(
        'flex h-9 w-full items-center justify-between gap-2 whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background',
        'placeholder:text-muted-foreground',
        'focus:outline-none focus:ring-1 focus:ring-primary/50',
        'disabled:cursor-not-allowed disabled:opacity-50',
        '[&>span]:line-clamp-1',
        props.class,
      )
    "
    v-bind="$attrs"
  >
    <YdSelectValue
      class="flex-auto text-left"
      :placeholder="placeholder"
    >
      <slot />
    </YdSelectValue>
    <div class="flex shrink-0 items-center gap-1">
      <!-- 清除按钮：仅在有值且 allowClear 时显示 -->
      <CircleX
        v-if="allowClear && hasValue"
        :size="14"
        class="cursor-pointer opacity-50 transition-opacity hover:opacity-100"
        aria-label="清除选择"
        role="button"
        tabindex="0"
        data-testid="clear-button"
        @pointerdown.stop
        @click.stop.prevent="handleClearClick"
      />
      <SelectIcon class="size-4 opacity-50">
        <ChevronDown />
      </SelectIcon>
    </div>
  </YdSelectTrigger>
</template>
