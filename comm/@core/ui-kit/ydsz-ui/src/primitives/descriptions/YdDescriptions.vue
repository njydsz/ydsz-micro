<!--
 * Descriptions 描述列表：用于详情页的键值对展示。
 *
 * 受控组件：通过 items 数据驱动渲染多个 YdDescriptionsItem。
 * 支持 horizontal / vertical 布局、边框 / 无边框、1-6 列。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\primitives\descriptions\YdDescriptions.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup">
import { cn } from '@ydsz-core/shared/utils';

import {
  YdDescriptionsItem,
  type DescriptionsItemProps,
} from './YdDescriptionsItem.vue';

/** 描述项定义 */
export type DescriptionsItem = DescriptionsItemProps;

interface Props {
  /** 自定义边框 */
  bordered?: boolean;
  /** 自定义类名 */
  class?: any;
  /** 列数 */
  column?: number;
  /** 描述项列表 */
  items: DescriptionsItem[];
  /** 标签位置 */
  labelAlign?: 'center' | 'left' | 'right';
  /** 标签位置（水平/垂直布局） */
  layout?: 'horizontal' | 'vertical';
  /** 标签列宽度 */
  labelWidth?: string;

  /** 尺寸 */
  size?: 'default' | 'small';
}

const props = withDefaults(defineProps<Props>(), {
  bordered: false,
  column: 3,
  items: () => [],
  labelAlign: 'left',
  layout: 'horizontal',
  size: 'default',
});
</script>

<template>
  <div
    :class="
      cn(
        'grid gap-1',
        props.column && `grid-cols-1 md:grid-cols-${Math.min(props.column, 4)}`,
        props.class,
      )
    "
  >
    <YdDescriptionsItem
      v-for="(item, index) in props.items"
      :key="item.key || index"
      :bordered="props.bordered"
      :item="item"
      :label-align="props.labelAlign"
      :label-width="props.labelWidth"
      :layout="props.layout"
      :size="props.size"
    />
  </div>
</template>
