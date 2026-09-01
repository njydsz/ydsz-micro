<!--
 * 回到顶部悬浮按钮：滚动超过阈值后出现，点击平滑滚回顶部。
 *
 * 显隐与滚动行为全部委托给 useBackTop，本组件只负责定位与呈现，
 * 便于在自定义容器（非 body 滚动）中复用同一套逻辑。
 * 定位由 bottom / right 控制；处于悬浮按钮组（isGroup）时改由外层容器统一排布。
 *
 * @path comm\@core\ui-kit\shadcn-ui\src\components\back-top\back-top.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
import type { BacktopProps } from './backtop';

import { computed } from 'vue';

import { ArrowUpToLine } from '@YDSZ-core/icons';

import { YDSZButton } from '../button';
import { useBackTop } from './use-backtop';

type Props = BacktopProps;

defineOptions({ name: 'BackTop' });

const props = withDefaults(defineProps<Props>(), {
  bottom: 20,
  isGroup: false,
  right: 24,
  target: '',
  visibilityHeight: 200,
});

const backTopStyle = computed(() => ({
  bottom: `${props.bottom}px`,
  right: `${props.right}px`,
}));

const { handleClick, visible } = useBackTop(props);
</script>
<template>
  <transition name="fade-down">
    <YDSZButton
      v-if="visible"
      :style="backTopStyle"
      class="dark:bg-accent dark:hover:bg-heavy bg-background hover:bg-heavy data shadow-float z-popup fixed bottom-10 size-10 rounded-full duration-500"
      size="icon"
      variant="icon"
      aria-label="返回顶部"
      @click="handleClick"
    >
      <ArrowUpToLine class="size-4" aria-hidden="true" />
    </YDSZButton>
  </transition>
</template>

