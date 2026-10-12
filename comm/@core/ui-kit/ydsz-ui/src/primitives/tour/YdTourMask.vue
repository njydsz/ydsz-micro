<script lang="ts" setup>
/**
* YdTourMask —— 遮罩层 + 目标高亮孔洞。
 * 
 * 核心实现：全屏半透明蒙版 + spotlight 效果。
 * 高亮区域通过巨大 box-shadow 在蒙版层"挖孔"实现，
 * 避免多层 SVG clip-path 带来的性能开销。
 * 
 * 蒙版背景与 spotlight 阴影颜色保持一致（rgba-black 50%），
 * 视觉上目标元素被"点亮"，周围保持暗色遮罩。
 * 
 * @module primitives/tour/YdTourMask
 * @author ydsz-team
 * @since 26.10.10
 */
import { computed } from 'vue';

interface Props {
  /** 目标元素边界矩形（null 时全屏遮罩无孔洞） */
  rect: DOMRect | null;

  /** 是否显示遮罩 */
  show: boolean;

  /** 是否响应点击关闭 */
  closable: boolean;

  /** 遮罩 z-index */
  zIndex?: number;
}

const props = withDefaults(defineProps<Props>(), {
  closable: false,
  zIndex: 1000,
});

const emit = defineEmits<{
  clickMask: [];
}>();

/**
 * 目标元素高亮框的内联样式：
 * 位置偏移 4px 留出呼吸空间，
 * box-shadow 模拟超大固定蒙版在"清除"中间区域。
 */
const highlightStyle = computed(() => {
  if (!props.rect) return undefined;
  const { height, left, top, width } = props.rect;
  const padding = 4;
  return {
    height: `${height + padding * 2}px`,
    left: `${left - padding}px`,
    top: `${top - padding}px`,
    width: `${width + padding * 2}px`,
  };
});
</script>

<template>
  <Transition name="yd-tour-mask">
    <div
      v-if="show"
      class="yd-tour-mask fixed inset-0"
      :style="{ zIndex: `${zIndex}`, backgroundColor: 'rgba(0, 0, 0, 0.5)' }"
      aria-hidden="true"
      @click.self="closable && emit('clickMask')"
    >
      <!-- Spotlight cutout: 巨大的 box-shadow 覆盖遮罩层，仅在目标区域透出透明 -->
      <div
        v-if="highlightStyle"
        class="yd-tour-mask__highlight absolute rounded-lg transition-all duration-300 ease-out"
        :style="{
          ...highlightStyle,
          boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)',
          pointerEvents: 'none',
        }"
      />
    </div>
  </Transition>
</template>

<style scoped>
.yd-tour-mask-enter-active,
.yd-tour-mask-leave-active {
  transition: opacity 0.3s ease;
}

.yd-tour-mask-enter-from,
.yd-tour-mask-leave-to {
  opacity: 0;
}
</style>
