<script setup lang="ts">
/**
* YdConfirmDialog —— 声明式确认对话框组件。
 *
 * 受控弹窗，通过 v-model:open 控制显示。
 * 内部基于 Radix Vue Dialog 原语 + ydsz-vue DialogContent 封装。
*
 * 多数场景请优先使用 useConfirm composable；
 * 需要在模板中预置确认弹窗时使用本组件。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\components\confirm-dialog\YdConfirmDialog.vue
 * @author ydsz-team
 * @since 1.0.0
 */
import type { ConfirmButtonType, ConfirmDialogEmits, ConfirmDialogProps } from './types';

import { computed, onMounted, ref } from 'vue';

import { cn } from '@ydsz-core/shared/utils';

import {
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogPortal,
  DialogRoot,
  DialogTitle,
} from '@ydsz-core/ydsz-vue';

import { buttonVariants } from '../../primitives/button/button';
import DialogOverlay from '../../primitives/dialog/DialogOverlay.vue';
import { X } from 'lucide-vue-next';

defineOptions({ name: 'YdConfirmDialog' });

const props = withDefaults(defineProps<ConfirmDialogProps>(), {
  closeOnEsc: true,
  closeOnOverlayClick: true,
  confirmButtonType: 'primary',
  confirmLabel: undefined,
  header: undefined,
  icon: undefined,
  message: '',
  open: false,
  rejectButtonType: 'default',
  rejectLabel: undefined,
});

const emits = defineEmits<ConfirmDialogEmits>();

/* SSR hydration guard */
const isClient = ref(false);
onMounted(() => {
  isClient.value = true;
});

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
const rejectVariant = computed((): 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link' => {
  const type = props.rejectButtonType ?? 'default';
  return type === 'text' ? 'ghost' : 'outline';
});

/** icon 背景色 */
const iconBgClass = computed((): string => {
  const type = props.confirmButtonType ?? 'primary';
  const map: Record<ConfirmButtonType, string> = {
    danger: 'bg-destructive/10',
    info: 'bg-blue-500/10',
    primary: 'bg-primary/10',
    warning: 'bg-amber-500/10',
  };
  return map[type];
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

function handleOverlayClose(): void {
  if (props.closeOnOverlayClick) {
    handleCancel();
  }
}

defineExpose({
  handleConfirm,
  handleCancel,
});
</script>

<template>
  <DialogRoot :open="open" @update:open="emits('update:open', $event)">
    <DialogPortal v-if="isClient">
      <Transition name="fade">
        <DialogOverlay
          v-if="open"
          class="bg-overlay/50 z-popup inset-0 backdrop-blur-sm"
          @click="handleOverlayClose"
        />
      </Transition>
      <DialogContent
        :class="
          cn(
            'fixed left-1/2 top-1/2 z-popup w-[calc(100vw-2rem)] max-w-md',
            '-translate-x-1/2 -translate-y-1/2',
            'rounded-2xl border border-border-default bg-surface-1 p-6',
            'shadow-high outline-none',
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
            'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
          )
        "
        :close-on-overlay-click="closeOnOverlayClick"
        :close-on-esc="closeOnEsc"
      >
        <!-- 关闭按钮 -->
        <DialogClose
          v-if="closeOnOverlayClick"
          class="absolute right-4 top-4 flex size-7 items-center justify-center rounded-full text-text-tertiary opacity-70 transition-opacity hover:bg-accent hover:text-accent-foreground hover:opacity-100 focus:outline-none disabled:pointer-events-none"
          @click="handleCancel"
          aria-label="关闭"
        >
          <X class="size-4" />
        </DialogClose>

        <!-- 头部行：图标 + 文本 -->
        <div class="flex items-start gap-4">
          <div
            v-if="resolvedIcon"
            :class="
              cn(
                'flex size-10 shrink-0 items-center justify-center rounded-full',
                iconBgClass,
              )
            "
          >
            <span
              :class="cn('size-5', iconTextClass)"
              aria-hidden="true"
            >
              {{ resolvedIcon.split(':').pop() }}
            </span>
          </div>

          <div class="flex-1">
            <DialogTitle
              v-if="header"
              class="text-base font-semibold leading-snug text-text-primary"
            >
              {{ header }}
            </DialogTitle>
            <DialogDescription
              v-if="message"
              class="mt-2 text-sm text-text-secondary"
            >
              {{ message }}
            </DialogDescription>
          </div>
        </div>

        <!-- 按钮组 -->
        <div class="mt-6 flex justify-end gap-2">
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
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>

<style scoped>
/* fade 过渡（遮罩） */
.fade-enter-active,
.fade-leave-active {
  transition: opacity var(--ydsz-motion-duration-normal, 200ms) var(--ydsz-motion-easing-standard, cubic-bezier(0.4, 0, 0.2, 1));
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
