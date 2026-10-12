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
import { computed } from 'vue';

import type { PrimitiveProps } from '@ydsz-core/ydsz-vue';

import type { ButtonVariants, ButtonVariantSize } from './button.vue';

import { cn } from '@ydsz-core/shared/utils';

import { Loader2 } from 'lucide-vue-next';
import { Primitive } from '@ydsz-core/ydsz-vue';

import { buttonVariants } from './button.vue';
import { useDensity } from '../../composables/use-density';

/** CSS class 类型定义 */
type ClassValue = string | Record<string, boolean> | (string | Record<string, boolean>)[];

interface Props extends PrimitiveProps {
  class?: ClassValue;
  /** 加载中：禁用按钮并在左侧显示旋转动效 */
  loading?: boolean;
  /** 尺寸（显式指定时优先于全局密度） */
  size?: ButtonVariantSize;
  variant?: ButtonVariants;
}

const props = withDefaults(defineProps<Props>(), {
  as: 'button',
  class: '',
  loading: false,
});

/** 全局密度 */
const density = useDensity();

/** 密度档位 → 按钮 size 变体映射（仅当 props.size 未显式设置时生效） */
const densitySizeMap: Record<'compact' | 'default' | 'large', ButtonVariantSize> = {
  compact: 'sm',
  default: 'default',
  large: 'lg',
};

/** 计算最终 size：显式 props.size > 密度映射 > 默认 */
const resolvedSize = computed(() => {
  if (props.size != null) return props.size;
  return densitySizeMap[density.value];
});

/** 密度追加类名（覆盖 cva 中的高度/内边距/字号） */
const densityClass = computed(() => {
  if (props.size != null) return '';
  switch (density.value) {
    case 'compact':
      return 'h-7 px-2 text-xs';
    case 'large':
      return 'h-11 px-5 text-base';
    default:
      return '';
  }
});
</script>

<template>
  <Primitive
    :as="as"
    :as-child="asChild"
    :aria-disabled="loading"
    :class="cn(buttonVariants({ variant: variant, size: resolvedSize }), densityClass, props.class)"
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
