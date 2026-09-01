<!--
 * 侧边栏的折叠拉手：贴在侧边栏右缘中点，点击切换折叠状态。
 *
 * 定位放在侧边栏之外（-right-4 + translateY(-50%)），因此不占侧边栏内部宽度、
 * 折叠前后位置固定不变；点击事件加 .stop 是必须的 ——
 * 侧边栏自身有悬停展开逻辑，冒泡上去会立刻把刚折叠的状态又展开。
 *
 * @path comm\@core\ui-kit\layout-ui\src\components\widgets\sidebar-collapse-button.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script setup lang="ts">
import { ChevronsLeft, ChevronsRight } from '@YDSZ-core/icons';

const collapsed = defineModel<boolean>('collapsed');

function handleCollapsed() {
  collapsed.value = !collapsed.value;
}
</script>

<template>
  <div
    :style="{
      transform: 'translateY(-50%)',
    }"
    class="flex-center hover:text-foreground text-foreground/60 hover:bg-accent bg-sidebar border-border absolute -right-4 top-[50%] z-10 h-56 w-4 cursor-pointer rounded-r-full border"
    @click.stop="handleCollapsed"
  >
    <ChevronsRight v-if="collapsed" class="size-4" />
    <ChevronsLeft v-else class="size-4" />
  </div>
</template>
