<!--
 * 对话框触发器：包装 radix DialogTrigger，点击即打开对话框。
 *
 * 配合 as-child 使用可让它复用宿主元素（如自定义按钮）的样式与语义，
 * 否则会多套一层 button，导致嵌套按钮与样式错乱。
 *
 * @path comm\@core\ui-kit\shadcn-ui\src\ui\dialog\DialogTrigger.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script setup lang="ts">
import type { DialogTriggerProps } from 'radix-vue';

import { DialogTrigger } from 'radix-vue';

const props = defineProps<DialogTriggerProps>();
</script>

<template>
  <DialogTrigger v-bind="props">
    <slot></slot>
  </DialogTrigger>
</template>
