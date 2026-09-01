<!--
 * 全屏切换按钮：请求进入 / 退出浏览器全屏，并在图标上反映当前状态。
 *
 * 挂载时会重新读取一次全屏状态（含 webkit / moz / ms 前缀）：通过 F11 等方式
 * 进入全屏不会触发 fullscreenchange，若只依赖 VueUse 的初始值，
 * 刷新页面后按钮图标会与实际状态相反。
 * 全屏请求必须由用户手势触发，故本组件只能作为点击目标使用。
 *
 * @path comm\@core\ui-kit\shadcn-ui\src\components\full-screen\full-screen.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
import { Maximize, Minimize } from '@YDSZ-core/icons';

import { useFullscreen } from '@vueuse/core';

import { YDSZIconButton } from '../button';

defineOptions({ name: 'FullScreen' });

const { isFullscreen, toggle } = useFullscreen();

// 重新检查全屏状态
isFullscreen.value = !!(
  document.fullscreenElement ||
  // @ts-ignore
  document.webkitFullscreenElement ||
  // @ts-ignore
  document.mozFullScreenElement ||
  // @ts-ignore
  document.msFullscreenElement
);
</script>
<template>
  <YDSZIconButton
    :aria-label="isFullscreen ? '退出全屏' : '进入全屏'"
    :aria-pressed="isFullscreen"
    @click="toggle"
  >
    <Minimize v-if="isFullscreen" class="text-foreground size-4" aria-hidden="true" />
    <Maximize v-else class="text-foreground size-4" aria-hidden="true" />
  </YDSZIconButton>
</template>

