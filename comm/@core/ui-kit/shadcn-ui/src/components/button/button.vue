<!--
 * 通用按钮：在基础 Button 之上补充 loading、图标与自定义渲染能力。
 *
 * 内容由默认插槽承载，因此图标与文案的排布交给调用方，组件只保证内边距、
 * 尺寸与 disabled / loading 期间不可点击的行为一致。
 *
 * @path comm\@core\ui-kit\shadcn-ui\src\components\button\button.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script setup lang="ts">
import type { YDSZButtonProps } from './button';

import { computed } from 'vue';

import { LoaderCircle } from '@YDSZ-core/icons';
import { cn } from '@YDSZ-core/shared/utils';

import { Primitive } from 'radix-vue';

import { buttonVariants } from '../../ui';

type Props = YDSZButtonProps;

const props = withDefaults(defineProps<Props>(), {
  as: 'button',
  class: '',
  disabled: false,
  loading: false,
  size: 'default',
  variant: 'default',
});

const isDisabled = computed(() => {
  return props.disabled || props.loading;
});
</script>

<template>
  <Primitive
    :as="as"
    :as-child="asChild"
    :class="cn(buttonVariants({ variant, size }), props.class)"
    :disabled="isDisabled"
    :aria-disabled="isDisabled"
    :aria-busy="loading"
    role="button"
  >
    <LoaderCircle
      v-if="loading"
      class="text-md mr-2 size-4 flex-shrink-0 animate-spin"
      aria-hidden="true"
    />
    <slot></slot>
  </Primitive>
</template>

