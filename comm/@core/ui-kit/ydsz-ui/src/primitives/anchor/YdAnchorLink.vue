<!--
 * Anchor 锚点链接节点（可嵌套）。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\primitives\anchor\YdAnchorLink.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup">
import type { AnchorLinkItem as _AnchorLinkItem } from './index';

import { cn } from '@ydsz-core/shared/utils';

export interface AnchorLinkItem {
  key: string;
  href?: string;
  title: string;
  children?: AnchorLinkItem[];
}

interface Props {
  item: AnchorLinkItem;
  activeKey?: string;
  offset?: number;
  onSelect?: (key: string) => void;
}

const props = defineProps<Props>();
</script>

<template>
  <div>
    <button
      :class="
        cn(
          'text-muted-foreground hover:text-foreground relative py-1 pl-4 text-left text-sm transition-colors',
          activeKey === item.key && 'text-foreground',
        )
      "
      type="button"
      @click="props.onSelect?.(item.key)"
    >
      <!-- 激活指示器 -->
      <span
        v-if="activeKey === item.key"
        class="absolute -left-[1.65rem] top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-primary ring-4 ring-background"
        aria-hidden="true"
      ></span>
      <slot name="link" :item="item">{{ item.title }}</slot>
    </button>
    <!-- 递归子级 -->
    <div v-if="item.children?.length" class="ml-4">
      <YdAnchorLink
        v-for="child in item.children"
        :key="child.key"
        :active-key="activeKey"
        :item="child"
        :offset="offset"
        :on-select="onSelect"
      />
    </div>
  </div>
</template>
