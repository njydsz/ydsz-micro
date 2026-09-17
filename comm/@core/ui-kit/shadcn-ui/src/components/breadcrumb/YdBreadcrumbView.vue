<!--
 * 面包屑视图：按样式配置在普通形态与带背景形态之间切换。
 *
 * 作为对外使用的入口组件，它把样式分支收敛在一处，业务侧只传 breadcrumbs 数据
 * 与 styleType，不必自行判断该渲染哪个变体。
 * 通过 useForwardPropsEmits 把 props 与 select 事件透传给具体变体，
 * 避免中间层逐个声明再转发的样板代码。
 *
 * @path comm\@core\ui-kit\shadcn-ui\src\components\breadcrumb\breadcrumb-view.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
import type { BreadcrumbProps } from './types';

import { useForwardPropsEmits } from 'radix-vue';

import BreadcrumbBackground from './breadcrumb-background.vue';
import Breadcrumb from './breadcrumb.vue';

interface Props extends BreadcrumbProps {
  class?: any;
}

const props = withDefaults(defineProps<Props>(), {});

const emit = defineEmits<{ select: [string] }>();

const forward = useForwardPropsEmits(props, emit);
</script>
<template>
  <Breadcrumb
    v-if="styleType === 'normal'"
    v-bind="forward"
    class="YDSZ-breadcrumb"
  />
  <BreadcrumbBackground
    v-if="styleType === 'background'"
    v-bind="forward"
    class="YDSZ-breadcrumb"
  />
</template>
<style lang="scss" scoped>
/** 修复全局引入Antd时，ol和ul的默认样式会被修改的问题 */
.YDSZ-breadcrumb {
  :deep(ol),
  :deep(ul) {
    margin-bottom: 0;
  }
}
</style>

