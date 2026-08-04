<!--
 * extra-menu 布局组件
 *
 * @path comm\effects\layouts\src\basic\menu\extra-menu.vue
 * @author remi-team
 * @since 1.0.0
-->
<script lang="ts" setup>
import type { MenuRecordRaw } from '@remi/types';

import type { MenuProps } from '@remi-core/menu-ui';

import { useRoute } from 'vue-router';

import { Menu } from '@remi-core/menu-ui';

import { useNavigation } from './use-navigation';

interface Props extends MenuProps {
  collapse?: boolean;
  menus?: MenuRecordRaw[];
}

withDefaults(defineProps<Props>(), {
  accordion: true,
  menus: () => [],
});

const route = useRoute();
const { navigation } = useNavigation();

async function handleSelect(key: string) {
  await navigation(key);
}
</script>

<template>
  <Menu
    :accordion="accordion"
    :collapse="collapse"
    :default-active="route.meta?.activePath || route.path"
    :menus="menus"
    :rounded="rounded"
    :theme="theme"
    mode="vertical"
    @select="handleSelect"
  />
</template>
