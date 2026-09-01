<!--
 * 右键菜单：接收菜单数据并在触发区域内渲染上下文菜单。
 *
 * 以数据驱动（menus）而非插槽逐个声明，便于与路由、权限配置对接；
 * 菜单项的分隔线、禁用与图标等状态都在数据里描述。
 * 默认插槽承载触发区域，菜单内容由组件按数据渲染。
 *
 * @path comm\@core\ui-kit\shadcn-ui\src\components\context-menu\context-menu.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script setup lang="ts">
import type {
  ContextMenuContentProps,
  ContextMenuRootEmits,
  ContextMenuRootProps,
} from 'radix-vue';

import type { ClassType } from '@YDSZ-core/typings';

import type { IContextMenuItem } from './interface';

import { computed } from 'vue';

import { useForwardPropsEmits } from 'radix-vue';

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuTrigger,
} from '../../ui/context-menu';

const props = defineProps<
  ContextMenuRootProps & {
    class?: ClassType;
    contentClass?: ClassType;
    contentProps?: ContextMenuContentProps;
    handlerData?: Record<string, any>;
    itemClass?: ClassType;
    menus: (data: any) => IContextMenuItem[];
  }
>();

const emits = defineEmits<ContextMenuRootEmits>();

const delegatedProps = computed(() => {
  const {
    class: _cls,
    contentClass: _,
    contentProps: _cProps,
    itemClass: _iCls,
    ...delegated
  } = props;

  return delegated;
});

const forwarded = useForwardPropsEmits(delegatedProps, emits);

const menusView = computed(() => {
  return props.menus?.(props.handlerData);
});

function handleClick(menu: IContextMenuItem) {
  if (menu.disabled) {
    return;
  }
  menu?.handler?.(props.handlerData);
}
</script>

<template>
  <ContextMenu v-bind="forwarded">
    <ContextMenuTrigger as-child>
      <slot></slot>
    </ContextMenuTrigger>
    <ContextMenuContent
      :class="contentClass"
      v-bind="contentProps"
      class="side-content z-popup"
      role="menu"
    >
      <template v-for="menu in menusView" :key="menu.key">
        <ContextMenuItem
          :class="itemClass"
          :disabled="menu.disabled"
          :inset="menu.inset || !menu.icon"
          class="cursor-pointer"
          role="menuitem"
          :aria-label="menu.text"
          @click="handleClick(menu)"
        >
          <component
            :is="menu.icon"
            v-if="menu.icon"
            class="mr-2 size-4 text-lg"
            aria-hidden="true"
          />

          {{ menu.text }}
          <ContextMenuShortcut v-if="menu.shortcut">
            {{ menu.shortcut }}
          </ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuSeparator v-if="menu.separator" role="separator" />
      </template>
    </ContextMenuContent>
  </ContextMenu>
</template>

