<script setup lang="ts">
/**
* YdConfirmPopup —— 锚定触发器的气泡确认框。
 *
 * 与触发器元素锚定，点击触发器后弹出确认气泡。
 * 类似 PrimeVue ConfirmPopover / AntD Popconfirm。
 *
 * 适用于行内操作（删除、归档等需要二次确认的快捷按钮），
 * 不需要占据整个屏幕的视觉权重。
*
 * @path comm\@core\ui-kit\ydsz-ui\src\components\confirm-dialog\YdConfirmPopup.vue
 * @author ydsz-team
 * @since 1.0.0
 */
import type { ConfirmButtonType, ConfirmPopupEmits, ConfirmPopupProps } from './types';

import { computed } from 'vue';

import { cn } from '@ydsz-core/shared/utils';

import {
  PopoverContent,
  PopoverPortal,
  PopoverRoot,
  PopoverTrigger,
  useForwardPropsEmits,
} from '@ydsz-core/ydsz-vue';

import { buttonVariants } from '.././button';

defineOptions({ name: 'YdConfirmPopup' });

const props = withDefaults(defineProps<ConfirmPopupProps>(), {
  align: 'center',
  confirmButtonType: 'primary',
  confirmLabel: undefined,
  disabled: false,
  header: undefined,
  icon: undefined,
  rejectButtonType: 'default',
  rejectLabel: undefined,
  side: 'top',
});

const emits = defineEmits<ConfirmPopupEmits>();

const delegatedProps = computed(() => {
  const {
    align: _align,
    confirmButtonType: _confirmType,
    confirmLabel: _confirmLabel,
    disabled: _disabled,
    header: _header,
    icon: _icon,
    message: _message,
    rejectButtonType: _rejectType,
    rejectLabel: _rejectLabel,
    side: _side,
    ...delegated
  } = props;
  return delegated;
});

const forwarded = useForwardPropsEmits(delegatedProps, emits);

/** 确认按钮类型 → 默认图标 */
const defaultIcon = computed((): string => {
  const map: Record<ConfirmButtonType, string> = {
    danger: 'mdi:alert-circle',
    info: 'mdi:information',
    primary: 'mdi:help-circle',
    warning: 'mdi:alert',
  };
  return map[props.confirmButtonType ?? 'primary'];
});

const resolvedIcon = computed(() => props.icon ?? defaultIcon.value);

/** 确认按钮 cva variant */
const confirmVariant = computed((): 'default' | 'destructive' | 'outline' | 'secondary' => {
  const map: Record<ConfirmButtonType, 'default' | 'destructive' | 'outline' | 'secondary'> = {
    danger: 'destructive',
    info: 'secondary',
    primary: 'default',
    warning: 'destructive',
  };
  return map[props.confirmButtonType ?? 'primary'];
});

/** 取消按钮 cva variant */
const rejectVariant = computed((): 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' => {
  const type = props.rejectButtonType ?? 'default';
  return type === 'text' ? 'ghost' : 'outline';
});

/** icon 前景色 */
const iconTextClass = computed((): string => {
  const type = props.confirmButtonType ?? 'primary';
  const map: Record<ConfirmButtonType, string> = {
    danger: 'text-destructive',
    info: 'text-blue-500',
    primary: 'text-primary',
    warning: 'text-amber-500',
  };
  return map[type];
});

function handleConfirm(): void {
  emits('confirm');
  emits('update:open', false);
}

function handleCancel(): void {
  emits('cancel');
  emits('update:open', false);
}
</script>

<template>
  <PopoverRoot v-bind="forwarded">
    <PopoverTrigger
      :disabled="disabled"
      :aria-label="message"
    >
      <slot>
        <button
          type="button"
          :class="cn(buttonVariants({ variant: 'outline', size: 'sm' }))"
          :disabled="disabled"
        >
          {{ confirmLabel ?? '操作' }}
        </button>
      </slot>
    </PopoverTrigger>

    <PopoverPortal>
      <PopoverContent
        :align="align"
        :side="side"
        :avoid-collisions="true"
        :side-offset="6"
        :class="
          cn(
            'z-popup w-72 rounded-xl border border-border-default bg-surface-1 p-4',
            'shadow-high outline-none',
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
            'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
          )
        "
        role="dialog"
        aria-modal="true"
      >
        <!-- 箭头 -->
        <div
          :class="cn(
            'absolute size-3 rotate-45',
            'border-border-default bg-surface-1',
            side === 'top' ? '-bottom-1.5 left-1/2 -translate-x-1/2 border-b border-r' : '',
            side === 'bottom' ? '-top-1.5 left-1/2 -translate-x-1/2 border-l border-t' : '',
            side === 'left' ? '-right-1.5 top-1/2 -translate-y-1/2 border-r border-t' : '',
            side === 'right' ? '-left-1.5 top-1/2 -translate-y-1/2 border-l border-b' : '',
          )"
          aria-hidden="true"
        />

        <!-- 内容区 -->
        <div class="flex items-start gap-3">
          <!-- 图标 -->
          <div
            v-if="resolvedIcon"
            class="flex shrink-0 items-center justify-center"
          >
            <span
              :class="cn('size-5', iconTextClass)"
              aria-hidden="true"
            >
              {{ resolvedIcon.split(':').pop() }}
            </span>
          </div>

          <!-- 文本 -->
          <div class="flex-1">
            <p
              v-if="header"
              class="text-sm font-semibold text-text-primary"
            >
              {{ header }}
            </p>
            <p
              :class="cn(
                'text-sm text-text-secondary',
                header ? 'mt-1' : '',
              )"
            >
              {{ message }}
            </p>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="mt-4 flex justify-end gap-2">
          <button
            type="button"
            :class="cn(buttonVariants({ variant: rejectVariant, size: 'sm' }))"
            @click="handleCancel"
          >
            {{ rejectLabel ?? '取消' }}
          </button>
          <button
            type="button"
            :class="cn(buttonVariants({ variant: confirmVariant, size: 'sm' }))"
            @click="handleConfirm"
          >
            {{ confirmLabel ?? '确认' }}
          </button>
        </div>
      </PopoverContent>
    </PopoverPortal>
  </PopoverRoot>
</template>

<style scoped>
/* 气泡过渡动画 */
[data-^='popover'] {
  transition: opacity var(--ydsz-motion-duration-fast, 150ms) var(--ydsz-motion-easing-standard, cubic-bezier(0.4, 0, 0.2, 1));
}
</style>
