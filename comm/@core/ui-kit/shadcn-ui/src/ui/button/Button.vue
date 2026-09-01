<!--
 * 按钮：由 cva 变体产出 variant / size 两组类名，默认渲染为原生 button。
 *
 * 基于 radix Primitive 而非硬编码 button，是为了支持 as / asChild ——
 * 把样式套到 RouterLink 或第三方组件上时，不必再包一层无意义的 button。
 *
 * 样式合并必须走 cn()：默认变体已带 h-9 / px-4 等具体类，
 * 调用方若直接拼字符串，tailwind-merge 无法判定冲突，最终类名顺序将决定谁生效。
 *
 * @path comm\@core\ui-kit\shadcn-ui\src\ui\button\Button.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script setup lang="ts">
import type { PrimitiveProps } from 'radix-vue';

import type { ButtonVariants, ButtonVariantSize } from './types';

import { cn } from '@YDSZ-core/shared/utils';

import { Primitive } from 'radix-vue';

import { buttonVariants } from './button';

/** CSS class 类型定义 */
type ClassValue = string | Record<string, boolean> | (string | Record<string, boolean>)[];

interface Props extends PrimitiveProps {
  class?: ClassValue;
  size?: ButtonVariantSize;
  variant?: ButtonVariants;
}

const props = withDefaults(defineProps<Props>(), {
  as: 'button',
  class: '',
});
</script>

<template>
  <Primitive
    :as="as"
    :as-child="asChild"
    :class="cn(buttonVariants({ variant, size }), props.class)"
  >
    <slot></slot>
  </Primitive>
</template>
