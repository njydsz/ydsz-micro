<!--
 * 按钮：由 cva 变体产出 variant / size 两组类名，默认渲染为原生 button。
 *
 * 基于 radix Primitive 而非硬编码 button，是为了支持 as / asChild ——
 * 把样式套到 RouterLink 或第三方组件上时，不必再包一层无意义的 button。
 *
 * 样式合并必须走 cn()：默认变体已带 h-9 / px-4 等具体类，
 * 调用方若直接拼字符串，tailwind-merge 无法判定冲突，最终类名顺序将决定谁生效。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\ui\button\YdButton.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script setup lang="ts">
import type { PrimitiveProps } from 'radix-vue';

import type { ButtonVariants, ButtonVariantSize } from './types';

import { cn } from '@ydsz-core/shared/utils';

import { Loader2 } from 'lucide-vue-next';
import { Primitive } from 'radix-vue';

import { buttonVariants } from './button';

/** CSS class 类型定义 */
type ClassValue = string | Record<string, boolean> | (string | Record<string, boolean>)[];

interface Props extends PrimitiveProps {
  class?: ClassValue;
  /** 加载中：禁用按钮并在左侧显示旋转动效 */
  loading?: boolean;
  size?: ButtonVariantSize;
  variant?: ButtonVariants;
}

const props = withDefaults(defineProps<Props>(), {
  as: 'button',
  class: '',
  loading: false,
});

</script>

<template>
  <Primitive
    :as="as"
    :as-child="asChild"
    :aria-disabled="loading"
    :class="cn(buttonVariants({ variant, size }), props.class)"
    :disabled="loading"
  >
    <Loader2
      v-if="loading"
      :class="cn('mr-1 size-4 animate-spin')"
      aria-hidden="true"
    />
    <slot></slot>
  </Primitive>
</template>
