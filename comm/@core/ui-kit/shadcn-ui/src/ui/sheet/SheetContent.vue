<!--
 * 抽屉的内容区：负责挂载位置、遮罩、方位动画与 opened / closed / close 事件。
 *
 * appendTo 默认 body 而不是当前 DOM 位置，避免被父级的 overflow / transform 裁剪；
 * 但挂到 body 后也会脱离父级上下文，因此需要在抽屉内使用 provide 的数据时要特别留意。
 * zIndex 与 overlayBlur 以内联 style 下发，用于多层抽屉叠加时逐层抬高与加深背景虚化；
 * opened / closed 只在内容区自身的动画结束时派发，避免子元素动画提前触发回调。
 * 关闭 inheritAttrs 是为了让 attrs 落到真实的内容节点上，而不是多出来的根片段。
 *
 * @path comm\@core\ui-kit\shadcn-ui\src\ui\sheet\SheetContent.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script setup lang="ts">
import type { DialogContentEmits, DialogContentProps } from 'radix-vue';

import type { SheetVariants } from './sheet';

import { computed, ref } from 'vue';

import { cn } from '@YDSZ-core/shared/utils';

import { DialogContent, DialogPortal, useForwardPropsEmits } from 'radix-vue';

import { sheetVariants } from './sheet';
import SheetOverlay from './SheetOverlay.vue';

interface SheetContentProps extends DialogContentProps {
  appendTo?: HTMLElement | string;
  class?: any;
  modal?: boolean;
  open?: boolean;
  overlayBlur?: number;
  side?: SheetVariants['side'];
  zIndex?: number;
}

defineOptions({
  inheritAttrs: false,
});

const props = withDefaults(defineProps<SheetContentProps>(), {
  appendTo: 'body',
});

const emits = defineEmits<
  DialogContentEmits & { close: []; closed: []; opened: [] }
>();

const delegatedProps = computed(() => {
  const {
    class: _,
    modal: _modal,
    open: _open,
    side: _side,
    ...delegated
  } = props;

  return delegated;
});

function isAppendToBody() {
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
const contentRef = ref<InstanceType<typeof DialogContent> | null>(null);
function onAnimationEnd(event: AnimationEvent) {
  // 只有在 contentRef 的动画结束时才触发 opened/closed 事件
  if (event.target === contentRef.value?.$el) {
    if (props.open) {
      emits('opened');
    } else {
      emits('closed');
    }
  }
}
</script>

<template>
  <DialogPortal :to="appendTo">
    <Transition name="fade">
      <SheetOverlay
        v-if="open && modal"
        :style="{
          ...(zIndex ? { zIndex } : {}),
          position,
          backdropFilter:
            overlayBlur && overlayBlur > 0 ? `blur(${overlayBlur}px)` : 'none',
        }"
      />
    </Transition>
    <DialogContent
      ref="contentRef"
      :class="cn('z-popup', sheetVariants({ side }), props.class)"
      :style="{
        ...(zIndex ? { zIndex } : {}),
        position,
      }"
      @animationend="onAnimationEnd"
      v-bind="{ ...forwarded, ...$attrs }"
    >
      <slot></slot>

      <!-- <DialogClose
        class="data-[state=open]:bg-secondary absolute right-4 top-4 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:outline-none disabled:pointer-events-none"
      >
        <Cross2Icon class="h-5 w-" />
      </DialogClose> -->
    </DialogContent>
  </DialogPortal>
</template>
