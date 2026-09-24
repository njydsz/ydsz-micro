<script lang="ts" setup>
// @ts-nocheck
import { onBeforeUnmount, onMounted, ref } from 'vue';

import { cn } from '@ydsz-core/shared/utils';

interface Props {
  class?: any;
  defaultSizes?: number[];
  /** 方向 */
  direction?: 'horizontal' | 'vertical';
  /** 是否缓存 */
  lazy?: boolean;
  /** 面板尺寸 */
  sizes?: number[];
  /** 最小尺寸 */
  minSizes?: number[];
  /** 最大尺寸 */
  maxSizes?: number[];
}

const props = withDefaults(defineProps<Props>(), {
  defaultSizes: () => [50, 50],
  direction: 'horizontal',
  lazy: false,
  maxSizes: () => [100, 100],
  minSizes: () => [0, 0],
  sizes: undefined,
});

const emit = defineEmits<{
  change: [sizes: number[]];
}>();

const containerRef = ref<HTMLElement>();
const innerSizes = ref([...props.sizes ?? props.defaultSizes]);
let isDragging = false;
let activeIndex = -1;

function getContainerSize(): number {
  if (!containerRef.value) return 0;
  return props.direction === 'horizontal'
    ? containerRef.value.offsetWidth
    : containerRef.value.offsetHeight;
}

function handleMouseDown(index: number, event: MouseEvent): void {
  event.preventDefault();
  isDragging = true;
  activeIndex = index;
  document.addEventListener('mousemove', handleMouseMove);
  document.addEventListener('mouseup', handleMouseUp);
}

function handleMouseMove(event: MouseEvent): void {
  if (!isDragging || activeIndex < 0 || !containerRef.value) return;
  const rect = containerRef.value.getBoundingClientRect();
  const isH = props.direction === 'horizontal';
  const total = isH ? rect.width : rect.height;
  const offset = isH ? event.clientX - rect.left : event.clientY - rect.top;
  const percent = (offset / total) * 100;

  const minA = props.minSizes?.[activeIndex] ?? 0;
  const maxA = props.maxSizes?.[activeIndex] ?? 100;
  const minB = props.minSizes?.[activeIndex + 1] ?? 0;
  const maxB = props.maxSizes?.[activeIndex + 1] ?? 100;

  const clamped = Math.max(minA + 5, Math.min(maxB - 5, percent));

  const rest = 100 - clamped;
  innerSizes.value = innerSizes.value.map((s, i) =>
    i === activeIndex ? clamped : i === activeIndex + 1 ? rest : s,
  );
  emit('change', [...innerSizes.value]);
}

function handleMouseUp(): void {
  isDragging = false;
  activeIndex = -1;
  document.removeEventListener('mousemove', handleMouseMove);
  document.removeEventListener('mouseup', handleMouseUp);
}

onMounted(() => {});
onBeforeUnmount(() => handleMouseUp());
</script>

<template>
  <div
    ref="containerRef"
    :class="cn('flex h-full w-full overflow-hidden', props.direction === 'vertical' && 'flex-col', props.class)"
    style="user-select: none"
  >
    <template v-for="(size, i) in innerSizes" :key="i">
      <div
        :class="cn('overflow-hidden')"
        :style="{
          [direction === 'horizontal' ? 'width' : 'height']: `${size}%`,
        }"
      >
        <slot :name="`panel-${i}`" :index="i"></slot>
      </div>
      <div
        v-if="i < innerSizes.length - 1"
        :aria-label="`调整面板大小`"
        :class="
          cn(
            'relative z-10 flex shrink-0 items-center justify-center bg-border transition-colors hover:bg-primary/20',
            props.direction === 'horizontal' ? 'w-1 cursor-col-resize' : 'h-1 cursor-row-resize',
            isDragging && 'bg-primary/30',
          )
        "
        role="separator"
        tabindex="0"
        @mousedown="handleMouseDown(i, $event)"
      >
        <div :class="cn(
          'rounded-full bg-muted-foreground/30',
          props.direction === 'horizontal' ? 'h-8 w-0.5' : 'h-0.5 w-8',
        )"></div>
      </div>
    </template>
  </div>
</template>
