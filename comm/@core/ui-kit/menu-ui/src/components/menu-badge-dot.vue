<!--
 * 菜单项的红点徽标：由一个常驻圆点加一个 ping 动画的扩散圈叠成。
 *
 * 用两个元素而不是给单个元素加动画，是为了让扩散效果不带动本体一起缩放；
 * 颜色通过 dotClass / dotStyle 双通道下发，前者走预设语义色、后者支持任意合法色值。
 *
 * @path comm\@core\ui-kit\menu-ui\src\components\menu-badge-dot.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script setup lang="ts">
import type { CSSProperties } from 'vue';

interface Props {
  dotClass?: string;
  dotStyle?: CSSProperties;
}

withDefaults(defineProps<Props>(), {
  dotClass: '',
  dotStyle: () => ({}),
});
</script>
<template>
  <span class="relative mr-1 flex size-1.5">
    <span
      :class="dotClass"
      :style="dotStyle"
      class="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"
    >
    </span>
    <span
      :class="dotClass"
      :style="dotStyle"
      class="relative inline-flex size-1.5 rounded-full"
    ></span>
  </span>
</template>
