<!--
 * 流光文字：用径向渐变背景配合 shine 关键帧做扫光，
 * 再借 bg-clip-text + text-transparent 把渐变裁剪到字形上，用于强调品牌名或关键数值。
 *
 * 动画时长与循环次数以内联 style 下发而非写死在 CSS 里，
 * 让同一套样式可以按不同节奏复用；默认无限循环，纯装饰效果、不承载语义信息。
 *
 * @path comm\@core\ui-kit\shadcn-ui\src\components\spine-text\spine-text.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
import { computed } from 'vue';

const { animationDuration = 2, animationIterationCount = 'infinite' } =
  defineProps<{
    // 动画持续时间，单位秒
    animationDuration?: number;
    // 动画是否只执行一次
    animationIterationCount?: 'infinite' | number;
  }>();

const style = computed(() => {
  return {
    animation: `shine ${animationDuration}s linear ${animationIterationCount}`,
  };
});
</script>
<template>
  <div :style="style" class="YDSZ-spine-text !bg-clip-text text-transparent">
    <slot></slot>
  </div>
</template>
<style>
.YDSZ-spine-text {
  background-color: #000;
  background-image: radial-gradient(circle at center, rgb(255 255 255 / 80%), #f000);
  background-position: -200% 50%;
  background-size: 200% 100%;
  background-repeat: no-repeat;

  /* animation: shine 3s linear infinite; */
}

.dark .YDSZ-spine-text {
  background-color: #f4f4f4;
  background-image: radial-gradient(circle at center, rgb(24 24 26 / 80%), transparent);
  background-position: -200% 50%;
  background-size: 200% 100%;
  background-repeat: no-repeat;
}

@keyframes shine {
  0% {
    background-position: 200% 0%;
  }

  100% {
    background-position: -200% 0%;
  }
}
</style>
