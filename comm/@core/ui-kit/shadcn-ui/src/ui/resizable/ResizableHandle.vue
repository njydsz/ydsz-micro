<!--
 * 可拖拽的分栏手柄：转发 radix SplitterResizeHandle 的 props 与 emits。
 *
 * 命中区域比可见线条宽得多（after 伪元素左右各扩 1px 之外的宽度），
 * 因为 1px 的分隔线根本点不中；可见线仍是 1px，命中区与视觉分离是这里的权衡。
 * withHandle 用于在竖排时显示一个可抓握的提示条，提示用户「这里能拖」。
 * orientation 由 radix 通过 data-orientation 注入，故样式必须写在该属性选择器下。
 *
 * @path comm\@core\ui-kit\shadcn-ui\src\ui\resizable\ResizableHandle.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script setup lang="ts">
import type {
  SplitterResizeHandleEmits,
  SplitterResizeHandleProps,
} from 'radix-vue';

import type { HTMLAttributes } from 'vue';

import { computed } from 'vue';

import { GripVertical } from '@YDSZ-core/icons';
import { cn } from '@YDSZ-core/shared/utils';

import { SplitterResizeHandle, useForwardPropsEmits } from 'radix-vue';

const props = defineProps<
  SplitterResizeHandleProps & {
    class?: HTMLAttributes['class'];
    withHandle?: boolean;
  }
>();
const emits = defineEmits<SplitterResizeHandleEmits>();

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props;
  return delegated;
});

const forwarded = useForwardPropsEmits(delegatedProps, emits);
</script>

<template>
  <SplitterResizeHandle
    v-bind="forwarded"
    :class="
      cn(
        'bg-border focus-visible:ring-ring relative flex w-px items-center justify-center after:absolute after:inset-y-0 after:left-1/2 after:w-1 after:-translate-x-1/2 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-offset-1 [&[data-orientation=vertical]>div]:rotate-90 [&[data-orientation=vertical]]:h-px [&[data-orientation=vertical]]:w-full [&[data-orientation=vertical]]:after:left-0 [&[data-orientation=vertical]]:after:h-1 [&[data-orientation=vertical]]:after:w-full [&[data-orientation=vertical]]:after:-translate-y-1/2 [&[data-orientation=vertical]]:after:translate-x-0',
        props.class,
      )
    "
  >
    <template v-if="props.withHandle">
      <div
        class="bg-border z-10 flex h-4 w-3 items-center justify-center rounded-sm border"
      >
        <GripVertical class="h-2.5 w-2.5" />
      </div>
    </template>
  </SplitterResizeHandle>
</template>
