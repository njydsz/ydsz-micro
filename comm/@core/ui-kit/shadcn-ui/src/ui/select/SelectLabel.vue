<!--
 * 选项分组的标题：作为分组的无障碍名称，通常为弱化小字。
 *
 * 必须放在 SelectGroup 内部才能被 radix 正确关联；
 * 它不是可选项，也不能被键盘聚焦。
 *
 * @path comm\@core\ui-kit\shadcn-ui\src\ui\select\SelectLabel.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script setup lang="ts">
import type { SelectLabelProps } from 'radix-vue';

import { cn } from '@YDSZ-core/shared/utils';

import { SelectLabel } from 'radix-vue';

const props = defineProps<SelectLabelProps & { class?: any }>();
</script>

<template>
  <SelectLabel :class="cn('px-2 py-1.5 text-sm font-semibold', props.class)">
    <slot></slot>
  </SelectLabel>
</template>
