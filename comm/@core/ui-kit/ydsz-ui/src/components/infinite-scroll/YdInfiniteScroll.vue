<script lang="ts" setup>
/**
 * 无限滚动组件：滚动到距离底部 threshold 范围内时触发 load-more。
 *
 * 使用 IntersectionObserver 监听哨兵元素，避免 scroll 事件高频计算。
 * loading / finished 任一为 true 时不重复触发；load-more 由父组件接管数据追加。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\components\infinite-scroll\YdInfiniteScroll.vue
 * @author ydsz-team
 * @since 1.0.0
 */
import type { InfiniteScrollEmits, InfiniteScrollProps } from './types';

import { onBeforeUnmount, onMounted, ref, watch } from 'vue';

import { Loader2 } from 'lucide-vue-next';

import { cn } from '@ydsz-core/shared/utils';

import { useLocale } from '../../locale/useLocale';

const { t } = useLocale();

defineOptions({ name: 'YdInfiniteScroll' });

const props = withDefaults(defineProps<InfiniteScrollProps>(), {
  finished: false,
  loading: false,
  threshold: 100,
});

const emit = defineEmits<InfiniteScrollEmits>();

/** 哨兵元素：进入视口即视为到达底部 */
const sentinelRef = ref<HTMLElement>();
let observer: IntersectionObserver | undefined;

function handleIntersect(entries: IntersectionObserverEntry[]): void {
  const entry = entries[0];
  if (!entry?.isIntersecting) return;
  if (props.loading || props.finished) return;
  emit('load-more');
}

onMounted(() => {
  if (!sentinelRef.value) return;
  observer = new IntersectionObserver(handleIntersect, {
    rootMargin: `0px 0px ${props.threshold}px 0px`,
    threshold: 0,
  });
  observer.observe(sentinelRef.value);
});

// threshold 变化时重建 observer（rootMargin 不可变）
watch(
  () => props.threshold,
  () => {
    observer?.disconnect();
    if (!sentinelRef.value) return;
    observer = new IntersectionObserver(handleIntersect, {
      rootMargin: `0px 0px ${props.threshold}px 0px`,
      threshold: 0,
    });
    observer.observe(sentinelRef.value);
  },
);

onBeforeUnmount(() => {
  observer?.disconnect();
});
</script>

<template>
  <div :class="cn('infinite-scroll', props.class)">
    <!-- 内容区 -->
    <slot></slot>

    <!-- 哨兵 + 状态区 -->
    <div ref="sentinelRef" class="infinite-scroll__sentinel">
      <slot v-if="props.loading" name="loading">
        <div
          class="text-muted-foreground flex items-center justify-center gap-2 py-3 text-sm"
          role="status"
          aria-live="polite"
        >
          <Loader2 class="size-4 animate-spin" />
          <span>{{ t('common.loading') }}</span>
        </div>
      </slot>
      <slot v-else-if="props.finished" name="finished">
        <div
          class="text-muted-foreground border-border flex items-center justify-center py-3 text-sm"
        >
          <span>{{ t('infiniteScroll.noMore') }}</span>
        </div>
      </slot>
    </div>
  </div>
</template>
