<!--
 * 单个字段的上下文提供者：生成唯一 id 并通过 FORM_ITEM_INJECTION_KEY 向下注入。
 *
 * 用 useId() 而不是自己递增计数器，是为了在 SSR 下服务端与客户端得到一致的 id，
 * 避免出现 hydration 不匹配；内部组件（Label / Control / Message）都从这个 id 派生各自的 aria id，
 * 因此一个字段内不需要调用方手动指定任何 id。
 *
 * @path comm\@core\ui-kit\shadcn-ui\src\ui\form\FormItem.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
import { provide, useId } from 'vue';

import { cn } from '@YDSZ-core/shared/utils';

import { FORM_ITEM_INJECTION_KEY } from './injectionKeys';

const props = defineProps<{
  class?: any;
}>();

const id = useId() as string;
provide(FORM_ITEM_INJECTION_KEY, id);
</script>

<template>
  <div :class="cn(props.class)">
    <slot></slot>
  </div>
</template>
