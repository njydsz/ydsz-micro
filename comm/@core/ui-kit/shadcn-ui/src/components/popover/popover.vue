<!--
 * Popover 的一体化封装：把 radix-vue 的 PopoverRoot / Trigger / Content 三段合成单个组件，
 * 调用方只需给 trigger 与默认两个插槽即可得到定位与样式完备的浮层。
 *
 * props 分流设计：class / contentClass / triggerClass / contentProps 属于本项目的样式与配置入口，
 * 先从 props 中摘出，其余属性原样透传给 PopoverRoot —— 既保留 radix 的全部原生能力，
 * 又避免调用方的 class 越过 cn() 直接落到浮层容器上、覆盖掉定位所需的原子类。
 *
 * @path comm\@core\ui-kit\shadcn-ui\src\components\popover\popover.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script setup lang="ts">
import type {
  PopoverContentProps,
  PopoverRootEmits,
  PopoverRootProps,
} from 'radix-vue';

import type { ClassType } from '@YDSZ-core/typings';

import { computed } from 'vue';

import { useForwardPropsEmits } from 'radix-vue';

import {
  PopoverContent,
  Popover as PopoverRoot,
  PopoverTrigger,
} from '../../ui';

interface Props extends PopoverRootProps {
  class?: ClassType;
  contentClass?: ClassType;
  contentProps?: PopoverContentProps;
  triggerClass?: ClassType;
}

const props = withDefaults(defineProps<Props>(), {});

const emits = defineEmits<PopoverRootEmits>();

const delegatedProps = computed(() => {
  const {
    class: _cls,
    contentClass: _,
    contentProps: _cProps,
    triggerClass: _tClass,
    ...delegated
  } = props;

  return delegated;
});

const forwarded = useForwardPropsEmits(delegatedProps, emits);
</script>

<template>
  <PopoverRoot v-bind="forwarded">
    <PopoverTrigger :class="triggerClass">
      <slot name="trigger"></slot>

      <PopoverContent
        :class="contentClass"
        class="side-content z-popup"
        role="dialog"
        v-bind="contentProps"
      >
        <slot></slot>
      </PopoverContent>
    </PopoverTrigger>
  </PopoverRoot>
</template>
