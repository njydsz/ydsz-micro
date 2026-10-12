<script lang="ts" setup>
// @ts-nocheck
import { onBeforeUnmount, onMounted, ref } from 'vue';

import { cn } from '@ydsz-core/shared/utils';
import { ChevronLeft, ChevronRight } from 'lucide-vue-next';

type Effect = 'fade' | 'slide';

interface Props {
  /** 自动播放 */
  autoplay?: boolean;
  /** 自动播放间隔（ms） */
  autoplaySpeed?: number;
  class?: any;
  /** 是否显示指示 dots */
  dots?: boolean;
  /** 切换效果 */
  effect?: Effect;
  /** 是否循环 */
  loop?: boolean;
  /** 是否显示切换箭头 */
  arrows?: boolean;
  /** 当前索引（受控） */
  current?: number;
}

const props = withDefaults(defineProps<Props>(), {
  arrows: true,
  autoplay: false,
  autoplaySpeed: 3000,
  current: 0,
  dots: true,
  effect: 'slide',
  loop: true,
});

const emit = defineEmits<{
  change: [index: number];
}>();

const activeIndex = ref(props.current);
let timer: ReturnType<typeof setInterval> | null = null;

const totalItems = ref(0);

function next(): void {
  const nextIndex = activeIndex.value + 1;
  if (nextIndex >= totalItems.value) {
    if (props.loop) switchTo(0);
  } else {
    switchTo(nextIndex);
  }
}

function prev(): void {
  const prevIndex = activeIndex.value - 1;
  if (prevIndex < 0) {
    if (props.loop) switchTo(totalItems.value - 1);
  } else {
    switchTo(prevIndex);
  }
}

function switchTo(index: number): void {
  activeIndex.value = index;
  emit('change', index);
  if (props.autoplay) restartAutoplay();
}

function startAutoplay(): void {
  if (!props.autoplay || timer !== null) return;
  timer = setInterval(next, props.autoplaySpeed);
}

function stopAutoplay(): void {
  if (timer !== null) {
    clearInterval(timer);
    timer = null;
  }
}

function restartAutoplay(): void {
  stopAutoplay();
  startAutoplay();
}

onMounted(() => {
  // 统计 slot 中的 carousel-item 数量
  const slotContent = document.querySelectorAll('[data-carousel-item]');
  totalItems.value = slotContent.length;
  startAutoplay();
});

onBeforeUnmount(() => {
  stopAutoplay();
});

defineExpose({ next, prev, switchTo });
</script>

<template>
  <div
    :class="cn('relative overflow-hidden rounded-lg', props.class)"
    @mouseenter="stopAutoplay"
    @mouseleave="startAutoplay"
  >
    <!-- 内容区 -->
    <div class="relative h-full w-full">
      <slot :active-index="activeIndex"></slot>
    </div>

    <!-- 切换箭头 -->
    <button
      v-if="props.arrows"
      :aria-label="'上一项'"
      class="absolute left-2 top-1/2 z-10 flex size-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/30 text-white transition-colors hover:bg-black/50"
      type="button"
      @click="prev"
    >
      <ChevronLeft class="size-4" />
    </button>
    <button
      v-if="props.arrows"
      :aria-label="'下一项'"
      class="absolute right-2 top-1/2 z-10 flex size-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/30 text-white transition-colors hover:bg-black/50"
      type="button"
      @click="next"
    >
      <ChevronRight class="size-4" />
    </button>

    <!-- 指示 dots -->
    <div v-if="props.dots" class="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 gap-1.5">
      <button
        v-for="i in totalItems"
        :key="i - 1"
        :aria-label="`第 ${i} 项`"
        :class="cn('size-2 rounded-full transition-colors', activeIndex === i - 1 ? 'bg-white' : 'bg-white/50 hover:bg-white/80')"
        type="button"
        @click="switchTo(i - 1)"
      ></button>
    </div>
  </div>
</template>
