<script lang="ts" setup>
/**
 * * AvatarGroup —— 头像组。
 * *
 * * 展示一组头像；当数量超过 maxCount 时，将溢出的头像折叠到 "+N" 节点，
 * * 由 Popover 弹出展示被隐藏的头像列表（avatar + name）。
 * *
 * * - 底层使用 Radix Vue Popover primitives
 * * - maxPopoverTrigger 控制溢出触发方式（click | hover）
 * * - overlap 头像横向重叠排列
 * *
 * * @path comm\@core\ui-kit\ydsz-ui\src\ui\avatar-group\avatar-group.vue
 * * @author ydsz-team
 * @since 1.0.0
 */
// @ts-nocheck
import { computed, ref } from 'vue';

import { cn } from '@ydsz-core/shared/utils';

import {
  YdAvatar,
  YdAvatarFallback,
  YdAvatarImage,
} from '.././avatar';

import {
  YdPopover,
  YdPopoverContent,
  YdPopoverTrigger,
} from '.././popover';

import type { AvatarGroupProps, AvatarItem } from './avatar-group-types';
import { useLocale } from '../../locale/useLocale';

const { t } = useLocale();

defineOptions({ name: 'YdAvatarGroup' });

const props = withDefaults(defineProps<AvatarGroupProps>(), {
  maxCount: undefined,
  maxPopoverTrigger: 'hover',
  size: 'md',
  overlap: true,
  class: undefined,
});

const emit = defineEmits<{
  overflowClick: [count: number];
}>();

/** size prop 映射到 Avatar size variant */
const avatarSizeMap = {
  sm: 'xs',
  md: 'sm',
  lg: 'base',
} as const;

const avatarSize = computed(() => avatarSizeMap[props.size]);

/* 可见区域与溢出区域 */
const visibleItems = computed<AvatarItem[]>(() =>
  props.maxCount !== undefined
    ? props.items.slice(0, props.maxCount)
    : props.items.slice(),
);

const overflowItems = computed<AvatarItem[]>(() =>
  props.maxCount !== undefined ? props.items.slice(props.maxCount) : [],
);

const overflowCount = computed(() => overflowItems.value.length);
const hasOverflow = computed(() => overflowCount.value > 0);

/* 折叠节点自身的大小（用于重叠偏移计数） */
const overlapOffset = computed(() => (props.overlap ? -8 : 4));

/* Popover open 状态（hover 模式下由 mouseenter/mouseleave 直接驱动） */
const popoverOpen = ref(false);

function handleOverflowMouseEnter() {
  if (props.maxPopoverTrigger === 'hover') {
    popoverOpen.value = true;
  }
}

function handleOverflowMouseLeave() {
  if (props.maxPopoverTrigger === 'hover') {
    popoverOpen.value = false;
  }
}

function handleOverflowClick() {
  if (props.maxPopoverTrigger === 'click') {
    popoverOpen.value = !popoverOpen.value;
  }

  emit('overflowClick', overflowCount.value);
}
</script>

<template>
  <div :class="cn('yd-avatar-group flex items-center', props.class)">
    <!-- 可见头像 -->
    <template v-for="(item, i) in visibleItems" :key="i">
      <YdAvatar
        :size="avatarSize"
        class="yd-avatar-group__avatar ring-2 ring-background"
        :style="{
          marginLeft: i === 0 ? 0 : `${overlapOffset}px`,
        }"
      >
        <YdAvatarImage v-if="item.src" :src="item.src" :alt="item.name ?? ''" />
        <YdAvatarFallback>
          {{ item.fallback ?? item.name?.charAt(0) ?? '?' }}
        </YdAvatarFallback>
      </YdAvatar>
    </template>

    <!-- 溢出折叠节点（含 Popover） -->
    <YdPopover v-if="hasOverflow" v-model:open="popoverOpen">
      <YdPopoverTrigger as-child>
        <!--
          触发器节点：
          - hover 模式下 mouseenter/mouseleave 直接控制 popoverOpen；
          - click 模式下 Radix PopoverTrigger 自动 toggle + 我们也发 overflowClick 事件。
        -->
        <button
          type="button"
          class="yd-avatar-group__overflow flex items-center justify-center rounded-full bg-neutral-600 px-2 py-0.5 text-xs font-medium text-white ring-2 ring-background transition-colors hover:bg-neutral-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          :style="{ marginLeft: `${overlapOffset}px` }"
          @mouseenter="handleOverflowMouseEnter"
          @mouseleave="handleOverflowMouseLeave"
          @click="handleOverflowClick"
          :aria-label="t('avatarGroup.more')"
        >
          +{{ overflowCount }}
        </button>
      </YdPopoverTrigger>

      <YdPopoverContent
        class="z-50 w-auto min-w-[140px] max-w-[260px] rounded-md border border-border bg-popover p-3 text-popover-foreground shadow-md"
        side="bottom"
        align="start"
        :side-offset="4"
      >
        <div class="grid grid-cols-3 gap-2 sm:grid-cols-4">
          <div
            v-for="(item, i) in overflowItems"
            :key="i"
            class="flex flex-col items-center gap-1"
            :title="item.name ?? ''"
          >
            <YdAvatar :size="avatarSize">
              <YdAvatarImage v-if="item.src" :src="item.src" :alt="item.name ?? ''" />
              <YdAvatarFallback>
                {{ item.fallback ?? item.name?.charAt(0) ?? '?' }}
              </YdAvatarFallback>
            </YdAvatar>
            <span
              class="block w-full truncate text-center text-xs text-muted-foreground"
            >
              {{ item.name ?? '—' }}
            </span>
          </div>
        </div>
      </YdPopoverContent>
    </YdPopover>
  </div>
</template>

<style scoped>
.yd-avatar-group__overflow {
  cursor: pointer;
  line-height: 1.25rem;
}
</style>
