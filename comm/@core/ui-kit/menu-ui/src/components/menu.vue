<!--
 * 菜单容器：渲染为 ul 并带上 role=menu，承载模式（横/纵）、主题、折叠与手风琴等行为。
 *
 * 状态与交互逻辑全部委托给 useMenuLogic，本组件只做类名拼装与 DOM 渲染 ——
 * 菜单的展开、选中、滚动逻辑相当长，与模板混在一起将无法单测。
 * 样式变量由 useMenuStyle 计算后以内联 style 下发，便于按主题切换配色。
 *
 * @path comm\@core\ui-kit\menu-ui\src\components\menu.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
import type { MenuProps } from '../types';

import { useNamespace } from '@YDSZ-core/composables';
import { Ellipsis } from '@YDSZ-core/icons';

import { useMenuStyle } from '../hooks';
import { useMenuLogic } from '../composables/use-menu-logic';
import SubMenu from './sub-menu.vue';

type Props = MenuProps;

defineOptions({ name: 'Menu' });

const props = withDefaults(defineProps<Props>(), {
  accordion: true,
  collapse: false,
  mode: 'vertical',
  rounded: true,
  theme: 'dark',
  scrollToActive: false,
});

const emit = defineEmits<{
  close: [string, string[]];
  open: [string, string[]];
  select: [string, string[]];
}>();

const { b, is } = useNamespace('menu');
const menuStyle = useMenuStyle();

// 使用 use-menu-logic 组合式函数
const { getSlot, menu } = useMenuLogic({ props, emit });
</script>
<template>
  <ul
    ref="menu"
    :class="[
      theme,
      b(),
      is(mode, true),
      is(theme, true),
      is('rounded', rounded),
      is('collapse', collapse),
      is('menu-align', mode === 'horizontal'),
    ]"
    :style="menuStyle"
    role="menu"
  >
    <template v-if="mode === 'horizontal' && getSlot.showSlotMore">
      <template v-for="item in getSlot.slotDefault" :key="item.key">
        <component :is="item" />
      </template>
      <SubMenu is-sub-menu-more path="sub-menu-more">
        <template #title>
          <Ellipsis class="size-4" />
        </template>
        <template v-for="item in getSlot.slotMore" :key="item.key">
          <component :is="item" />
        </template>
      </SubMenu>
    </template>
    <template v-else>
      <slot></slot>
    </template>
  </ul>
</template>

<style lang="scss" src="./menu-styles.scss"></style>
