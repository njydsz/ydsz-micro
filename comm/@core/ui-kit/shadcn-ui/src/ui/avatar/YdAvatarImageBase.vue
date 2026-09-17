<!--
 * 头像图片：以 object-cover 铺满容器，配合 YdAvatarBase 的 overflow-hidden 完成裁剪。
 *
 * 加载失败交由 radix 内部状态处理并自动回退到 YdAvatarFallbackBase，
 * 故本组件不暴露错误回调 —— 调用方只需保证 YdAvatarBase 内同时提供兜底内容即可。
 *
 * @path comm\@core\ui-kit\shadcn-ui\src\ui\avatar\YdAvatarImageBase.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script setup lang="ts">
import type { AvatarImageProps } from 'radix-vue';

import { YdAvatarImageBase } from 'radix-vue';

const props = defineProps<AvatarImageProps>();
</script>

<template>
  <YdAvatarImageBase v-bind="props" class="h-full w-full object-cover" />
</template>
