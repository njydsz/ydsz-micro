/**
 * YdAvatarGroup（头像组）：多个头像横向重叠展示。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\primitives\avatar-group\YdAvatarGroup.vue
 * @author ydsz-team
 * @since 1.0.0
 */
<script setup lang="ts">
import { cn } from '@ydsz-core/shared/utils';

import { YdAvatar, YdAvatarFallback, YdAvatarImage } from '../avatar';

interface AvatarItem {
  /** 用户名/替代文本 */
  name?: string;
  /** 头像图片 src */
  src?: string;
  /** 自定义 fallback 文本 */
  fallback?: string;
}

interface Props {
  class?: Array<string> | string;
  /** 头像数据 */
  items: AvatarItem[];
  /** 最大显示数，超出以 +N 表示 */
  max?: number;
  /** 头像间距压缩量（px，负值） */
  overlap?: number;
}

const props = withDefaults(defineProps<Props>(), {
  max: undefined,
  overlap: 8,
});
</script>

<template>
  <div :class="cn('flex items-center', props.class)">
    <template
      v-for="(item, i) in (props.max ? props.items.slice(0, props.max) : props.items)"
      :key="i"
    >
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
