<!--
 * YdDialogContent Vue 组件 - 现代化弹窗样式
 *
 * 相比原版新增三个关闭抑制开关：
 *  - `closeOnOverlayClick`：默认 true；置 false 后点击遮罩不再关闭弹窗
 *  - `closeOnEsc`：默认 true；置 false 后 ESC 不再关闭弹窗
 *  - `showClose`：默认 true；置 false 后隐藏右上角关闭按钮
 *
 * 这三个开关共同覆盖「二次鉴权 / 强制阅读」等需要强制用户完成操作的交互场景；
 * 关闭行为一律交由调用方通过 v-model:open 显式控制。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\ui\dialog\YdDialogContent.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script setup lang="ts">
import type { DialogContentEmits, DialogContentProps } from 'radix-vue';

import type { ClassType } from '@ydsz-core/typings';

import { computed, ref } from 'vue';

import { cn } from '@ydsz-core/shared/utils';

import { X } from 'lucide-vue-next';
import {
  YdDialogClose,
  YdDialogContent,
  DialogPortal,
  useForwardPropsEmits,
} from 'radix-vue';

import DialogOverlay from './DialogOverlay.vue';

const props = withDefaults(
  defineProps<
    DialogContentProps & {
      animationType?: 'scale' | 'slide';
      appendTo?: HTMLElement | string;
      class?: ClassType;
      closeClass?: ClassType;
      /** 点击遮罩是否关闭弹窗；置 false 后点击遮罩不关闭 */
      closeOnOverlayClick?: boolean;
      /** ESC 键是否关闭弹窗；置 false 后 ESC 不关闭 */
      closeOnEsc?: boolean;
      closeDisabled?: boolean;
      modal?: boolean;
      open?: boolean;
      overlayBlur?: number;
      /** 是否展示右上角关闭按钮 */
      showClose?: boolean;
      zIndex?: number;
    }
  >(),
  {
    appendTo: 'body',
    animationType: 'scale',
    closeDisabled: false,
    closeOnEsc: true,
    closeOnOverlayClick: true,
    showClose: true,
  },
);
const emits = defineEmits<
  DialogContentEmits & { close: []; closed: []; opened: [] }
>();

const delegatedProps = computed(() => {
  const {
    class: _,
    modal: _modal,
    open: _open,
    showClose: __,
    animationType: ___,
    closeOnOverlayClick: ____,
    closeOnEsc: _____,
    ...delegated
  } = props;

  return delegated;
});

function isAppendToBody(): boolean {
  return (
    props.appendTo === 'body' ||
    props.appendTo === document.body ||
    !props.appendTo
  );
}

const position = computed(() => {
  return isAppendToBody() ? 'fixed' : 'absolute';
});

const forwarded = useForwardPropsEmits(delegatedProps, emits);

const contentRef = ref<InstanceType<typeof YdDialogContent> | null>(null);
function onAnimationEnd(event: AnimationEvent): void {
  if (event.target === contentRef.value?.$el) {
    if (props.open) {
      emits('opened');
    } else {
      emits('closed');
    }
  }
}

/** 遮罩点击回调：受 closeOnOverlayClick 控制 */
function handleOverlayClose(): void {
  if (props.closeOnOverlayClick) {
    emits('close');
  }
}

/** ESC 键回调：受 closeOnEsc 控制 */
function handleEscapeKeyDown(event: KeyboardEvent): void {
  if (props.closeOnEsc) {
    // radix 默认行为即关闭；无需额外 emit，透传事件即可关闭
    return;
  }
  // 阻止默认关闭行为，仅通知外部自行处理
  emits('escapeKeyDown', event);
}

defineExpose({
  getContentRef: () => contentRef.value,
});
</script>

<template>
  <DialogPortal :to="appendTo">
    <Transition name="fade">
      <DialogOverlay
        v-if="open && modal"
        :style="{
          ...(zIndex ? { zIndex } : {}),
          position,
          backdropFilter:
            overlayBlur && overlayBlur > 0 ? `blur(${overlayBlur}px)` : 'none',
        }"
        @click="handleOverlayClose"
      />
    </Transition>
    <YdDialogContent
      ref="contentRef"
      :style="{ ...(zIndex ? { zIndex } : {}), position }"
      @animationend="onAnimationEnd"
      @escape-key-down="handleEscapeKeyDown"
      v-bind="forwarded"
      :class="
        cn(
          'z-popup bg-surface-2 w-full p-6 shadow-outline outline-none sm:rounded-xl',
          'data-[state=open]:animate-in data-[state=closed]:animate-out',
          'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
          'data-[state=closed]:scale-out-95 data-[state=open]:scale-in-95',
          props.class,
        )
      "
    >
      <slot></slot>

      <YdDialogClose
        v-if="showClose && closeOnOverlayClick"
        :disabled="closeDisabled"
        :class="
          cn(
            'data-[state=open]:bg-accent data-[state=open]:text-muted-foreground',
            'hover:bg-accent hover:text-accent-foreground text-text-tertiary',
            'flex-center absolute right-4 top-4 size-7 rounded-full opacity-70',
            'transition-opacity hover:opacity-100 focus:outline-none disabled:pointer-events-none',
            props.closeClass,
          )
        "
        @click="() => emits('close')"
      >
        <X class="size-4" />
      </YdDialogClose>
    </YdDialogContent>
  </DialogPortal>
</template>
