<!--
 * 头像容器：融合 radix 的 AvatarRoot / AvatarImage / AvatarFallback 三态。
 *
 * 合在一个组件里是为了让调用方只传 src 与 alt：加载成功显示图片、失败或加载中
 * 自动回落到 fallback 内容，省去每个使用点都手写三件套。
 *
 * @path comm\@core\ui-kit\shadcn-ui\src\components\avatar\avatar.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script setup lang="ts">
import type {
  AvatarFallbackProps,
  AvatarImageProps,
  AvatarRootProps,
} from 'radix-vue';

import type { CSSProperties } from 'vue';

import type { ClassType } from '@YDSZ-core/typings';

import { computed } from 'vue';

import { Avatar, AvatarFallback, AvatarImage } from '../../ui';

interface Props extends AvatarFallbackProps, AvatarImageProps, AvatarRootProps {
  alt?: string;
  class?: ClassType;
  dot?: boolean;
  dotClass?: ClassType;
  fit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
  size?: number;
}

defineOptions({
  inheritAttrs: false,
});

const props = withDefaults(defineProps<Props>(), {
  alt: 'avatar',
  as: 'button',
  dot: false,
  dotClass: 'bg-green-500',
  fit: 'cover',
});

const imageStyle = computed<CSSProperties>(() => {
  const { fit } = props;
  if (fit) {
    return { objectFit: fit };
  }
  return {};
});

const text = computed(() => {
  return props.alt.slice(-2).toUpperCase();
});

const rootStyle = computed(() => {
  return props.size !== undefined && props.size > 0
    ? {
        height: `${props.size}px`,
        width: `${props.size}px`,
      }
    : {};
});
</script>

<template>
  <div
    :class="props.class"
    :style="rootStyle"
    class="relative flex flex-shrink-0 items-center"
    role="img"
    :aria-label="alt"
  >
    <Avatar :class="props.class" class="size-full">
      <AvatarImage :alt="alt" :src="src" :style="imageStyle" />
      <AvatarFallback aria-hidden="true">{{ text }}</AvatarFallback>
    </Avatar>
    <span
      v-if="dot"
      :class="dotClass"
      class="border-background absolute bottom-0 right-0 size-3 rounded-full border-2"
      aria-hidden="true"
    >
    </span>
  </div>
</template>

