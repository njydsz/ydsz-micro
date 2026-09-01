<!--
 * 普通菜单：只渲染一层，按 menus 数组平铺，不做递归子菜单。
 *
 * 与递归版 Menu 的取舍：递归版支持任意层级但每级都是组件实例，
 * 层级深时开销与调试成本都高；本组件用于层级固定为一层的场景（如顶部导航）。
 * 激活图标的切换逻辑与 MenuItem 保持一致，避免出现两套高亮规则。
 *
 * @path comm\@core\ui-kit\menu-ui\src\components\normal-menu\normal-menu.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script setup lang="ts">
import type { MenuRecordRaw } from '@YDSZ-core/typings';

import type { NormalMenuProps } from './normal-menu';

import { useNamespace } from '@YDSZ-core/composables';
import { YDSZIcon } from '@YDSZ-core/shadcn-ui';

type Props = NormalMenuProps;

defineOptions({
  name: 'NormalMenu',
});

const props = withDefaults(defineProps<Props>(), {
  activePath: '',
  collapse: false,
  menus: () => [],
  theme: 'dark',
});

const emit = defineEmits<{
  enter: [MenuRecordRaw];
  select: [MenuRecordRaw];
}>();

const { b, e, is } = useNamespace('normal-menu');

function menuIcon(menu: MenuRecordRaw) {
  return props.activePath === menu.path
    ? menu.activeIcon || menu.icon
    : menu.icon;
}
</script>

<template>
  <ul
    :class="[
      theme,
      b(),
      is('collapse', collapse),
      is(theme, true),
      is('rounded', rounded),
    ]"
    class="relative"
  >
    <template v-for="menu in menus" :key="menu.path">
      <li
        :class="[e('item'), is('active', activePath === menu.path)]"
        @click="() => emit('select', menu)"
        @mouseenter="() => emit('enter', menu)"
      >
        <YDSZIcon :class="e('icon')" :icon="menuIcon(menu)" fallback />

        <span :class="e('name')" class="truncate"> {{ menu.name }}</span>
      </li>
    </template>
  </ul>
</template>
<style lang="scss" scoped>
$namespace: ydsz;

.#{$namespace}-normal-menu {
  --menu-item-margin-y: 4px;
  --menu-item-margin-x: 0;
  --menu-item-padding-y: 9px;
  --menu-item-padding-x: 0;
  --menu-item-radius: 0;

  height: calc(100% - 4px);

  &.is-rounded {
    --menu-item-radius: 6px;
    --menu-item-margin-x: 8px;
  }

  &.is-dark {
    .#{$namespace}-normal-menu__item {
      @apply text-foreground/80;
      // color: hsl(var(--foreground) / 80%);

      &:not(.is-active):hover {
        @apply text-foreground;
      }

      &.is-active {
        .#{$namespace}-normal-menu__name,
        .#{$namespace}-normal-menu__icon {
          @apply text-foreground;
        }
      }
    }
  }

  &.is-collapse {
    .#{$namespace}-normal-menu__name {
      width: 0;
      height: 0;
      margin-top: 0;
      overflow: hidden;
      opacity: 0;
    }

    .#{$namespace}-normal-menu__icon {
      font-size: 20px;
    }
  }

  &__item {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    // max-width: 64px;
    // max-height: 64px;
    padding: var(--menu-item-padding-y) var(--menu-item-padding-x);
    margin: var(--menu-item-margin-y) var(--menu-item-margin-x);
    color: hsl(var(--foreground) / 90%);
    cursor: pointer;
    border-radius: var(--menu-item-radius);
    transition:
      background 0.15s ease,
      padding 0.15s ease,
      border-color 0.15s ease;

    &.is-active {
      @apply text-primary bg-primary dark:bg-accent;

      .#{$namespace}-normal-menu__name,
      .#{$namespace}-normal-menu__icon {
        @apply text-primary-foreground font-semibold;
      }
    }

    &:not(.is-active):hover {
      @apply dark:bg-accent text-primary bg-heavy dark:text-foreground;
    }

    &:hover {
      .#{$namespace}-normal-menu__icon {
        transform: scale(1.2);
      }
    }
  }

  &__icon {
    max-height: 20px;
    font-size: 20px;
    transition: all 0.25s ease;
  }

  &__name {
    margin-top: 8px;
    margin-bottom: 0;
    font-size: 12px;
    font-weight: 400;
    transition: all 0.25s ease;
  }
}
</style>
