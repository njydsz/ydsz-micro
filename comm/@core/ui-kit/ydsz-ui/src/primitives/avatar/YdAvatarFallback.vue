<!--
 * 头像的兜底内容：图片尚未加载完成或加载失败时展示（通常是姓名首字）。
 *
 * radix 会在图片 onError 时自动切换到本组件，因此这里不需要自行监听错误事件；
 * 兜底内容不是装饰，图片不可用时它就是唯一的身份信息载体。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\ui\avatar\YdAvatarFallback.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script setup lang="ts">
import type { AvatarFallbackProps } from '@ydsz-core/ydsz-vue';

import { YdAvatarFallback } from '@ydsz-core/ydsz-vue';

const props = defineProps<AvatarFallbackProps>();
</script>

<template>
  <YdAvatarFallback v-bind="props">
    <slot></slot>
  </YdAvatarFallback>
</template>
