<!--
 * 基础面包屑：渲染层级路径，支持图标与末级下拉。
 *
 * 末级带下拉是为了在层级很深时展示被折叠的中间节点，避免路径过长撑破顶栏。
 * 点击任意节点以 select 事件抛出路径值，由上层决定是跳转还是仅记录。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\components\breadcrumb\breadcrumb.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
import type { BreadcrumbProps } from './types';

import { ChevronDown } from '@ydsz-core/icons';

import {
  YdBreadcrumb,
  YdBreadcrumbItem,
  YdBreadcrumbLink,
  YdBreadcrumbList,
  YdBreadcrumbPage,
  YdBreadcrumbSeparator,
  YdDropdownMenuSmart,
  YdDropdownMenuContent,
  YdDropdownMenuItem,
  YdDropdownMenuTrigger,
} from '../../primitives';
import { YdIcon } from '../icon';

type Props = BreadcrumbProps;

defineOptions({ name: 'YdBreadcrumb' });
withDefaults(defineProps<Props>(), {
  showIcon: false,
});

const emit = defineEmits<{ select: [string] }>();

function handleClick(path?: string) {
  if (!path) {
    return;
  }
  emit('select', path);
}
</script>
<template>
  <YdBreadcrumb aria-label="面包屑导航">
    <YdBreadcrumbList>
      <TransitionGroup name="breadcrumb-transition">
        <template
          v-for="(item, index) in breadcrumbs"
          :key="`${item.path}-${item.title}-${index}`"
        >
          <YdBreadcrumbItem>
            <div v-if="item.items?.length ?? 0 > 0">
              <YdDropdownMenuSmart>
                <YdDropdownMenuTrigger class="flex items-center gap-1" aria-haspopup="menu">
                  <YdIcon v-if="showIcon" :icon="item.icon" class="size-5" aria-hidden="true" />
                  {{ item.title }}
                  <ChevronDown class="size-4" aria-hidden="true" />
                </YdDropdownMenuTrigger>
                <YdDropdownMenuContent align="start" role="menu">
                  <template
                    v-for="menuItem in item.items"
                    :key="`sub-${menuItem.path}`"
                  >
                    <YdDropdownMenuItem role="menuitem" @click.stop="handleClick(menuItem.path)">
                      {{ menuItem.title }}
                    </YdDropdownMenuItem>
                  </template>
                </YdDropdownMenuContent>
              </YdDropdownMenuSmart>
            </div>
            <YdBreadcrumbLink
              v-else-if="index !== breadcrumbs.length - 1"
              href="javascript:void 0"
              :aria-label="`导航到 ${item.title}`"
              @click.stop="handleClick(item.path)"
            >
              <div class="flex-center">
                <YdIcon
                  v-if="showIcon"
                  :class="{ 'size-5': item.isHome }"
                  :icon="item.icon"
                  class="mr-1 size-4"
                  aria-hidden="true"
                />
                {{ item.title }}
              </div>
            </YdBreadcrumbLink>
            <YdBreadcrumbPage v-else :aria-current="index === breadcrumbs.length - 1 ? 'page' : undefined">
              <div class="flex-center">
                <YdIcon
                  v-if="showIcon"
                  :class="{ 'size-5': item.isHome }"
                  :icon="item.icon"
                  class="mr-1 size-4"
                  aria-hidden="true"
                />
                {{ item.title }}
              </div>
            </YdBreadcrumbPage>
            <YdBreadcrumbSeparator
              v-if="index < breadcrumbs.length - 1 && !item.isHome"
              aria-hidden="true"
            />
          </YdBreadcrumbItem>
        </template>
      </TransitionGroup>
    </YdBreadcrumbList>
  </YdBreadcrumb>
</template>

