<!--
 * 开关：转发 radix SwitchRoot 的 props 与 emits，内部固定渲染 SwitchThumb 作为滑块。
 *
 * 状态色由 data-state=checked / unchecked 驱动，而不是绑定 v-model 后手动切换类 ——
 * radix 维护的才是唯一状态源，另存一份就会出现点击后颜色不同步的问题。
 * 带 peer 类是刻意的：让同级相邻的 Label 能跟随禁用与选中态变化。
 *
 * @path comm\@core\ui-kit\shadcn-ui\src\ui\switch\Switch.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script setup lang="ts">
import type { SwitchRootEmits, SwitchRootProps } from 'radix-vue';

import { computed } from 'vue';

import { cn } from '@YDSZ-core/shared/utils';

import { SwitchRoot, SwitchThumb, useForwardPropsEmits } from 'radix-vue';

type ClassValue = string | Record<string, boolean> | (string | Record<string, boolean>)[];

const props = defineProps<SwitchRootProps & { class?: ClassValue }>();

const emits = defineEmits<SwitchRootEmits>();

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props;

  return delegated;
});

const forwarded = useForwardPropsEmits(delegatedProps, emits);
</script>

<template>
  <SwitchRoot
    v-bind="forwarded"
    :class="
      cn(
        'focus-visible:ring-ring focus-visible:ring-offset-background data-[state=checked]:bg-primary data-[state=unchecked]:bg-input peer inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
        props.class,
      )
    "
  >
    <SwitchThumb
      :class="
        cn(
          'bg-background pointer-events-none block h-4 w-4 rounded-full shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0',
        )
      "
    />
  </SwitchRoot>
</template>
