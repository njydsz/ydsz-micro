<!--
 * Popconfirm 气泡确认框：轻量确认交互，点击触发器后弹出气泡询问用户。
 *
 * 与 Popover 的区别：Popconfirm 强制有取消 / 确认按钮 + 自动关闭，
 * 专用于删除/危险操作的二次确认。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\primitives\popconfirm\YdPopconfirm.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
// @ts-nocheck
import { cn } from '@ydsz-core/shared/utils';
import { PopoverContent, PopoverPortal, PopoverRoot, PopoverTrigger } from '@ydsz-core/ydsz-vue';

import { YdButton } from '../button';

interface Props {
  /** 自定义类名 */
  class?: any;
  /** 是否禁用 */
  disabled?: boolean;
  /** 气泡标题 */
  title?: string;
  /** 气泡描述 */
  description?: string;
  /** 确认按钮文案 */
  confirmText?: string;
  /** 取消按钮文案 */
  cancelText?: string;
  /** 确认按钮类型 */
  confirmButtonProps?: { variant?: 'default' | 'destructive'; loading?: boolean };
  /** 是否显示 */
  open?: boolean;
  /** 图标 */
  icon?: any;
  /** 对齐位置 */
  align?: 'center' | 'end' | 'start';
  /** 位置 */
  side?: 'bottom' | 'left' | 'right' | 'top';
}

const props = withDefaults(defineProps<Props>(), {
  align: 'end',
  cancelText: '取消',
  confirmButtonProps: () => ({ variant: 'default' as const }),
  confirmText: '确定',
  description: '',
  disabled: false,
  open: undefined,
  side: 'top',
  title: '确认操作？',
});

const emit = defineEmits<{
  cancel: [];
  confirm: [];
  'update:open': [open: boolean];
}>();

function handleConfirm(): void {
  emit('confirm');
  emit('update:open', false);
}

function handleCancel(): void {
  emit('cancel');
  emit('update:open', false);
}
</script>

<template>
  <PopoverRoot :open="props.open" @update:open="emit('update:open', $event)">
    <PopoverTrigger as-child>
      <slot>
        <slot name="trigger">
          <YdButton size="sm" variant="destructive">删除</YdButton>
        </slot>
      </slot>
    </PopoverTrigger>

    <PopoverPortal>
      <PopoverContent
        :align="props.align"
        :avoid-collisions="true"
        :class="
          cn(
            'bg-background z-50 w-64 rounded-lg border p-4 shadow-xl outline-none',
            props.class,
          )
        "
        :side="props.side"
        :side-offset="6"
        @keydown.escape="handleCancel"
      >
        <!-- 箭头 -->
        <div
          class="fill-background stroke-border absolute -top-1.5 left-1/2 size-3 -translate-x-1/2 rotate-45 border-b border-r stroke-1"
          aria-hidden="true"
        ></div>

        <div class="flex gap-3">
          <!-- 图标 -->
          <div v-if="props.icon || true" class="shrink-0">
            <component :is="props.icon" v-if="props.icon" class="size-5 text-amber-500" />
            <svg v-else class="size-5 text-amber-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v4M12 16h.01" />
            </svg>
          </div>

          <!-- 内容 -->
          <div class="flex-1">
            <p class="text-sm font-semibold">{{ props.title }}</p>
            <p v-if="props.description" class="text-muted-foreground mt-1 text-xs">
              {{ props.description }}
            </p>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="mt-4 flex justify-end gap-2">
          <YdButton size="sm" variant="ghost" @click="handleCancel">{{ props.cancelText }}</YdButton>
          <YdButton
            size="sm"
            :variant="props.confirmButtonProps?.variant ?? 'default'"
            :loading="props.confirmButtonProps?.loading"
            @click="handleConfirm"
          >
            {{ props.confirmText }}
          </YdButton>
        </div>
      </PopoverContent>
    </PopoverPortal>
  </PopoverRoot>
</template>
