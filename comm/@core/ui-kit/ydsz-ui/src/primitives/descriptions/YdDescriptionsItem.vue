<!--
 * Descriptions 描述项：单个键值对。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\primitives\descriptions\YdDescriptionsItem.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
import { cn } from '@ydsz-core/shared/utils';

export interface DescriptionsItemProps {
  /** 标签样式 */
  labelClass?: string;
  /** 内容样式 */
  contentClass?: string;
  /** 自定义类名 */
  class?: any;
  /** 标签是否加粗 */
  labelBold?: boolean;
  /** 唯一 key */
  key?: string;
  /** 标签文本 */
  label: string;
  /** 标签宽度 */
  labelWidth?: string;
  /** 占据列数 */
  span?: number;
  /** 值区域 */
  value?: string | number;
  /** 自定义值渲染 */
  bordered?: boolean;
  labelAlign?: 'center' | 'left' | 'right';
  layout?: 'horizontal' | 'vertical';
  size?: 'default' | 'small';
}

const props = withDefaults(defineProps<DescriptionsItemProps & { item?: DescriptionsItemProps }>(), {
  bordered: false,
  labelAlign: 'left',
  labelBold: true,
  layout: 'horizontal',
  span: 1,
  size: 'default',
});

// 支持直接使用 <YdDescriptionsItem label="..." value="..." /> 模式
const item = computed(() => props.item ?? props);

import { computed } from 'vue';

const alignClass = computed(() => {
  switch (item.value.labelAlign) {
    case 'center':
      return 'text-center';
    case 'right':
      return 'text-right';
    default:
      return 'text-left';
  }
});
</script>

<template>
  <div
    :class="
      cn(
        'flex',
        item.layout === 'horizontal' ? 'flex-row items-start gap-3' : 'flex-col gap-1',
        item.bordered && 'border-b border-border pb-2',
        item.class,
      )
    "
  >
    <label
      :class="
        cn(
          'text-muted-foreground shrink-0 text-sm',
          item.labelBold && 'font-medium',
          alignClass,
        )
      "
      :style="item.labelWidth ? { width: item.labelWidth } : undefined"
    >
      <slot name="label">{{ item.label }}</slot>
    </label>
    <div :class="cn('text-foreground flex-1 text-sm', item.contentClass)">
      <slot>{{ item.value }}</slot>
    </div>
  </div>
</template>
