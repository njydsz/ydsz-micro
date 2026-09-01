<!--
 * 悬停卡片：鼠标悬停触发器时浮出详情卡片。
 *
 * 用于「补充说明但不打断当前操作」的场景（如用户名悬停展示资料），
 * 与 tooltip 的区别是内容可交互 —— 卡片内可以放链接与按钮，因此未加延迟销毁。
 *
 * @path comm\@core\ui-kit\shadcn-ui\src\components\hover-card\hover-card.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script setup lang="ts">
import type {
  HoverCardContentProps,
  HoverCardRootEmits,
  HoverCardRootProps,
} from 'radix-vue';

import type { ClassType } from '@YDSZ-core/typings';

import { computed } from 'vue';

import { useForwardPropsEmits } from 'radix-vue';

import { HoverCard, HoverCardContent, HoverCardTrigger } from '../../ui';

interface Props extends HoverCardRootProps {
  class?: ClassType;
  contentClass?: ClassType;
  contentProps?: HoverCardContentProps;
}

const props = defineProps<Props>();

const emits = defineEmits<HoverCardRootEmits>();

const delegatedProps = computed(() => {
  const {
    class: _cls,
    contentClass: _,
    contentProps: _cProps,
    ...delegated
  } = props;

  return delegated;
});

const forwarded = useForwardPropsEmits(delegatedProps, emits);
</script>

<template>
  <HoverCard v-bind="forwarded">
    <HoverCardTrigger as-child class="h-full">
      <div class="h-full cursor-pointer">
        <slot name="trigger"></slot>
      </div>
    </HoverCardTrigger>
    <HoverCardContent
      :class="contentClass"
      v-bind="contentProps"
      class="side-content z-popup"
      role="tooltip"
    >
      <slot></slot>
    </HoverCardContent>
  </HoverCard>
</template>

