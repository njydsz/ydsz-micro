<!--
 * 可滚动对话框内容区：内容超高时内部滚动，而不是让整页滚动。
 *
 * 额外开放 zIndex（默认 1000）：对话框常与其它浮层（抽屉、下拉）叠加，
 * 固定值无法适配不同宿主应用的层级规划，故留出覆盖入口。
 * 与 DialogContent 的区别仅在于滚动策略，标题与关闭按钮内置于内容区内。
 *
 * @path comm\@core\ui-kit\shadcn-ui\src\ui\dialog\DialogScrollContent.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script setup lang="ts">
import type { DialogContentEmits, DialogContentProps } from 'radix-vue';

import { computed } from 'vue';

import { cn } from '@YDSZ-core/shared/utils';

import { X } from 'lucide-vue-next';
import {
  DialogClose,
  DialogContent,
  DialogOverlay,
  DialogPortal,
  useForwardPropsEmits,
} from 'radix-vue';

type ClassValue = string | Record<string, boolean> | (string | Record<string, boolean>)[];

const props = withDefaults(
  defineProps<DialogContentProps & { class?: ClassValue; zIndex?: number }>(),
  { zIndex: 1000 },
);
const emits = defineEmits<DialogContentEmits>();

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props;

  return delegated;
});

const forwarded = useForwardPropsEmits(delegatedProps, emits);
</script>

<template>
  <DialogPortal>
    <DialogOverlay
      :style="{ zIndex }"
      class="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 border-border absolute inset-0 grid place-items-center overflow-y-auto border bg-black/80"
    >
      <DialogContent
        :class="
          cn(
            'border-border bg-background relative z-50 my-8 grid w-full max-w-lg gap-4 border p-6 shadow-lg duration-200 sm:rounded-lg md:w-full',
            props.class,
          )
        "
        :style="{ zIndex }"
        v-bind="forwarded"
        @pointer-down-outside="
          (event) => {
            const originalEvent = event.detail.originalEvent;
            const target = originalEvent.target as HTMLElement;
            if (
              originalEvent.offsetX > target.clientWidth ||
              originalEvent.offsetY > target.clientHeight
            ) {
              event.preventDefault();
            }
          }
        "
      >
        <slot></slot>

        <DialogClose
          class="hover:bg-secondary absolute right-4 top-4 rounded-md p-0.5 transition-colors"
        >
          <X class="h-4 w-4" />
          <span class="sr-only">Close</span>
        </DialogClose>
      </DialogContent>
    </DialogOverlay>
  </DialogPortal>
</template>
