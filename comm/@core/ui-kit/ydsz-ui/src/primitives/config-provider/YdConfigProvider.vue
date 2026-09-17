<script lang="ts" setup">
import { provide } from 'vue';

export interface ConfigContext {
  /** 是否禁用所有交互组件 */
  disabled?: boolean;
  /** 尺寸全局覆盖 */
  size?: 'default' | 'large' | 'small';
  /** 前缀类名 */
  prefixCls?: string;
  /** 本地化文案 */
  locale?: Record<string, string>;
  /** 空状态图片 */
  renderEmpty?: () => any;
  /** wave 动画 */
  wave?: { disabled?: boolean };
}

const props = withDefaults(
  defineProps<{
    config?: ConfigContext;
  }>(),
  {
    config: () => ({}),
  },
);

provide('ydsz-config', props.config);
</script>

<template>
  <slot></slot>
</template>
