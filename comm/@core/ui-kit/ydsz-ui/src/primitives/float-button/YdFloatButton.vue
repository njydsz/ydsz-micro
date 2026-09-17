<!--
 * FloatButton 悬浮按钮：固定在页面右下角的操作入口。
 *
 * 支持 tooltip 描述 / 图标 / badge / click 回调。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\primitives\float-button\YdFloatButton.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script setup lang="ts">
import { cn } from '@ydsz-core/shared/utils';
import { ArrowUp } from 'lucide-vue-next';

import { YdBadge } from '../badge';
import { YdTooltip, YdTooltipContent, YdTooltipProvider, YdTooltipTrigger } from '../tooltip';

interface Props {
  /** 自定义类名 */
  class?: any;
  /** badge 数字 */
  badge?: number;
  /** tooltip 文案 */
  description?: string;
  /** 是否禁用 */
  disabled?: boolean;
  /** 图标组件 */
  icon?: any;
  /** 形状 */
  shape?: 'circle' | 'square';
  /** 是否可见 */
  visible?: boolean;
  /** 类型 */
  type?: 'default' | 'primary';
}

const props = withDefaults(defineProps<Props>(), {
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
          :aria-label="props.description ?? '悬浮按钮'"
          :aria-disabled="props.disabled"
          :class="
            cn(
              'shadow-raised fixed bottom-6 right-6 z-40 flex size-12 items-center justify-center transition-all',
              props.shape === 'circle' ? 'rounded-full' : 'rounded-lg',
              props.type === 'primary'
                ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                : 'bg-background text-foreground hover:bg-muted border',
              props.disabled && 'pointer-events-none opacity-40',
              props.class,
            )
          "
          type="button"
          @click="handleClick"
        >
          <span
            v-if="props.badge"
            class="absolute -right-1 -top-1 size-4"
          >
            <YdBadge
              class="flex size-full justify-center rounded-full p-0 text-xs"
              variant="destructive"
            >
              {{ props.badge > 99 ? '99+' : props.badge }}
            </YdBadge>
          </span>
          <slot name="icon">
            <component :is="props.icon" class="size-5" />
          </slot>
        </button>
      </YdTooltipTrigger>
      <YdTooltipContent side="left">
        <slot>{{ props.description }}</slot>
      </YdTooltipContent>
    </YdTooltip>
  </YdTooltipProvider>
</template>
