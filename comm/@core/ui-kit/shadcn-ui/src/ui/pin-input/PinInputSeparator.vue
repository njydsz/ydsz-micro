<!--
 * 验证码输入的分隔符：用于在两组输入之间做视觉分组（如 3-3 分隔）。
 *
 * 默认渲染一个 Dot 图标；它不参与输入序列，因此不要放在 PinInputGroup 内部 ——
 * radix 会按组内的输入框数量计算索引，多一个节点就会打乱自动跳格。
 *
 * @path comm\@core\ui-kit\shadcn-ui\src\ui\pin-input\PinInputSeparator.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script setup lang="ts">
import type { PrimitiveProps } from 'radix-vue';

import { Dot } from 'lucide-vue-next';
import { Primitive, useForwardProps } from 'radix-vue';

const props = defineProps<PrimitiveProps>();
const forwardedProps = useForwardProps(props);
</script>

<template>
  <Primitive v-bind="forwardedProps">
    <slot>
      <Dot />
    </slot>
  </Primitive>
</template>
