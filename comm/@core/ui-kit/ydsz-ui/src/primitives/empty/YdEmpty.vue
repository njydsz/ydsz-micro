<!--
 * Empty 空状态：列表 / 表格无数据时的占位提示。
 *
 * 提供统一的无数据图标 + 文案 + 操作位，语义化为 "无内容"。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\primitives\empty\YdEmpty.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup">
import { cn } from '@ydsz-core/shared/utils';
import { Inbox } from 'lucide-vue-next';

interface Props {
  /** 自定义类名 */
  class?: any;
  /** 描述文案 */
  description?: string;
  /** 是否显示默认图标 */
  showIcon?: boolean;
}

withDefaults(defineProps<Props>(), {
  description: '暂无数据',
  showIcon: true,
});
</script>

<template>
  <div
    :class="
      cn(
        'flex flex-col items-center justify-center px-8 py-12 text-center',
        props.class,
      )
    "
    role="status"
    aria-live="polite"
  >
    <slot name="image">
      <div
        v-if="props.showIcon"
        class="text-muted-foreground/40 mb-4 flex size-16 items-center justify-center rounded-full border-2 border-dashed"
      >
        <Inbox class="size-8" aria-hidden="true" />
      </div>
    </slot>
    <p class="text-muted-foreground mb-4 text-sm">
      {{ props.description }}
    </p>
    <slot></slot>
  </div>
</template>
