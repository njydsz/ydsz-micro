<!--
 * 侧边栏的「固定/取消固定」按钮：切换悬停即展开（expandOnHover）行为。
 *
 * 未固定时侧边栏以折叠态常驻、鼠标悬停才展开，适合内容区需要最大宽度的场景；
 * 固定后则常驻展开。图标在 Pin / PinOff 之间切换，让状态在视觉上自解释。
 *
 * @path comm\@core\ui-kit\layout-ui\src\components\widgets\sidebar-fixed-button.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script setup lang="ts">
import { Pin, PinOff } from '@YDSZ-core/icons';

const expandOnHover = defineModel<boolean>('expandOnHover');

function toggleFixed() {
  expandOnHover.value = !expandOnHover.value;
}
</script>

<template>
  <div
    class="flex-center hover:text-foreground text-foreground/60 hover:bg-accent-hover bg-accent absolute bottom-2 right-3 z-10 cursor-pointer rounded-sm p-[5px] transition-all duration-300"
    @click="toggleFixed"
  >
    <PinOff v-if="!expandOnHover" class="size-3.5" />
    <Pin v-else class="size-3.5" />
  </div>
</template>
