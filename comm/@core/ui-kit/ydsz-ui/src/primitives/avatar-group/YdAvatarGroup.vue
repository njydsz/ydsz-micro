<script setup lang="ts">
import { cn } from '@ydsz-core/shared/utils';

import { YdAvatar, YdAvatarFallback, YdAvatarImage } from '../avatar';

interface Props {
  class?: any;
  /** 头像数据 */
  items: Array<{
    name?: string;
    src?: string;
    fallback?: string;
  }>;
  /** 最大显示数，超出以 +N 表示 */
  max?: number;
  /** 头像间距压缩量（px，负值） */
  overlap?: number;
}

withDefaults(defineProps<Props>(), {
  max: undefined,
  overlap: 8,
});
</script>

<template>
  <div :class="cn('flex items-center', props.class)">
    <template v-for="(item, i) in (props.max ? props.items.slice(0, props.max) : props.items)" :key="i">
      <YdAvatar
        :class="'border-background ring-2'"
        :style="{ marginLeft: i === 0 ? 0 : `-${props.overlap}px` }"
      >
        <YdAvatarImage v-if="item.src" :alt="item.name ?? ''" :src="item.src" />
        <YdAvatarFallback>{{ item.fallback ?? item.name?.charAt(0) ?? '?' }}</YdAvatarFallback>
      </YdAvatar>
    </template>
    <div
      v-if="props.max !== undefined && props.items.length > props.max"
      class="flex items-center justify-center rounded-full border-2 border-background bg-neutral-600 px-2 py-1 text-xs font-medium text-white ring-2 ring-background"
      :style="{ marginLeft: `-${props.overlap}px` }"
    >
      +{{ props.items.length - props.max }}
    </div>
  </div>
</template>
