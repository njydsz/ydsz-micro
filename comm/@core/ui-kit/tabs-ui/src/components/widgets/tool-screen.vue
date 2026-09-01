<!--
 * 内容区的全屏/退出全屏切换按钮，图标在 Fullscreen 与 Minimize2 之间切换。
 *
 * 只负责切换布尔状态，真正的全屏动作（requestFullscreen 或布局调整）由父级执行 ——
 * 浏览器全屏 API 需要用户手势与错误处理，放在父级更可控。
 *
 * @path comm\@core\ui-kit\tabs-ui\src\components\widgets\tool-screen.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
import { Fullscreen, Minimize2 } from '@YDSZ-core/icons';

const screen = defineModel<boolean>('screen');

function toggleScreen() {
  screen.value = !screen.value;
}
</script>

<template>
  <div
    class="flex-center hover:bg-muted hover:text-foreground text-muted-foreground border-border h-full cursor-pointer border-l px-2 text-lg font-semibold"
    @click="toggleScreen"
  >
    <Minimize2 v-if="screen" class="size-4" />
    <Fullscreen v-else class="size-4" />
  </div>
</template>
