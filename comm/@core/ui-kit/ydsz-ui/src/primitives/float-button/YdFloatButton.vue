<!--
 * FloatButton 悬浮按钮：固定在页面右下角的操作入口。
 *
 * 支持 tooltip 描述 / 图标 / badge / click 回调。
 * 可配合 YdFloatButtonGroup 实现多按钮折叠展开。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\primitives\float-button\YdFloatButton.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script setup lang="ts">
import { cn } from '@ydsz-core/shared/utils';
import { ArrowUp, LucideIcon } from 'lucide-vue-next';

import { YdBadge } from '../badge';
import { YdTooltip, YdTooltipContent, YdTooltipProvider, YdTooltipTrigger } from '../tooltip';

interface Props {
  /** 是否显示 badge 数字 */
  badge?: number;
  /** 自定义类名 */
  class?: any;
  /** 按钮描述（tooltip） */
  description?: string;
  /** 是否禁用 */
  disabled?: boolean;
  /** 按钮图标 */
  icon?: any;
  /** 是否可见（默认 true） */
  visible?: boolean;

  /** 形状 */
  shape?: 'circle' | 'square';

  /** 按钮类型 */
  type?: 'default' | 'primary';
}

const props = withDefaults(defineProps<Props>(), {
  badge: undefined,
  disabled: false,
  icon: ArrowUp,
  shape: 'circle',
  type: 'default',
  visible: true,
});

const emit = defineEmits<{
  click: [event: MouseEvent];
}>();

function handleClick(event: MouseEvent): void {
  if (props.disabled) return;
  emit('click', event);
}
</script>

<template>
  <YdTooltipProvider>
    <YdTooltip>
      <YdTooltipTrigger as-child>
        <button
          v-show="props.visible"
          :class="
            cn(
              'shadow-float-btn fixed bottom-6 right-6 z-[var(--z-fixed)] flex size-12 items-center justify-center transition-all',
              props.shape === 'circle' ? 'rounded-full' : 'rounded-lg',
              props.type === 'primary'
                ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                : 'bg-background text-foreground hover:bg-muted border',
              props.disabled && 'pointer-events-none opacity-40',
              props.class,
            )
          "
          type="button"
          :aria-label="props.description ?? '悬浮按钮'"
          :aria-disabled="props.disabled"
          @click="handleClick"
        >
          <span v-if="props.badge" class="absolute -right-1 -top-1">
            <YdBadge variant="destructive" class="size-4 justify-center rounded-full p-0 text-xs">
              {{ props.badge > 99 ? '99+' : props.badge }}
            </YdBadge>
          </span>
          <slot name="icon">
            <component :is="props.icon" class="size-5" />
          </slot>
        </button>
      </YdTooltipTrigger>
      <YdTooltipContent side="left" :aria-label="props.description">
        <slot>{{ props.description }}</slot>
      </YdTooltipContent>
    </YdTooltip>
  </YdTooltipProvider>
</template>
