<!--
 * menu Vue 组件
 *
 * @path comm\@core\ui-kit\menu-ui\src\menu.vue
 * @author remi-team
 * @since 1.0.0
-->
<script setup lang="ts">
import type { MenuRecordRaw } from '@remi-core/typings';

import type { MenuProps } from './types';

import { useForwardProps } from '@remi-core/composables';

import { Menu } from './components';
import SubMenu from './sub-menu.vue';

interface Props extends MenuProps {
  menus: MenuRecordRaw[];
}

defineOptions({
  name: 'MenuView',
});

const props = withDefaults(defineProps<Props>(), {
  collapse: false,
});

const forward = useForwardProps(props);
</script>

<template>
  <Menu v-bind="forward">
    <template v-for="menu in menus" :key="menu.path">
      <SubMenu :menu="menu" />
    </template>
  </Menu>
</template>
