<!--
 * 用户头像组件 — 含在线状态指示
 *
 * 使用自研 YdAvatarBase 组件栈（YdAvatarBase / YdAvatarImageBase / YdAvatarFallbackBase）+ 在线状态点。
 *
 * @path comm\effects\shared-business\src\components\user-avatar.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
import { computed } from 'vue';

import {
  YdAvatarBase,
  YdAvatarFallbackBase,
  YdAvatarImageBase,
} from '@ydsz-core/shadcn-ui';
import { cn } from '@ydsz-core/shared/utils';

interface Props {
  name?: string;
  avatar?: string;
  userId?: string;
  online?: boolean;
  size?: number;
}

const props = withDefaults(defineProps<Props>(), {
  name: '',
  avatar: '',
  online: false,
  size: 32,
});

const displayName = computed(() => {
  if (props.name) return props.name.slice(0, 2);
  return props.userId?.slice(-2) || '??';
});
</script>

<template>
  <div
    :class="cn('user-avatar', 'relative inline-flex')"
    :style="{ '--avatar-size': size + 'px' }"
  >
    <YdAvatarBase
      :class="cn('user-avatar__container')"
      :style="{ width: size + 'px', height: size + 'px' }"
    >
      <YdAvatarImageBase
        v-if="avatar"
        :src="avatar"
        :alt="props.name || props.userId"
      />
      <YdAvatarFallbackBase>
        {{ displayName }}
      </YdAvatarFallbackBase>
    </YdAvatarBase>
    <span
      v-if="online"
      class="online-dot"
      aria-label="在线"
    />
  </div>
</template>

<style scoped>
.user-avatar:hover .user-avatar__container {
  opacity: 0.9;
}

.online-dot {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: hsl(var(--success-500, #22c55e));
  border: 2px solid hsl(var(--bg-surface-2, #fff));
}
</style>
