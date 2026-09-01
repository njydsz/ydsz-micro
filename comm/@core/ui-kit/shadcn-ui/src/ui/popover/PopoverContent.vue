<!--
 * 浮层内容：经 Portal 挂到 body，默认居中对齐、与触发器保持 4px 间距。
 *
 * 关闭 inheritAttrs 并手动把 $attrs 展开到 PopoverContent 上，
 * 是为了让 attrs 落在浮层本身而不是多出来的根片段上 ——
 * 否则样式类会挂到一个没有布局作用的节点，看起来完全不生效。
 * sideOffset 默认 4px：贴得太近会让浮层与触发器在视觉上糊成一块。
 *
 * @path comm\@core\ui-kit\shadcn-ui\src\ui\popover\PopoverContent.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script setup lang="ts">
import type { PopoverContentEmits, PopoverContentProps } from 'radix-vue';

import { computed } from 'vue';

import { cn } from '@YDSZ-core/shared/utils';

import { PopoverContent, PopoverPortal, useForwardPropsEmits } from 'radix-vue';

defineOptions({
  inheritAttrs: false,
});

const props = withDefaults(
  defineProps<PopoverContentProps & { class?: any }>(),
  {
    align: 'center',
    sideOffset: 4,
  },
);
const emits = defineEmits<PopoverContentEmits>();

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props;

  return delegated;
});

const forwarded = useForwardPropsEmits(delegatedProps, emits);
</script>

<template>
  <PopoverPortal>
    <PopoverContent
      v-bind="{ ...forwarded, ...$attrs }"
      :class="
        cn(
          'bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 border-border w-72 rounded-md border p-4 shadow-md outline-none',
          props.class,
        )
      "
    >
      <slot></slot>
    </PopoverContent>
  </PopoverPortal>
</template>
